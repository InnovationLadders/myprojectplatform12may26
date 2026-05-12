import { auth, db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { signInWithCustomToken, createUserWithEmailAndPassword } from 'firebase/auth';

// Classera Configuration for Tool Provider
export const CLASSERA_CONFIG = {
  // Tool Provider Configuration
  TOOL_NAME: 'MyProjects Platform',
  TOOL_DESCRIPTION: 'منصة إدارة المشاريع الطلابية',
  TOOL_VERSION: '1.0.0',

  // Official LTI Tool Configuration from Classera
  INITIATE_LOGIN_URL: 'https://myprojectplatform.com/api/lti/login',
  TARGET_LINK_URI: 'https://myprojectplatform.com/lti/lanuch',
  DEEP_LINK_URI: 'https://myprojectplatform.com/lti/lanuch',
  JWKS_URL: 'https://myprojectplatform.com/.well-known/jwks.json',

  // Classera Platform Configuration
  CLIENT_ID: '5ee30a16-c764-47d1-8314-effae92c950a',
  PLATFORM_ISSUER: 'https://partners.classera.com',
  KID: '68d8c42617d92',
  CLASSERA_JWKS_URL: 'https://partners.classera.com/.well-known/openid-configuration/partners-auto-jwks?id=676',

  // New Classera API Configuration
  CLASSERA_ACCESS_TOKEN_URL: 'https://api-stg.classera.com/LtiProviders/LtiAccessToken?id=676',
  CLASSERA_AUTH_URL: 'https://partners.classera.com/automation_auth',
  CLASSERA_API_DOMAIN: 'https://api-stg.classera.com/',
  DEPLOYMENT_ID: '27',

  // Accept Types and Presentation Targets
  ACCEPT_TYPES: ['html', 'ltiResourceLink', 'image', 'file', 'link', 'application/pdf'],
  ACCEPT_PRESENTATION_TARGETS: ['iframe', 'window', 'embed', 'frame', 'popup'],

  // Webview Login Configuration
  STAGING_HOST: 'partners-stg.classera.com', // Fixed typo from 'partnerstg'
  PRODUCTION_HOST: 'me.classera.com',

  // API Configuration
  STAGING_ACCESS_TOKEN: 'e815fcea52034d3bd84cc47fcf0bd713c6094519',
  PRODUCTION_ACCESS_TOKEN: 'e469dc5086ef1491afaece7452ff3dd8d5e2a73a',

  PARTNER_NAME: 'MOU',

  // Environment detection
  IS_PRODUCTION: window.location.hostname !== 'localhost' && !window.location.hostname.includes('staging'),

  get HOST() {
    return this.IS_PRODUCTION ? this.PRODUCTION_HOST : this.STAGING_HOST;
  },

  get ACCESS_TOKEN() {
    return this.IS_PRODUCTION ? this.PRODUCTION_ACCESS_TOKEN : this.STAGING_ACCESS_TOKEN;
  },

  get WEBVIEW_LOGIN_URL() {
    // Add return URL so Classera redirects back to our callback page
    const returnUrl = encodeURIComponent(`${window.location.origin}/classera-callback.html`);
    return `https://${this.HOST}/users/login_webview?return_url=${returnUrl}`;
  },

  get API_CHECK_URL() {
    return `${this.CLASSERA_API_DOMAIN}api/v1/partner/check-user`;
  }
};

// Log CLASSERA_CONFIG on initialization
console.log('⚙️ CLASSERA_CONFIG: Configuration initialized', {
  IS_PRODUCTION: CLASSERA_CONFIG.IS_PRODUCTION,
  HOST: CLASSERA_CONFIG.HOST,
  TOOL_NAME: CLASSERA_CONFIG.TOOL_NAME,
  CLIENT_ID: CLASSERA_CONFIG.CLIENT_ID,
  WEBVIEW_LOGIN_URL: CLASSERA_CONFIG.WEBVIEW_LOGIN_URL,
  API_CHECK_URL: CLASSERA_CONFIG.API_CHECK_URL,
  hostname: window.location.hostname
});

// Classera User Data Interface
export interface ClasseraUser {
  user_id: string;
  username: string;
  name: string;
  type: 'Student' | 'Teacher' | 'Admin' | 'Supervisor';
  birthdate?: string;
  student_id?: string;
  teacher_id?: string;
  user_school_id?: string;
  role_id?: string;
  status_id?: string;
  user_ssn?: string;
  app_env?: string;
}

// Classera API Response Interface
export interface ClasseraApiResponse {
  user_id: string;
  'LTM enabled': string;
  enabled: string;
  role: string;
  success: boolean;
}

/**
 * Generate LTI Tool Configuration for Classera
 */
export const generateLTIToolConfiguration = () => {
  console.log('🔧 generateLTIToolConfiguration: Generating LTI configuration...');
  const config = {
    client_id: CLASSERA_CONFIG.CLIENT_ID,
    platform_issuer: CLASSERA_CONFIG.PLATFORM_ISSUER,
    title: CLASSERA_CONFIG.TOOL_NAME,
    description: CLASSERA_CONFIG.TOOL_DESCRIPTION,
    target_link_uri: CLASSERA_CONFIG.TARGET_LINK_URI,
    deep_link_uri: CLASSERA_CONFIG.DEEP_LINK_URI,
    oidc_initiation_url: CLASSERA_CONFIG.INITIATE_LOGIN_URL,
    public_jwk_url: CLASSERA_CONFIG.JWKS_URL,
    accept_types: CLASSERA_CONFIG.ACCEPT_TYPES,
    accept_presentation_document_targets: CLASSERA_CONFIG.ACCEPT_PRESENTATION_TARGETS,
    custom_fields: {
      privacy_level: 'public',
      course_navigation_enabled: 'true',
      account_navigation_enabled: 'false'
    },
    extensions: {
      'https://partners.classera.com/placement': {
        course_navigation: {
          enabled: true,
          text: CLASSERA_CONFIG.TOOL_NAME,
          visibility: 'public'
        }
      }
    }
  };
  console.log('✅ generateLTIToolConfiguration: Configuration generated successfully');
  return config;
};

/**
 * Open Classera webview login in popup
 */
export const openClasseraWebviewLogin = (): Promise<{ token: string; userData: any }> => {
  return new Promise((resolve, reject) => {
    console.log('[Classera] Opening webview login popup');
    console.log('[Classera] URL:', CLASSERA_CONFIG.WEBVIEW_LOGIN_URL);

    const width = 500;
    const height = 600;
    const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
    const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'scrollbars=yes',
      'resizable=yes',
      'status=no',
      'toolbar=no',
      'menubar=no',
      'location=no'
    ].join(',');

    let popup: Window | null = null;

    try {
      popup = window.open(CLASSERA_CONFIG.WEBVIEW_LOGIN_URL, 'classera-login', features);
    } catch (e) {
      console.error('[Classera] Exception when opening popup:', e);
    }

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.error('[Classera] Popup blocked by browser');
      console.error('[Classera] popup:', popup);
      console.error('[Classera] popup.closed:', popup?.closed);
      reject(new Error('POPUP_BLOCKED'));
      return;
    }

    // Additional check after a brief delay to ensure it wasn't blocked
    setTimeout(() => {
      if (!popup || popup.closed) {
        console.error('[Classera] Popup was closed immediately after opening (likely blocked)');
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error('POPUP_BLOCKED'));
        }
        return;
      }
    }, 100);

    console.log('[Classera] Popup opened successfully');

    // Try to bring popup to front
    try {
      popup.focus();
    } catch (e) {
      console.warn('[Classera] Could not focus popup:', e);
    }

    let hasResolved = false;
    let checkCount = 0;
    const maxChecks = 300;

    const cleanup = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('message', messageHandler);

      if (popup && !popup.closed) {
        try {
          popup.close();
          console.log('[Classera] Popup closed automatically');
        } catch (e) {
          console.warn('[Classera] Could not close popup:', e);
        }
      }
    };

    const resolveSuccess = (token: string, userData: any) => {
      if (hasResolved) return;
      hasResolved = true;
      console.log('[Classera] Authentication successful');

      // Force close popup immediately before cleanup
      if (popup && !popup.closed) {
        try {
          popup.close();
          console.log('[Classera] Popup force closed in resolveSuccess');
        } catch (e) {
          console.warn('[Classera] Could not force close popup in resolveSuccess:', e);
        }
      }

      cleanup();
      resolve({ token, userData });
    };

    const rejectError = (error: string) => {
      if (hasResolved) return;
      hasResolved = true;
      console.error('[Classera] Authentication failed:', error);
      cleanup();
      reject(new Error(error));
    };

    const messageHandler = (event: MessageEvent) => {
      console.log('[Classera] Message received from origin:', event.origin, 'data:', event.data);

      // Accept messages from classera.com OR our own domain (for callback page)
      const isValidOrigin = event.origin.includes('classera.com') ||
                           event.origin === window.location.origin;

      if (!isValidOrigin) {
        console.log('[Classera] Ignoring message from invalid origin:', event.origin);
        return;
      }

      console.log('[Classera] Valid message received:', event.data);

      if (event.data.type === 'CLASSERA_LOGIN_SUCCESS' && event.data.token) {
        console.log('[Classera] Login success detected, closing popup and resolving');

        // Force close the popup immediately
        if (popup && !popup.closed) {
          try {
            popup.close();
            console.log('[Classera] Popup closed via messageHandler');
          } catch (e) {
            console.warn('[Classera] Could not close popup in messageHandler:', e);
          }
        }

        resolveSuccess(event.data.token, event.data.userData || {});
      } else if (event.data.type === 'CLASSERA_LOGIN_ERROR') {
        rejectError('AUTHENTICATION_FAILED');
      }
    };

    window.addEventListener('message', messageHandler);

    const tryInjectScript = () => {
      try {
        const script = popup.document.createElement('script');
        script.textContent = `
          (function() {
            console.log('[Classera Script] Monitoring script loaded');

            function extractAndNotify() {
              const url = window.location.href;
              console.log('[Classera Script] Checking URL:', url);

              if (url.includes('/login_webview/token:')) {
                console.log('[Classera Script] Token detected in URL');
                const tokenMatch = url.match(/\\/token:([^\\/]+)/);
                const token = tokenMatch ? tokenMatch[1] : null;

                if (token) {
                  console.log('[Classera Script] Token extracted, length:', token.length);
                  const pathParts = url.split('/');
                  const userData = {};

                  pathParts.forEach(part => {
                    if (part.includes(':')) {
                      const colonIndex = part.indexOf(':');
                      const key = part.substring(0, colonIndex);
                      const value = part.substring(colonIndex + 1);
                      if (key !== 'token' && value) {
                        try {
                          userData[key] = decodeURIComponent(value);
                        } catch (e) {
                          userData[key] = value;
                        }
                      }
                    }
                  });

                  console.log('[Classera Script] Sending message to opener with user data:', userData);

                  if (window.opener && !window.opener.closed) {
                    try {
                      window.opener.postMessage({
                        type: 'CLASSERA_LOGIN_SUCCESS',
                        token: token,
                        userData: userData
                      }, '*');
                      console.log('[Classera Script] Message sent to opener with wildcard origin');
                    } catch (e) {
                      console.error('[Classera Script] Error sending message:', e);
                    }

                    // Try to close immediately
                    try {
                      window.close();
                      console.log('[Classera Script] Popup close initiated');
                    } catch (e) {
                      console.error('[Classera Script] Error closing window:', e);
                    }
                  } else {
                    console.log('[Classera Script] No opener window available');
                  }

                  // Backup close attempt
                  setTimeout(() => {
                    try {
                      console.log('[Classera Script] Backup close attempt');
                      window.close();
                    } catch (e) {
                      console.error('[Classera Script] Backup close failed:', e);
                    }
                  }, 100);
                  return true;
                }
              }
              return false;
            }

            if (extractAndNotify()) return;

            let lastUrl = window.location.href;
            const checker = setInterval(() => {
              const currentUrl = window.location.href;
              if (currentUrl !== lastUrl) {
                console.log('[Classera Script] URL changed to:', currentUrl);
                lastUrl = currentUrl;
                if (extractAndNotify()) {
                  clearInterval(checker);
                }
              }
            }, 300);

            window.addEventListener('load', () => {
              console.log('[Classera Script] Page loaded');
              extractAndNotify();
            });

            document.addEventListener('DOMContentLoaded', () => {
              console.log('[Classera Script] DOM loaded');
              extractAndNotify();
            });
          })();
        `;
        popup.document.head.appendChild(script);
        console.log('[Classera] Monitoring script injected successfully');
      } catch (err) {
        console.log('[Classera] Script injection blocked (cross-origin) - will use polling instead');
      }
    };

    setTimeout(() => {
      if (!popup.closed && !hasResolved) {
        tryInjectScript();
      }
    }, 1000);

    const intervalId = setInterval(() => {
      checkCount++;

      if (popup.closed) {
        if (!hasResolved) {
          rejectError('POPUP_CLOSED');
        }
        return;
      }

      if (checkCount >= maxChecks) {
        rejectError('TIMEOUT');
        return;
      }

      // Try multiple times per second to catch the URL before it might change
      try {
        const currentUrl = popup.location?.href;
        if (currentUrl && currentUrl !== 'about:blank' && currentUrl.includes('classera.com')) {
          console.log('[Classera] Checking popup URL:', currentUrl.substring(0, 100) + '...');

          if (currentUrl.includes('/login_webview/token:')) {
            console.log('[Classera] *** TOKEN DETECTED IN POPUP URL ***');
            const tokenMatch = currentUrl.match(/\/token:([^\/]+)/);

            if (tokenMatch) {
              const authToken = tokenMatch[1];
              console.log('[Classera] Token extracted successfully, length:', authToken.length);

              const userIdMatch = currentUrl.match(/\/user_id:([^\/]+)/);
              const nameMatch = currentUrl.match(/\/name:([^\/]+)/);
              const typeMatch = currentUrl.match(/\/type:([^\/]+)/);
              const usernameMatch = currentUrl.match(/\/username:([^\/]+)/);
              const birthdateMatch = currentUrl.match(/\/birthdate:([^\/]+)/);
              const teacherIdMatch = currentUrl.match(/\/teacher_id:([^\/]+)/);
              const studentIdMatch = currentUrl.match(/\/student_id:([^\/]+)/);

              const userData = {
                user_id: userIdMatch ? userIdMatch[1] : '',
                encoded_user_id: userIdMatch ? userIdMatch[1] : '',
                username: usernameMatch ? decodeURIComponent(usernameMatch[1]) : 'classera_user',
                name: nameMatch ? decodeURIComponent(nameMatch[1]) : 'مستخدم Classera',
                type: typeMatch ? decodeURIComponent(typeMatch[1]) : 'Student',
                birthdate: birthdateMatch ? decodeURIComponent(birthdateMatch[1]) : null,
                teacher_id: teacherIdMatch ? decodeURIComponent(teacherIdMatch[1]).trim() : null,
                student_id: studentIdMatch ? decodeURIComponent(studentIdMatch[1]).trim() : null
              };

              Object.keys(userData).forEach(key => {
                if (userData[key] === '' || userData[key] === ' ') {
                  userData[key] = null;
                }
              });

              console.log('[Classera] Extracted user data:', userData);

              // FORCE CLOSE THE POPUP IMMEDIATELY - Multiple attempts
              console.log('[Classera] *** ATTEMPTING TO CLOSE POPUP ***');
              let closeAttempts = 0;
              const closeInterval = setInterval(() => {
                closeAttempts++;
                if (popup && !popup.closed) {
                  try {
                    popup.close();
                    console.log('[Classera] Close attempt', closeAttempts);
                  } catch (e) {
                    console.warn('[Classera] Close attempt failed:', e);
                  }
                } else {
                  console.log('[Classera] Popup confirmed closed');
                  clearInterval(closeInterval);
                }

                if (closeAttempts >= 10) {
                  clearInterval(closeInterval);
                }
              }, 50);

              resolveSuccess(authToken, userData);
              return;
            }
          }
        }
      } catch (e) {
        // Cross-origin error is expected - silently continue
      }
    }, 500);
  });
};

