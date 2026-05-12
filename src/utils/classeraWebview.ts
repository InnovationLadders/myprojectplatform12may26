/**
 * Utility functions for handling Classera webview integration
 */

/**
 * Inject script into Classera webview to handle authentication
 * This script should be injected into the webview popup to capture the auth token
 */
export const getClasseraWebviewScript = () => {
  return `
    (function() {
      // Function to extract token from current URL
      function extractTokenFromUrl() {
        const url = window.location.href;
        const tokenMatch = url.match(/token:([^/]+)/);
        return tokenMatch ? tokenMatch[1] : null;
      }
      
      // Function to extract user data from URL
      function extractUserDataFromUrl() {
        const url = window.location.href;
        const pathParts = url.split('/');
        
        const userData = {};
        pathParts.forEach(part => {
          if (part.includes(':')) {
            const [key, value] = part.split(':');
            userData[key] = decodeURIComponent(value);
          }
        });
        
        return userData;
      }
      
      // Check if we're on a successful login page
      function checkForSuccessfulLogin() {
        const token = extractTokenFromUrl();
        const userData = extractUserDataFromUrl();
        
        if (token && userData.user_id) {
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'CLASSERA_LOGIN_SUCCESS',
              token: token,
              userData: userData,
              url: window.location.href
            }, '*');
          }
          return true;
        }
        return false;
      }
      
      // Check for login errors
      function checkForLoginError() {
        const errorElement = document.querySelector('.alert-danger, .error-message, [class*="error"]');
        if (errorElement) {
          const errorText = errorElement.textContent || errorElement.innerHTML;
          if (window.opener) {
            window.opener.postMessage({
              type: 'CLASSERA_LOGIN_ERROR',
              error: errorText
            }, '*');
          }
          return true;
        }
        return false;
      }
      
      // Monitor for changes in the page
      function monitorPage() {
        // Check immediately
        if (checkForSuccessfulLogin() || checkForLoginError()) {
          return;
        }
        
        // Set up observers for dynamic content
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
              checkForSuccessfulLogin() || checkForLoginError();
            }
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Also check URL changes
        let lastUrl = window.location.href;
        setInterval(() => {
          if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            checkForSuccessfulLogin() || checkForLoginError();
          }
        }, 1000);
      }
      
      // Start monitoring when page is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', monitorPage);
      } else {
        monitorPage();
      }
    })();
  `;
};

/**
 * Create a more robust popup handler for Classera webview
 */
export const createClasseraPopupHandler = () => {
  return {
    openPopup: (url: string): Promise<{ token: string; userData: any }> => {
      return new Promise((resolve, reject) => {
        console.log('Creating Classera popup with enhanced handler...');
        
        const popup = window.open(
          url,
          'classera-login',
          'width=500,height=600,scrollbars=yes,resizable=yes,location=no,status=no,menubar=no,toolbar=no,directories=no,left=' + 
          (screen.width / 2 - 250) + ',top=' + (screen.height / 2 - 300)
        );

        if (!popup) {
          reject(new Error('فشل في فتح نافذة تسجيل الدخول. يرجى السماح بالنوافذ المنبثقة.'));
          return;
        }

        console.log('Popup opened successfully, starting enhanced monitoring...');
        
        let checkCount = 0;
        const maxChecks = 300; // 5 minutes
        let lastUrl = '';
        let hasDetectedSuccess = false;

        // Listen for messages from popup
        const messageListener = (event: MessageEvent) => {
          console.log('Received message from popup:', event);
          
          // Verify origin for security
          if (!event.origin.includes('classera.com')) {
            console.log('Message from non-Classera origin, ignoring:', event.origin);
            return;
          }

          if (event.data.type === 'CLASSERA_LOGIN_SUCCESS') {
            console.log('Received login success message');
            hasDetectedSuccess = true;
            cleanup();
            resolve({
              token: event.data.token,
              userData: event.data.userData
            });
          } else if (event.data.type === 'CLASSERA_LOGIN_ERROR') {
            console.log('Received login error message:', event.data.error);
            cleanup();
            reject(new Error(event.data.error || 'فشل في تسجيل الدخول عبر Classera'));
          }
        };

        // Check popup status periodically
        const statusChecker = setInterval(() => {
          checkCount++;
          
          if (popup.closed) {
            if (!hasDetectedSuccess) {
              console.log('Popup was closed manually by user');
            }
            cleanup();
            return;
          }
          
          if (checkCount >= maxChecks) {
            cleanup();
            reject(new Error('انتهت مهلة تسجيل الدخول'));
            return;
          }
          
          // Monitor popup URL for success indicators
          try {
            const currentUrl = popup.location?.href;
            if (currentUrl && currentUrl !== lastUrl) {
              console.log('Popup URL changed:', currentUrl);
              lastUrl = currentUrl;
              
              // Check for the specific Classera success URL pattern
              if (currentUrl.includes('/login_webview/token:') && currentUrl.includes('/user_id:')) {
                console.log('Found Classera authentication success URL pattern');
                
                // Extract data from URL
                const tokenMatch = currentUrl.match(/\/login_webview\/token:([^\/]+)/);
                const userIdMatch = currentUrl.match(/\/user_id:([^\/]+)/);
                const nameMatch = currentUrl.match(/\/name:([^\/]+)/);
                const typeMatch = currentUrl.match(/\/type:([^\/]+)/);
                const usernameMatch = currentUrl.match(/\/username:([^\/]+)/);
                const birthdateMatch = currentUrl.match(/\/birthdate:([^\/]+)/);
                const teacherIdMatch = currentUrl.match(/\/teacher_id:([^\/]+)/);
                const studentIdMatch = currentUrl.match(/\/student_id:([^\/]+)/);
                
                if (tokenMatch && userIdMatch) {
                  const authToken = tokenMatch[1];
                  const userData = {
                    user_id: userIdMatch[1],
                    encoded_user_id: userIdMatch[1],
                    username: usernameMatch ? usernameMatch[1] : 'classera_user',
                    name: nameMatch ? nameMatch[1] : 'مستخدم Classera',
                    type: typeMatch ? typeMatch[1] : 'Student',
                    birthdate: birthdateMatch ? birthdateMatch[1] : null,
                    teacher_id: teacherIdMatch ? teacherIdMatch[1] : null,
                    student_id: studentIdMatch ? studentIdMatch[1] : null
                  };
                  
                  console.log('Successfully extracted auth token and user data from webview URL');
                  hasDetectedSuccess = true;
                  
                  // Close the popup
                  try {
                    popup.close();
                  } catch (closeError) {
                    console.warn('Could not close popup:', closeError);
                  }
                  
                  cleanup();
                  resolve({ token: authToken, userData });
                  return;
                }
              }
              
              // Check for error indicators
              if (currentUrl.includes('error') || 
                  currentUrl.includes('denied') || 
                  currentUrl.includes('failed')) {
                console.log('Found error indicators in URL');
                cleanup();
                reject(new Error('فشل في تسجيل الدخول - تم رفض المصادقة'));
                return;
              }
            }
          } catch (e) {
            // Cross-origin restrictions prevent URL access - this is expected
          }
        }, 1000);

        const cleanup = () => {
          clearInterval(statusChecker);
          window.removeEventListener('message', messageListener);
          // Only close popup if we haven't detected success and it's still open
          if (!hasDetectedSuccess && popup && !popup.closed) {
            try {
              popup.close();
            } catch (closeError) {
              console.warn('Could not close popup during cleanup:', closeError);
            }
          }
          if (!popup.closed) {
            popup.close();
          }
        };

        window.addEventListener('message', messageListener);
      });
    }
  };
};