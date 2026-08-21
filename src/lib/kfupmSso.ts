// KFUPM SAML SSO — browser-side initiation.
//
// We build the SAML AuthnRequest here and POST it to KFUPM's ADFS
// endpoint using the HTTP-POST binding (base64-encoded, no deflate
// library required). This avoids the round-trip to the initKfupmSso
// Cloud Function, which was returning 404 because the functions were
// never deployed.

const KFUPM_SSO_URL = 'https://sts.kfupm.edu.sa/adfs/ls/';
const SP_ENTITY_ID = 'https://myprojectplatform.com/saml/sp';
const ACS_URL = 'https://myprojectplatform.com/api/saml/acs';

/**
 * Initiates KFUPM SSO login by building a SAML AuthnRequest in the
 * browser and POSTing it to KFUPM's ADFS login page.
 */
export const initiateKfupmSso = (returnUrl?: string): void => {
  const requestId = '_' + Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
  const issueInstant = new Date().toISOString();
  const relayState = returnUrl || '/home';

  const authnRequest = `<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
  AssertionConsumerServiceURL="${ACS_URL}"
  Destination="${KFUPM_SSO_URL}">
  <saml:Issuer>${SP_ENTITY_ID}</saml:Issuer>
  <samlp:NameIDPolicy
    AllowCreate="true"
    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"/>
</samlp:AuthnRequest>`;

  // Base64-encode the XML for HTTP-POST binding
  const encoded = btoa(unescape(encodeURIComponent(authnRequest)));

  // Create and submit a hidden form to POST the SAML request to ADFS
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = KFUPM_SSO_URL;
  form.style.display = 'none';

  const samlInput = document.createElement('input');
  samlInput.type = 'hidden';
  samlInput.name = 'SAMLRequest';
  samlInput.value = encoded;
  form.appendChild(samlInput);

  const relayInput = document.createElement('input');
  relayInput.type = 'hidden';
  relayInput.name = 'RelayState';
  relayInput.value = relayState;
  form.appendChild(relayInput);

  document.body.appendChild(form);
  form.submit();
};