/**
 * Parse Classera webview URL to extract user data
 */
export const parseClasseraWebviewUrl = (url: string): ClasseraUser | null => {
  try {
    console.log('Parsing Classera webview URL:', url);
    
    // Handle the specific Classera URL format: /login_webview/token:JWT/user_id:ID/name:NAME/type:TYPE/...
    const pathParts = url.split('/');
    
    // Extract token from URL
    const tokenPart = pathParts.find(part => part.startsWith('token:'));
    if (!tokenPart) {
      console.log('No token found in URL parts:', pathParts);
      return null;
    }
    
    const token = tokenPart.replace('token:', '');
    console.log('Extracted token from URL:', token.substring(0, 20) + '...');
    
    // Extract user data from URL path parts
    const userIdPart = pathParts.find(part => part.startsWith('user_id:'));
    const namePart = pathParts.find(part => part.startsWith('name:'));
    const typePart = pathParts.find(part => part.startsWith('type:'));
    const birthdatePart = pathParts.find(part => part.startsWith('birthdate:'));
    const usernamePart = pathParts.find(part => part.startsWith('username:'));
    const studentIdPart = pathParts.find(part => part.startsWith('student_id:'));
    const teacherIdPart = pathParts.find(part => part.startsWith('teacher_id:'));
    
    // Also try to decode JWT token for additional data
    let tokenPayload: any = {};
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        tokenPayload = JSON.parse(atob(tokenParts[1]));
        console.log('Decoded JWT token payload:', tokenPayload);
      }
    } catch (jwtError) {
      console.warn('Could not decode JWT token, using URL data only:', jwtError);
    }
    
    const userData = tokenPayload.user_data || {};
    
    const extractedUserData = {
      user_id: userIdPart?.replace('user_id:', '') || userData.encoded_user_id || userData.user_id,
      username: usernamePart?.replace('username:', '') || userData.username || 'classera_user',
      name: namePart ? decodeURIComponent(namePart.replace('name:', '')) : userData.name || 'مستخدم Classera',
      type: (typePart?.replace('type:', '') || 'Student') as ClasseraUser['type'],
      birthdate: birthdatePart?.replace('birthdate:', ''),
      student_id: studentIdPart?.replace('student_id:', '').trim() || userData.student_id || null,
      teacher_id: teacherIdPart?.replace('teacher_id:', '').trim() || userData.teacher_id || null,
      user_school_id: userData.user_school_id,
      role_id: userData.role_id,
      status_id: userData.status_id,
      user_ssn: userData.user_ssn,
      app_env: userData.app_env
    };
    
    // Clean up empty string values
    Object.keys(extractedUserData).forEach(key => {
      if (extractedUserData[key] === '' || extractedUserData[key] === ' ') {
        extractedUserData[key] = null;
      }
    });
    
    console.log('Extracted user data:', extractedUserData);
    return extractedUserData;
  } catch (error) {
    console.error('Error parsing Classera webview URL:', error);
    return null;
  }
};

