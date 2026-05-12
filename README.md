MyProjectPlatform10

## Classera SSO Integration

This platform supports Single Sign-On (SSO) integration with Classera LMS platform.

### Supported Integration Methods

1. **Custom API Integration** (Currently Implemented)
   - OAuth 2.0 authentication flow
   - User data synchronization
   - Webhook notifications

2. **LTI 1.3 Integration** (Ready for Implementation)
   - Standards-based integration
   - Deep linking support
   - Grade passback

3. **SAML 2.0 Integration** (Ready for Implementation)
   - Enterprise SSO
   - Metadata exchange
   - Attribute mapping

### Configuration

Add the following environment variables to your `.env` file:

```
VITE_CLASSERA_API_DOMAIN=https://api-stg.classera.com/
VITE_CLASSERA_WEBHOOK_SECRET=your-webhook-secret-here
VITE_CLASSERA_PARTNER_NAME=MOU
VITE_CLASSERA_CLIENT_ID=5ee30a16-c764-47d1-8314-effae92c950a
VITE_CLASSERA_DEPLOYMENT_ID=27
```

### Features

- **Single Sign-On**: Users can log in using their Classera credentials
- **Data Synchronization**: Automatic sync of schools, teachers, and students
- **Grade Passback**: Share project grades and progress with Classera
- **Webhook Support**: Real-time notifications for data updates

### API Endpoints

- `POST /api/lti/login` - LTI Login Initiation
- `POST /lti/lanuch` - LTI Launch Handler
- `GET /.well-known/jwks.json` - JWKS Endpoint
- `POST /api/classera/webhook` - Webhook for data sync notifications

### Usage

1. Users can click "تسجيل الدخول عبر Classera" on the login page  
2. They will be redirected to Classera webview for authentication
3. After successful authentication, they return to the platform
4. User data is automatically synced and updated
