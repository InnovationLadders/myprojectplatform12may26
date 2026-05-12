interface PopupConfig {
  url: string;
  width?: number;
  height?: number;
  timeoutMs?: number;
}

interface PopupResult {
  token: string;
  userData: any;
}

interface PopupWindowFeatures {
  width: number;
  height: number;
  left: number;
  top: number;
  scrollbars: boolean;
  resizable: boolean;
  status: boolean;
  toolbar: boolean;
  menubar: boolean;
  location: boolean;
}

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 600;
const DEFAULT_TIMEOUT = 300000;

function calculatePopupPosition(width: number, height: number): { left: number; top: number } {
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
  return { left, top };
}

function buildWindowFeatures(features: PopupWindowFeatures): string {
  return Object.entries(features)
    .map(([key, value]) => `${key}=${typeof value === 'boolean' ? (value ? 'yes' : 'no') : value}`)
    .join(',');
}

function extractTokenFromUrl(url: string): { token: string | null; userData: any } {
  try {
    const tokenMatch = url.match(/[#&?]token=([^&]+)/);
    if (tokenMatch) {
      return { token: tokenMatch[1], userData: {} };
    }

    if (url.includes('/login_webview/token:') && url.includes('/user_id:')) {
      const pathParts = url.split('/');
      const tokenPart = pathParts.find(part => part.startsWith('token:'));

      if (!tokenPart) {
        return { token: null, userData: {} };
      }

      const token = tokenPart.replace('token:', '');
      const userData: any = {};

      pathParts.forEach(part => {
        if (part.includes(':')) {
          const [key, value] = part.split(':');
          if (key !== 'token' && value) {
            userData[key] = decodeURIComponent(value);
          }
        }
      });

      return { token, userData };
    }

    return { token: null, userData: {} };
  } catch (error) {
    console.error('Error extracting token from URL:', error);
    return { token: null, userData: {} };
  }
}

export function openClasseraPopup(config: PopupConfig): Promise<PopupResult> {
  return new Promise((resolve, reject) => {
    const width = config.width || DEFAULT_WIDTH;
    const height = config.height || DEFAULT_HEIGHT;
    const timeout = config.timeoutMs || DEFAULT_TIMEOUT;

    const { left, top } = calculatePopupPosition(width, height);

    const windowFeatures: PopupWindowFeatures = {
      width,
      height,
      left,
      top,
      scrollbars: true,
      resizable: true,
      status: false,
      toolbar: false,
      menubar: false,
      location: false
    };

    const featuresString = buildWindowFeatures(windowFeatures);

    console.log('[ClasseraPopup] Opening popup with config:', {
      url: config.url,
      width,
      height,
      left,
      top,
      timeout: `${timeout}ms`
    });

    const popup = window.open(config.url, 'classera-login', featuresString);

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.error('[ClasseraPopup] Popup blocked by browser');
      reject(new Error('POPUP_BLOCKED'));
      return;
    }

    console.log('[ClasseraPopup] Popup opened successfully');

    let hasResolved = false;
    let checkCount = 0;
    const maxChecks = Math.floor(timeout / 1000);

    const cleanup = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('message', messageHandler);

      if (popup && !popup.closed) {
        try {
          popup.close();
        } catch (e) {
          console.warn('[ClasseraPopup] Could not close popup:', e);
        }
      }
    };

    const resolveWithResult = (result: PopupResult) => {
      if (hasResolved) return;
      hasResolved = true;
      console.log('[ClasseraPopup] Authentication successful');
      cleanup();
      resolve(result);
    };

    const rejectWithError = (error: Error) => {
      if (hasResolved) return;
      hasResolved = true;
      console.error('[ClasseraPopup] Authentication failed:', error.message);
      cleanup();
      reject(error);
    };

    const messageHandler = (event: MessageEvent) => {
      if (!event.origin.includes('classera.com')) {
        return;
      }

      console.log('[ClasseraPopup] Received message from popup:', event.data);

      if (event.data.type === 'CLASSERA_LOGIN_SUCCESS') {
        if (event.data.token) {
          resolveWithResult({
            token: event.data.token,
            userData: event.data.userData || {}
          });
        } else {
          rejectWithError(new Error('INVALID_TOKEN'));
        }
      } else if (event.data.type === 'CLASSERA_LOGIN_ERROR') {
        rejectWithError(new Error(event.data.error || 'AUTHENTICATION_FAILED'));
      }
    };

    window.addEventListener('message', messageHandler);

    const intervalId = setInterval(() => {
      checkCount++;

      if (popup.closed) {
        if (!hasResolved) {
          console.log('[ClasseraPopup] Popup closed by user');
          rejectWithError(new Error('POPUP_CLOSED'));
        }
        return;
      }

      if (checkCount >= maxChecks) {
        console.log('[ClasseraPopup] Timeout reached');
        rejectWithError(new Error('TIMEOUT'));
        return;
      }

      try {
        const currentUrl = popup.location?.href;
        if (currentUrl && currentUrl !== 'about:blank') {
          const { token, userData } = extractTokenFromUrl(currentUrl);

          if (token) {
            console.log('[ClasseraPopup] Token detected in URL');
            resolveWithResult({ token, userData });
          }
        }
      } catch (e) {
      }
    }, 1000);
  });
}

export function getErrorMessage(error: Error): string {
  const errorMessages: Record<string, string> = {
    'POPUP_BLOCKED': 'فشل في فتح نافذة تسجيل الدخول. يرجى السماح بالنوافذ المنبثقة في متصفحك والمحاولة مرة أخرى.',
    'POPUP_CLOSED': 'تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية. يرجى المحاولة مرة أخرى وعدم إغلاق النافذة حتى اكتمال تسجيل الدخول.',
    'TIMEOUT': 'انتهت مهلة تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    'INVALID_TOKEN': 'تم استلام رمز مصادقة غير صالح. يرجى المحاولة مرة أخرى.',
    'AUTHENTICATION_FAILED': 'فشل في تسجيل الدخول عبر Classera. يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.'
  };

  return errorMessages[error.message] || error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

export function shouldFallbackToRedirect(error: Error, attemptCount: number): boolean {
  return error.message === 'POPUP_BLOCKED' && attemptCount >= 2;
}