/**
 * Verify user with Classera API
 */
export const verifyClasseraUser = async (authToken: string): Promise<ClasseraApiResponse> => {
  try {
    console.log('Verifying user with Classera API...');
    console.log('Using access token:', CLASSERA_CONFIG.ACCESS_TOKEN.substring(0, 10) + '...');
    console.log('Using partner name:', CLASSERA_CONFIG.PARTNER_NAME);
    
    const response = await fetch(CLASSERA_CONFIG.API_CHECK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_token: CLASSERA_CONFIG.ACCESS_TOKEN,
        auth_token: authToken,
        partner_name: CLASSERA_CONFIG.PARTNER_NAME // Using "mashroui-platform" as partner name
      })
    });

    console.log('API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.status, response.statusText, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ClasseraApiResponse = await response.json();
    console.log('API response data:', data);
    
    if (!data.success) {
      throw new Error('User verification failed');
    }

    if (data.enabled !== '1') {
      throw new Error('المستخدم غير مفعل في منصة Classera للشراكة');
    }

    console.log('User verification successful:', {
      user_id: data.user_id,
      enabled: data.enabled,
      ltm_enabled: data['LTM enabled'],
      role: data.role
    });
    return data;
  } catch (error) {
    console.error('Error verifying Classera user:', error);
    throw error;
  }
};

