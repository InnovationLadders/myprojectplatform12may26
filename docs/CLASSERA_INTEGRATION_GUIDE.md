# Classera LMS Integration Guide (Tool Provider)

## Overview
This guide explains how to integrate MyProject Platform with Classera LMS as an LTI 1.3 Tool Provider using webview login authentication.

## Architecture
- **Platform**: Classera LMS
- **Tool**: MyProject Platform
- **Authentication**: Webview Login with API verification
- **Standard**: LTI 1.3 Tool Provider

## Prerequisites
1. Classera Partner Account with Tool Provider permissions
2. Access tokens for staging and production environments
3. SSL certificate for production deployment
4. Backend server for secure token generation (production)

## Configuration

### 1. Environment Setup

#### Official Configuration from Classera:
- **Tool Name**: MyProjects Platform
- **Client ID**: 5ee30a16-c764-47d1-8314-effae92c950a
- **Platform Issuer**: https://partners.classera.com
- **Deployment ID**: 27
- **Partner Name**: MOU
- **KID**: 68d8c42617d92

#### Development Environment
- Host: `partners-stg.classera.com`
- Access Token: `e815fcea52034d3bd84cc47fcf0bd713c6094519`
- Webview URL: `https://partners-stg.classera.com/users/login_webview`
- API Domain: `https://api-stg.classera.com/`

#### Production Environment
- Host: `me.classera.com`
- Access Token: `e469dc5086ef1491afaece7452ff3dd8d5e2a73a`
- Webview URL: `https://me.classera.com/users/login_webview`
- API Domain: `https://api.classera.com/`

### 2. LTI Tool Configuration

#### Required URLs for Classera Configuration:
```
Initiate Login URL: https://yourdomain.com/api/lti/login
Target Link URI: https://yourdomain.com/lti/launch
Deep Link URI: https://myprojectplatform.com/lti/lanuch
JWKS URL: https://yourdomain.com/.well-known/jwks.json
Classera JWKS URL: https://partners.classera.com/.well-known/openid-configuration/partners-auto-jwks?id=676
Access Token URL: https://api-stg.classera.com/LtiProviders/LtiAccessToken?id=676
Auth URL: https://partners.classera.com/automation_auth
```

#### Tool Settings:
- **Tool Name**: MyProjects Platform
- **Description**: منصة إدارة المشاريع المدرسية
- **Privacy Level**: Public
- **Course Navigation**: Enabled
- **Accept Types**: ["html","ltiResourceLink","image","file","link","application/pdf"]
- **Accept Presentation Document Target**: ["iframe","window","embed","frame","popup"]
- **Client ID**: 5ee30a16-c764-47d1-8314-effae92c950a
- **Platform Issuer**: https://partners.classera.com
- **Deployment ID**: 27
- **Partner Name**: MOU
- **KID**: 68d8c42617d92

### 3. Test Accounts

#### Enabled Accounts (Production - me.classera.com):
- **Admin**: `Hasan4ts0004` / `Class@987`
- **Student**: `hasan4s0007` / `Class@987`
- **Teacher**: `Hasan4t0002` / `Class@987`
- **New Student**: `LtmStdPartner` / `Class@987`
- **New Teacher**: `LtmTeacherPartner` / `Class@987`
- **Supervisor**: `LtmSupervisorPartner` / `Class@987`

#### Enabled Accounts (Staging - partners-stg.classera.com):
- **Admin**: `aed2ts0001` / `Class@987`
- **Student**: `aed2s1228` / `Class@987`
- **Student 2**: `aed2s0003` / `Class@987`
- **Teacher**: `aed2t0001` / `Class@987`
- **New Student**: `LtmStdPartner` / `Class@987`
- **New Teacher**: `LtmTeacherPartner` / `Class@987`
- **Supervisor**: `LtmSupervisorPartner` / `Class@987`

## Implementation

### 1. Webview Login Flow

```typescript
// 1. Open webview login popup
const authToken = await openClasseraWebviewLogin();

// 2. Verify user with Classera API
const apiResponse = await verifyClasseraUser(authToken);

// 3. Create/update user in our system
const user = await createOrUpdateUserFromClassera(userData, apiResponse);

// 4. Generate custom token and sign in
const customToken = await generateCustomTokenForUser(user.id);
await signInWithCustomToken(auth, customToken);
```

### 2. API Verification

```typescript
// POST to https://api.classera.com/api/v1/partner/check-user
{
  "access_token": "your-access-token",
  "auth_token": "user-auth-token-from-webview",
  "partner_name": "mashroui-platform"
}

// Response
{
  "user_id": "NQF9ziSYj25GaHtMB3VELQC1E9",
  "LTM enabled": "1",
  "enabled": "1",
  "role": "Student",
  "success": true
}
```

### 3. User Data Extraction

The webview URL contains user data in the path:
```
/token:JWT_TOKEN/user_id:USER_ID/name:USER_NAME/type:USER_TYPE/...
```

Extract and parse this data to create user profiles.

### 4. Backend Requirements (Production)

#### Custom Token Generation
```javascript
// Backend endpoint: /api/auth/generate-custom-token
const admin = require('firebase-admin');

app.post('/api/auth/generate-custom-token', async (req, res) => {
  try {
    const { userId } = req.body;
    const customToken = await admin.auth().createCustomToken(userId);
    res.json({ customToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### LTI Endpoints
```javascript
// LTI Login Initiation
app.post('/api/lti/login', (req, res) => {
  // Handle OIDC login initiation
});

// LTI Launch
app.post('/lti/launch', (req, res) => {
  // Handle LTI launch with ID token
});

// JWKS Endpoint
app.get('/.well-known/jwks.json', (req, res) => {
  // Serve public keys for JWT verification
});
```

## Security Considerations

1. **Token Validation**: Always validate auth tokens with Classera API
2. **HTTPS Required**: All endpoints must use HTTPS in production
3. **JWKS Security**: Protect private keys and rotate regularly
4. **User Verification**: Verify user is enabled for partner integration
5. **Session Management**: Implement proper session handling

## Testing

### 1. Test Webview Login
1. Navigate to `/auth/classera`
2. Click "تسجيل الدخول عبر Classera"
3. Use enabled test accounts
4. Verify successful authentication and user creation

### 2. Test API Verification
1. Extract auth token from webview URL
2. Call verification API with token
3. Verify response indicates user is enabled

### 3. Test LTI Launch (Future)
1. Configure tool in Classera LMS
2. Launch tool from course
3. Verify proper user authentication and context

## Troubleshooting

### Common Issues
1. **Popup Blocked**: Ensure popups are allowed for the domain
2. **Invalid Token**: Check token format and expiration
3. **User Not Enabled**: Verify user has partner access in Classera
4. **API Errors**: Check access token and partner name
5. **CORS Issues**: Configure proper CORS headers

### Debug Mode
Enable debug logging by setting `DEBUG_CLASSERA=true` in environment variables.

## Grade Passback

### Implementation
```typescript
// Send grade to Classera
await sendGradeToClassera(userId, projectId, grade, maxGrade);
```

### LTI AGS Integration
Implement Assignment and Grade Services (AGS) for automatic grade synchronization.

## Next Steps
1. Obtain production access tokens from Classera
2. Generate RSA key pair for JWT signing
3. Implement backend endpoints for token generation
4. Configure LTI tool in Classera admin panel
5. Test integration in staging environment
6. Deploy to production with monitoring

## Support
For technical support with Classera integration:
- Email: support@classera.com
- Documentation: https://docs.classera.com/lti
- Partner Portal: https://partners.classera.com