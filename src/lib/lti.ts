import { CLASSERA_CONFIG } from './classera';

/**
 * LTI 1.3 Tool Provider Implementation
 */

export interface LTILaunchRequest {
  iss: string; // Issuer (Classera)
  aud: string; // Audience (Our Tool)
  sub: string; // Subject (User ID)
  exp: number; // Expiration
  iat: number; // Issued At
  nonce: string; // Nonce
  
  // LTI Claims
  'https://purl.imsglobal.org/spec/lti/claim/message_type': string;
  'https://purl.imsglobal.org/spec/lti/claim/version': string;
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': string;
  'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
    id: string;
    title?: string;
    description?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/roles': string[];
  'https://purl.imsglobal.org/spec/lti/claim/context': {
    id: string;
    label?: string;
    title?: string;
    type?: string[];
  };
  
  // User Claims
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  preferred_username?: string;
}

/**
 * Handle LTI Login Initiation
 */
export const handleLTILoginInitiation = (request: any) => {
  const {
    iss,
    login_hint,
    target_link_uri,
    lti_message_hint,
    client_id
  } = request;

  // Validate the login initiation request
  if (!iss || !login_hint || !target_link_uri) {
    throw new Error('Invalid LTI login initiation request');
  }

  // Generate authentication request
  const authRequest = {
    response_type: 'id_token',
    client_id: client_id || CLASSERA_CONFIG.CLIENT_ID,
    redirect_uri: target_link_uri,
    login_hint: login_hint,
    state: generateState(),
    nonce: generateNonce(),
    prompt: 'none',
    response_mode: 'form_post',
    scope: 'openid',
    lti_deployment_id: CLASSERA_CONFIG.DEPLOYMENT_ID
  };

  // Redirect to Classera's authorization endpoint
  const authUrl = new URL(CLASSERA_CONFIG.CLASSERA_AUTH_URL);
  Object.entries(authRequest).forEach(([key, value]) => {
    authUrl.searchParams.set(key, value.toString());
  });

  return authUrl.toString();
};

/**
 * Handle LTI Launch
 */
export const handleLTILaunch = async (idToken: string): Promise<any> => {
  try {
    // Decode and validate the ID token
    const payload = await validateIdToken(idToken);
    
    // Extract user and context information
    const userInfo = {
      id: payload.sub,
      name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
      email: payload.email,
      username: payload.preferred_username,
      roles: payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || []
    };

    const contextInfo = {
      id: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.id,
      title: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.title,
      label: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.label
    };

    const resourceInfo = {
      id: payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.id,
      title: payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.title,
      description: payload['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.description
    };

    return {
      user: userInfo,
      context: contextInfo,
      resource: resourceInfo,
      messageType: payload['https://purl.imsglobal.org/spec/lti/claim/message_type'],
      version: payload['https://purl.imsglobal.org/spec/lti/claim/version']
    };
  } catch (error) {
    console.error('Error handling LTI launch:', error);
    throw error;
  }
};

/**
 * Validate ID Token
 */
const validateIdToken = async (idToken: string): Promise<any> => {
  // In production, implement proper JWT validation
  // For development, we'll decode without validation
  if (import.meta.env.DEV) {
    console.warn('Development mode: Skipping ID token validation');
    try {
      const parts = idToken.split('.');
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      throw new Error('Invalid ID token format');
    }
  }

  // Production implementation would:
  // 1. Fetch JWKS from Classera
  // 2. Validate signature
  // 3. Validate claims (iss, aud, exp, etc.)
  // 4. Return validated payload
  
  throw new Error('ID token validation not implemented for production');
};

/**
 * Generate random state parameter
 */
const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Generate random nonce parameter
 */
const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Send Grade Passback to Classera
 */
export const sendGradePassback = async (
  userId: string,
  resourceLinkId: string,
  score: number,
  maxScore: number = 100
) => {
  try {
    // Prepare grade passback data according to LTI AGS specification
    const gradeData = {
      userId: userId,
      scoreGiven: score,
      scoreMaximum: maxScore,
      activityProgress: score === maxScore ? 'Completed' : 'InProgress',
      gradingProgress: 'FullyGraded',
      timestamp: new Date().toISOString()
    };

    console.log('Sending grade passback to Classera:', gradeData);

    // In production, send to Classera's AGS endpoint
    if (import.meta.env.DEV) {
      console.log('Development mode: Grade passback simulated');
      return { success: true };
    }

    // Implement actual grade passback
    const response = await fetch('/api/lti/grade-passback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gradeData)
    });

    if (!response.ok) {
      throw new Error('Failed to send grade passback');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending grade passback:', error);
    throw error;
  }
};

/**
 * Generate JWKS (JSON Web Key Set) for LTI
 */
export const generateJWKS = () => {
  // Official JWKS configuration matching Classera's requirements
  return {
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        kid: CLASSERA_CONFIG.KID,
        alg: 'RS256',
        n: 'myproject-platform-public-key-modulus-replace-with-actual-rsa-key',
        e: 'AQAB'
      }
    ]
  };
};