/**
 * Handle complete Classera login flow
 */
export const handleClasseraLogin = async (): Promise<void> => {
  try {
    console.log('Starting Classera webview login...');
    
    // Step 1: Open webview login and get token
    let authToken: string;
    let userData: ClasseraUser;
    
    try {
      const loginResult = await openClasseraWebviewLogin();
      authToken = loginResult.token;
      userData = loginResult.userData;
      console.log('Received auth token and user data from webview:', {
        tokenLength: authToken.length,
        userId: userData.user_id,
        username: userData.username,
        name: userData.name,
        type: userData.type
      });
    } catch (popupError) {
      console.error('Popup error:', popupError);
      
      // If popup fails, provide more helpful error message
      if (popupError instanceof Error) {
        if (popupError.message.includes('تم إغلاق نافذة تسجيل الدخول')) {
          throw new Error('تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية. يرجى:\n1. عدم إغلاق النافذة حتى اكتمال تسجيل الدخول\n2. انتظار ظهور الصفحة البيضاء (هذا طبيعي)\n3. المحاولة مرة أخرى');
        } else if (popupError.message.includes('فشل في فتح نافذة')) {
          throw new Error('فشل في فتح نافذة تسجيل الدخول. يرجى:\n1. التأكد من السماح بالنوافذ المنبثقة\n2. تعطيل مانع الإعلانات مؤقتاً\n3. المحاولة مرة أخرى');
        }
      }
      throw popupError;
    }
    
    // Step 2: Verify user with Classera API
    let apiResponse;
    
    try {
      apiResponse = await verifyClasseraUser(authToken);
      console.log('User verified with Classera API:', apiResponse);
    } catch (apiError) {
      console.error('API verification error:', apiError);
      // In development, continue without API verification
      if (import.meta.env.DEV) {
        console.warn('Development mode: Skipping API verification');
        apiResponse = {
          user_id: 'dev_user',
          'LTM enabled': '1',
          enabled: '1',
          role: 'Teacher',
          success: true
        };
      } else {
        throw new Error('فشل في التحقق من المستخدم مع Classera. يرجى المحاولة مرة أخرى.');
      }
    }
    
    // Step 3: Create or update user in our system
    let user;
    
    try {
      user = await createOrUpdateUserFromClassera(userData, apiResponse);
      console.log('User created/updated in our system:', user.id);
    } catch (userError) {
      console.error('Error creating/updating user:', userError);
      throw new Error('فشل في إنشاء/تحديث حساب المستخدم. يرجى المحاولة مرة أخرى.');
    }
    
    // Step 4: Generate custom token for Firebase Auth
    // For development, skip Firebase custom token and simulate success
    if (import.meta.env.DEV) {
      console.log('Development mode: Simulating successful login');
      // In development, we'll just log success and let the auth context handle it
      return;
    }
    
    try {
      const customToken = await generateCustomTokenForUser(user.id);
      
      // Step 5: Sign in with custom token
      await signInWithCustomToken(auth, customToken);
      console.log('User signed in successfully');
    } catch (authError) {
      console.error('Firebase auth error:', authError);
      throw new Error('فشل في تسجيل الدخول إلى النظام. يرجى المحاولة مرة أخرى.');
    }
    
  } catch (error) {
    console.error('Classera login failed:', error);
    throw error;
  }
};

