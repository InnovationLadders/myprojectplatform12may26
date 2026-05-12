# Admin Dashboard Debugging Logs

This document describes all the logging that has been added to help debug why the admin dashboard is not loading properly.

## Overview

Comprehensive logging has been added throughout the admin dashboard and related components to track:
- Component initialization and lifecycle
- Authentication state changes
- Route access checks
- Configuration initialization
- User interactions (button clicks, tab changes)
- Data loading operations
- Error conditions

## How to Use These Logs

1. Open your browser's developer console (F12 or right-click → Inspect → Console)
2. Navigate to the admin dashboard at `/admin-dashboard`
3. Watch the console logs in real-time as the page loads
4. Look for any error messages or unexpected behavior
5. The logs use emojis to make them easy to scan:
   - 🎯 = Component/Function initialization
   - ✅ = Success
   - ❌ = Error/Failure
   - ⏳ = Loading/Processing
   - 🔄 = State change
   - 🖱️ = User interaction
   - 📊 = Data/Stats
   - ⚙️ = Configuration
   - 🔐 = Authentication
   - 🗺️ = Routing
   - 📦 = Module loading

## Logging Locations

### 1. AdminDashboard Component (`src/pages/admin/AdminDashboard.tsx`)

**Module Loading:**
```
📦 AdminDashboard: Module loaded successfully
```

**Component Lifecycle:**
```
🎯 AdminDashboard: Component initializing...
✅ AdminDashboard: Component mounted successfully
📊 AdminDashboard: Initial activeTab: overview
🔄 AdminDashboard: Component unmounting
```

**Tab Changes:**
```
🔄 AdminDashboard: Active tab changed to: [tab-name]
🖱️ AdminDashboard: Tab clicked: [tab-id] [tab-name]
```

**Rendering:**
```
🎨 AdminDashboard: Rendering component with activeTab: [tab-name]
```

### 2. ClasseraIntegration Component (`src/components/Admin/ClasseraIntegration.tsx`)

**Module Loading:**
```
📦 ClasseraIntegration: Module loaded successfully
```

**Component Lifecycle:**
```
🎯 ClasseraIntegration: Component initializing...
```

**Data Loading:**
```
📂 ClasseraIntegration: useEffect triggered - loading sync batches...
⏳ ClasseraIntegration: Starting sync batch load...
✅ ClasseraIntegration: Sync batches loaded successfully in [X]ms
📊 ClasseraIntegration: Sync batches count: [count]
❌ ClasseraIntegration: Error loading sync batches: [error]
🚫 ClasseraIntegration: Error details: {...}
```

**Configuration Generation:**
```
⚙️ ClasseraIntegration: Generating LTI configuration...
✅ ClasseraIntegration: LTI config generated: {...}
🔐 ClasseraIntegration: Generating JWKS...
✅ ClasseraIntegration: JWKS generated
```

**Rendering States:**
```
⏳ ClasseraIntegration: Rendering loading state...
🎨 ClasseraIntegration: Rendering main content
📊 ClasseraIntegration: Current state: {...}
```

**User Interactions:**
```
🖱️ ClasseraIntegration: Refresh button clicked
🔄 ClasseraIntegration: Refresh completed in [X]ms
🖱️ ClasseraIntegration: Manual sync button clicked
🛠️ ClasseraIntegration: Triggering manual sync with Classera...
🖱️ ClasseraIntegration: Toggle LTI config visibility clicked
🔄 ClasseraIntegration: Current showLTIConfig: [value] -> New value: [value]
🖱️ ClasseraIntegration: Toggle JWKS visibility clicked
🔄 ClasseraIntegration: Current showJWKS: [value] -> New value: [value]
📋 ClasseraIntegration: Attempting to copy field: [field-name]
✅ ClasseraIntegration: Successfully copied to clipboard: [field-name]
❌ ClasseraIntegration: Failed to copy: [error]
```

### 3. CLASSERA_CONFIG (`src/lib/classera.ts`)

**Initialization:**
```
⚙️ CLASSERA_CONFIG: Configuration initialized {
  IS_PRODUCTION: [boolean],
  HOST: [hostname],
  TOOL_NAME: [name],
  CLIENT_ID: [id],
  WEBVIEW_LOGIN_URL: [url],
  API_CHECK_URL: [url],
  hostname: [hostname]
}
```

**Function Calls:**
```
🔧 generateLTIToolConfiguration: Generating LTI configuration...
✅ generateLTIToolConfiguration: Configuration generated successfully
🔐 generateJWKS: Generating JWKS...
✅ generateJWKS: JWKS generated successfully
```

### 4. ProtectedRoute Component (`src/App.tsx`)

**Route Access Checks:**
```
🔐 ProtectedRoute: Checking route access... {
  loading: [boolean],
  hasUser: [boolean],
  userRole: [role],
  userStatus: [status],
  allowedRoles: [array]
}
⏳ ProtectedRoute: Auth loading, showing spinner...
❌ ProtectedRoute: No user found, redirecting to /login
⏸️ ProtectedRoute: User status is pending, redirecting to /pending-activation
🚫 ProtectedRoute: User role not allowed {
  userRole: [role],
  allowedRoles: [array],
  redirectingTo: [path]
}
✅ ProtectedRoute: Access granted, rendering layout with children
```

### 5. AppRoutes Component (`src/App.tsx`)

**Routing:**
```
🗺️ AppRoutes: Rendering routes... {
  loading: [boolean],
  hasUser: [boolean],
  userRole: [role],
  userEmail: [email],
  currentPath: [path]
}
⏳ AppRoutes: Auth loading, showing spinner...
🎯 Route: Rendering /admin-dashboard route
```

### 6. AuthProvider (`src/contexts/AuthContext.tsx`)

**Authentication State:**
```
🔐 AuthProvider: Setting up auth state listener...
🔐 Auth state changed, user: [uid]
❌ AuthProvider: No Firebase user, clearing user state
✅ AuthProvider: Firebase user found, fetching user data...
📄 User document exists in auth state change: [boolean]
👤 User data in auth state change: {...}
✅ AuthProvider: User document found, setting user state with role: [role]
```

## Common Issues and What to Look For

### Issue: Page not rendering at all
**Look for:**
- Missing module loading logs (📦)
- Module import errors in console
- JavaScript errors before component initialization

### Issue: Blank page or infinite loading
**Look for:**
- Authentication loading never completing (⏳)
- Missing "Component mounted successfully" logs
- Route access checks failing
- User role mismatches

### Issue: Redirecting away from admin dashboard
**Look for:**
- 🚫 ProtectedRoute logs showing role not allowed
- User role different from 'admin'
- User status showing as 'pending'

### Issue: Component renders but content missing
**Look for:**
- Tab rendering logs (🎨)
- Active tab state changes
- ClasseraIntegration loading state
- Data loading errors (❌)

### Issue: Configuration errors
**Look for:**
- ⚙️ CLASSERA_CONFIG initialization
- Missing or malformed configuration values
- Environment detection issues (IS_PRODUCTION)

## Filtering Console Logs

To filter logs in the browser console:
- Filter by component: Search for "AdminDashboard" or "ClasseraIntegration"
- Filter by type: Search for emoji like "✅" or "❌"
- Filter by action: Search for keywords like "loading", "mounted", "clicked"

## Next Steps

1. Access the admin dashboard while monitoring the console
2. Note the sequence of logs that appear
3. Identify where the log sequence stops or errors occur
4. Share the console output to help diagnose the specific issue
5. Check for any red error messages in the console

## Build Status

✅ Project builds successfully with all logging in place
- All TypeScript types are valid
- No compilation errors
- No module resolution issues