/**
 * Create or update user from Classera data
 */
export const createOrUpdateUserFromClassera = async (
  classeraUser: ClasseraUser, 
  apiResponse: ClasseraApiResponse
) => {
  try {
    // Check if user already exists by Classera user_id
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('classera_user_id', '==', classeraUser.user_id));
    const existingUsers = await getDocs(q);

    let userId: string;
    let userData: any;

    const baseUserData = {
      name: classeraUser.name || 'مستخدم Classera',
      role: mapClasseraRoleToOurRole(classeraUser.type),
      classera_user_id: classeraUser.user_id,
      classera_username: classeraUser.username,
      classera_school_id: classeraUser.user_school_id,
      classera_student_id: classeraUser.student_id,
      classera_teacher_id: classeraUser.teacher_id,
      classera_role_id: classeraUser.role_id,
      classera_enabled: apiResponse.enabled === '1',
      classera_ltm_enabled: apiResponse['LTM enabled'] === '1',
      status: 'active',
      updated_at: serverTimestamp(),
      last_login_at: serverTimestamp(),
      login_source: 'classera'
    };

    if (!existingUsers.empty) {
      // User exists, update their data
      const existingUser = existingUsers.docs[0];
      userId = existingUser.id;
      
      userData = {
        ...baseUserData,
        // Preserve existing email if available
        email: existingUser.data().email || `${classeraUser.username}@classera.local`
      };

      await updateDoc(doc(db, 'users', userId), userData);
    } else {
      // Create new user
      userId = `classera_${classeraUser.user_id}`;
      
      userData = {
        ...baseUserData,
        email: `${classeraUser.username}@classera.local`, // Temporary email
        created_at: serverTimestamp()
      };

      await setDoc(doc(db, 'users', userId), userData);
    }

    return { id: userId, ...userData };
  } catch (error) {
    console.error('Error creating/updating user from Classera:', error);
    throw error;
  }
};

/**
 * Map Classera roles to our platform roles
 */
const mapClasseraRoleToOurRole = (classeraRole: string): string => {
  switch (classeraRole.toLowerCase()) {
    case 'student':
      return 'student';
    case 'teacher':
      return 'teacher';
    case 'admin':
    case 'supervisor':
      return 'admin';
    default:
      return 'student'; // Default to student
  }
};

/**
 * Generate custom token for Firebase Auth
 * Note: This should be implemented on your backend in production
 */
const generateCustomTokenForUser = async (userId: string): Promise<string> => {
  if (import.meta.env.DEV) {
    console.warn('Using mock custom token generation - implement this on your backend in production');
    // In development, we'll create a regular Firebase user
    // This is a simplified approach for development
    return `mock-token-${userId}`;
  }
  
  // In production, call your backend API to generate the custom token
  const response = await fetch('/api/auth/generate-custom-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate custom token');
  }
  
  const data = await response.json();
  return data.customToken;
};

/**
 * Handle LTI launch request
 */
export const handleLTILaunch = async (ltiParams: any) => {
  try {
    console.log('Handling LTI launch:', ltiParams);
    
    // Validate required LTI parameters
    if (!ltiParams.sub || !ltiParams.email) {
      throw new Error('Missing required LTI parameters');
    }

    // Extract user data from LTI claims
    const userData: ClasseraUser = {
      user_id: ltiParams.sub,
      username: ltiParams.preferred_username || ltiParams.email.split('@')[0],
      name: ltiParams.name || `${ltiParams.given_name || ''} ${ltiParams.family_name || ''}`.trim(),
      type: mapLTIRoleToClasseraRole(ltiParams.roles),
      user_school_id: ltiParams.context_id
    };

    // Create or update user
    const user = await createOrUpdateUserFromClassera(userData, {
      user_id: userData.user_id,
      'LTM enabled': '1',
      enabled: '1',
      role: userData.type,
      success: true
    });

    return user;
  } catch (error) {
    console.error('Error handling LTI launch:', error);
    throw error;
  }
};

/**
 * Map LTI roles to Classera roles
 */
const mapLTIRoleToClasseraRole = (ltiRoles: string[]): ClasseraUser['type'] => {
  const roles = ltiRoles.map(role => role.toLowerCase());
  
  if (roles.some(role => role.includes('instructor') || role.includes('teacher'))) {
    return 'Teacher';
  } else if (roles.some(role => role.includes('administrator'))) {
    return 'Admin';
  } else if (roles.some(role => role.includes('contentdeveloper'))) {
    return 'Supervisor';
  } else {
    return 'Student';
  }
};

/**
 * Generate JWKS (JSON Web Key Set) for LTI
 */
export const generateJWKS = () => {
  console.log('🔐 generateJWKS: Generating JWKS...');
  // Official JWKS configuration for MyProject Platform
  // Note: In production, replace with your actual RSA public key
  const jwks = {
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        kid: CLASSERA_CONFIG.KID || 'myproject-platform-key-1',
        alg: 'RS256',
        n: 'your-actual-public-key-modulus-here', // Replace with actual public key modulus
        e: 'AQAB'
      }
    ]
  };
  console.log('✅ generateJWKS: JWKS generated successfully');
  return jwks;
};

/**
 * Validate LTI message signature
 */
export const validateLTISignature = (message: any, signature: string): boolean => {
  // Implement JWT signature validation
  // This should use your private key to validate the signature
  console.log('Validating LTI signature:', { message, signature });
  
  // For development, return true
  if (import.meta.env.DEV) {
    return true;
  }
  
  // Implement actual signature validation in production
  return false;
};

/**
 * Send grade back to Classera (Grade Passback)
 */
export const sendGradeToClassera = async (
  userId: string, 
  projectId: string, 
  grade: number, 
  maxGrade: number = 100
) => {
  try {
    // Get user's Classera data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists() || !userDoc.data().classera_user_id) {
      throw new Error('User not linked to Classera');
    }

    const userData = userDoc.data();
    
    // Prepare grade data
    const gradeData = {
      user_id: userData.classera_user_id,
      project_id: projectId,
      grade: grade,
      max_grade: maxGrade,
      timestamp: new Date().toISOString()
    };

    // In production, send this to Classera's grade passback endpoint
    console.log('Sending grade to Classera:', gradeData);
    
    // For development, just log the action
    if (import.meta.env.DEV) {
      console.log('Grade passback simulated for development');
      return { success: true };
    }

    // Implement actual grade passback API call
    const response = await fetch(`https://api.classera.com/api/v1/partner/grade-passback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLASSERA_CONFIG.ACCESS_TOKEN}`
      },
      body: JSON.stringify(gradeData)
    });

    if (!response.ok) {
      throw new Error('Failed to send grade to Classera');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending grade to Classera:', error);
    throw error;
  }
};

/**
 * Sync user data from Classera
 */
export const syncUserDataFromClassera = async (classeraUserId: string) => {
  try {
    // This would typically call Classera's API to get updated user data
    console.log('Syncing user data from Classera for user:', classeraUserId);
    
    // For development, return mock data
    if (import.meta.env.DEV) {
      return {
        success: true,
        message: 'User data sync simulated for development'
      };
    }

    // Implement actual API call to sync user data
    const response = await fetch(`https://api.classera.com/api/v1/partner/user/${classeraUserId}`, {
      headers: {
        'Authorization': `Bearer ${CLASSERA_CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to sync user data from Classera');
    }

    const userData = await response.json();
    
    // Update user in our database
    const userDoc = await getDoc(doc(db, 'users', `classera_${classeraUserId}`));
    if (userDoc.exists()) {
      await updateDoc(userDoc.ref, {
        ...userData,
        updated_at: serverTimestamp()
      });
    }

    return { success: true, userData };
  } catch (error) {
    console.error('Error syncing user data from Classera:', error);
    throw error;
  }
};