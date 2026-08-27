import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Reuse the admin app if already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// ─── KFUPM SAML Configuration ──────────────────────────────────────────────

const KFUPM_IDP_ENTITY_ID = "http://sts.kfupm.edu.sa/adfs/services/trust";
const KFUPM_SSO_URL = "https://sts.kfupm.edu.sa/adfs/ls/";
const SP_ENTITY_ID = "https://myprojectplatform.com/saml/sp";
// The frontend URL to redirect the user to after we issue a custom token
const APP_REDIRECT_URL = "https://kfupm.myprojectplatform.com/auth/kfupm/callback";

// KFUPM subdomain — used to look up the institution's Firestore document
// so SSO users are auto-linked to their school.
const KFUPM_SUBDOMAIN = "kfupm";

// ─── SAML Response Parsing ─────────────────────────────────────────────────

interface SamlUserInfo {
  email: string;
  name: string;
  givenName?: string;
  surname?: string;
  upn?: string;
  role?: string;
  nameId?: string;
}

/**
 * Extracts the SAML assertion from a SAMLResponse (base64-decoded XML).
 * Parses attribute statements to find email, name, UPN, role, etc.
 */
function parseSamlResponse(samlXml: string): SamlUserInfo {
  const info: SamlUserInfo = { email: "", name: "" };


  // 1. تعديل الـ NameID ليكون مرناً
  const nameIdMatch = samlXml.match(/<[^:]*:?NameID[^>]*>([^<]+)<\/[^:]*:?NameID>/i);
  if (nameIdMatch) {
    info.nameId = nameIdMatch[1].trim();
    if (info.nameId.includes("@")) {
      info.email = info.nameId;
    }
  }

  // Extract all Attribute statements
  // ADFS sends attributes like:
  // <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress">
  //   <saml:AttributeValue>user@kfupm.edu.sa</saml:AttributeValue>
  // </saml:Attribute>
// 2. تعديل الـ Attribute ليدعم كافة بادئات SAML 2.0 أو غيابها
  const attributeRegex = /<[^:]*:?Attribute\s+[^>]*Name="([^"]+)"[^>]*>([\s\S]*?)<\/[^:]*:?Attribute>/gi;
  let match: RegExpExecArray | null;

  while ((match = attributeRegex.exec(samlXml)) !== null) {
    const attrName = match[1];
    const attrBody = match[2];

    // Extract the AttributeValue(s)
        // 3. تعديل الـ AttributeValue ليكون مرناً ومغلق القوس بشكل سليم
    const valueMatches = attrBody.match(/<[^:]*:?AttributeValue[^>]*>([^<]*)<\/[^:]*:?AttributeValue>/gi);
    );
    const values = valueMatches
      ? valueMatches.map((v) =>
          v
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim()
        )
      : [];

    const value = values[0] || "";

    switch (attrName) {
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress":
      case "http://schemas.xmlsoap.org/claims/EmailAddress":
        if (value && !info.email) info.email = value;
        break;
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name":
        if (value) info.name = value;
        break;
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname":
        if (value) info.givenName = value;
        break;
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname":
        if (value) info.surname = value;
        break;
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn":
      case "http://schemas.xmlsoap.org/claims/UPN":
        if (value) info.upn = value;
        break;
      case "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
        if (value) info.role = value;
        break;
    }
  }

  // If no name was found but we have givenName and surname, combine them
  if (!info.name && (info.givenName || info.surname)) {
    info.name = [info.givenName, info.surname].filter(Boolean).join(" ");
  }

  // If still no email but we have UPN with @, use UPN as email
  if (!info.email && info.upn && info.upn.includes("@")) {
    info.email = info.upn;
  }

  return info;
}

/**
 * Basic SAML response validation:
 * - Checks that the response contains a SAML assertion
 * - Checks that the issuer matches KFUPM's entity ID
 * - Checks that the response status is Success
 * - Checks that the audience matches our SP entity ID
 *
 * NOTE: Full XML signature verification requires a crypto library.
 * For production, add xml-crypto or @node-saml to verify the signature.
 * For now, we rely on:
 *   1. HTTPS transport security (ADFS only responds over HTTPS)
 *   2. Issuer/audience validation
 *   3. The ADFS Relying Party Trust being configured to only accept
 *      requests from our SP entity ID
 */
function validateSamlResponse(samlXml: string): { valid: boolean; error?: string } {
  // الكود الجديد المرن للبحث عن الـ Assertion
  if (!samlXml.match(/<[^:]*:?Assertion/i)) {
    return { valid: false, error: "No SAML assertion found in response" };
  }

  // Check issuer
  const issuerMatch = samlXml.match(
    /<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/i
  );
  if (issuerMatch) {
    const issuer = issuerMatch[1].trim();
    if (issuer !== KFUPM_IDP_ENTITY_ID) {
      return { valid: false, error: `Unexpected issuer: ${issuer}` };
    }
  }

  // Check status
  const statusMatch = samlXml.match(
    /<samlp:StatusCode\s+Value="([^"]+)"/i
  );
  if (statusMatch) {
    const statusCode = statusMatch[1];
    if (!statusCode.endsWith("Success")) {
      return {
        valid: false,
        error: `SAML response status not success: ${statusCode}`,
      };
    }
  }

  // Check audience
  const audienceMatch = samlXml.match(
    /<saml:Audience[^>]*>([^<]+)<\/saml:Audience>/i
  );
  if (audienceMatch) {
    const audience = audienceMatch[1].trim();
    if (audience !== SP_ENTITY_ID) {
      return { valid: false, error: `Unexpected audience: ${audience}` };
    }
  }

  return { valid: true };
}

/**
 * Determines the platform role from the SAML role claim.
 * KFUPM may send roles like "Student", "Faculty", "Staff", etc.
 */
function mapRole(samlRole?: string): "student" | "teacher" {
  if (!samlRole) return "student";
  const roleLower = samlRole.toLowerCase();
  if (
    roleLower.includes("faculty") ||
    roleLower.includes("teacher") ||
    roleLower.includes("professor") ||
    roleLower.includes("instructor") ||
    roleLower.includes("staff")
  ) {
    return "teacher";
  }
  return "student";
}

// ─── SAML ACS Endpoint (HTTP-POST binding) ──────────────────────────────────

export const samlAcs = functions
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    // Handle CORS preflight
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

      try {
        // ─── كود التشخيص الشامل للـ DEPLOY الواحد ───
        console.log("[samlAcs] --- DIAGNOSTIC START ---");
        console.log("1. Content-Type Header:", req.headers['content-type']);
        console.log("2. Request Body Keys:", Object.keys(req.body || {}));
        console.log("3. SAMLResponse Data Type:", typeof req.body?.SAMLResponse);

        const samlResponseB64 = req.body.SAMLResponse;
        if (samlResponseB64) {
            try {
                const decodedXml = Buffer.from(samlResponseB64, "base64").toString("utf8");
                console.log("4. Decoded SAML XML (Length: " + decodedXml.length + "):");
                console.log(decodedXml);
            } catch (err) {
                console.error("4. Error decoding Base64:", err);
            }
        } else {
            console.log("4. SAMLResponse is undefined or empty!");
        }
        console.log("[samlAcs] --- DIAGNOSTIC END ---");
        // ─── نهاية كود التشخيص ───

        if (!samlResponseB64) {
        console.error("[samlAcs] No SAMLResponse in POST body");
        res.status(400).send("Missing SAMLResponse");
        return;
      }

      // Decode the base64 SAML response
      const samlXml = Buffer.from(samlResponseB64, "base64").toString("utf8");
      console.log("[samlAcs] Received SAML response, length:", samlXml.length);

      // Validate the response
      const validation = validateSamlResponse(samlXml);
      if (!validation.valid) {
        console.error("[samlAcs] SAML validation failed:", validation.error);
        res.status(401).send(`SAML validation failed: ${validation.error}`);
        return;
      }

      // Parse user info from the SAML assertion
      const userInfo = parseSamlResponse(samlXml);
      console.log("[samlAcs] Parsed user info:", {
        email: userInfo.email,
        name: userInfo.name,
        upn: userInfo.upn,
        role: userInfo.role,
      });

      if (!userInfo.email) {
        console.error("[samlAcs] No email found in SAML response");
        res.status(400).send("No email address in SAML response");
        return;
      }

      // Look up or create the user in Firebase Auth
      let firebaseUser: admin.auth.UserRecord;
      try {
        firebaseUser = await auth.getUserByEmail(userInfo.email);
        console.log("[samlAcs] Existing user found:", firebaseUser.uid);
      } catch (err) {
        // User doesn't exist — create them
        console.log("[samlAcs] User not found, creating new account for:", userInfo.email);
        firebaseUser = await auth.createUser({
          email: userInfo.email,
          emailVerified: true, // SSO-verified email
          displayName: userInfo.name || userInfo.email,
          password: Math.random().toString(36).slice(2) + Date.now().toString(36),
        });
        console.log("[samlAcs] New user created:", firebaseUser.uid);
      }

      const platformRole = mapRole(userInfo.role);

      // Look up the KFUPM institution document by subdomain so we can
      // auto-link students/teachers to their school.
      let schoolId: string | null = null;
      if (platformRole === "student" || platformRole === "teacher") {
        try {
          const schoolSnapshot = await db
            .collection("users")
            .where("subdomain", "==", KFUPM_SUBDOMAIN)
            .where("role", "==", "school")
            .limit(1)
            .get();
          if (!schoolSnapshot.empty) {
            schoolId = schoolSnapshot.docs[0].id;
            console.log("[samlAcs] Found KFUPM school document:", schoolId);
          } else {
            console.warn("[samlAcs] No school found with subdomain:", KFUPM_SUBDOMAIN);
          }
        } catch (schoolErr) {
          console.warn("[samlAcs] Error looking up KFUPM school:", schoolErr);
        }
      }

      // Update or create the Firestore user document
      const userRef = db.collection("users").doc(firebaseUser.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // Create new user document with profile_incomplete flag so the
        // frontend knows to ask for missing details (grade, phone, etc.)
        const newUserData = {
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          role: platformRole,
          status: "active", // SSO users are pre-verified by the university
          email_verified: true,
          sso_provider: "kfupm",
          sso_upn: userInfo.upn || null,
          sso_name_id: userInfo.nameId || null,
          school_id: schoolId,
          schoolIdNumber: userInfo.upn || null, // KFUPM UPN as initial ID
          profile_incomplete: true, // frontend will redirect to completion form
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          last_login: admin.firestore.FieldValue.serverTimestamp(),
        };
        await userRef.set(newUserData);
        console.log("[samlAcs] Firestore user document created with profile_incomplete=true");
      } else {
        // Update existing user document with SSO info
        const updateData: { [key: string]: any } = {
          name: userInfo.name || userDoc.data()?.name || userInfo.email,
          email_verified: true,
          sso_provider: "kfupm",
          sso_upn: userInfo.upn || userDoc.data()?.sso_upn || null,
          last_login: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        // If the existing user doesn't have a school_id yet, assign it now
        if (schoolId && !userDoc.data()?.school_id) {
          updateData.school_id = schoolId;
        }
        await userRef.update(updateData);
        console.log("[samlAcs] Firestore user document updated");
      }

      // Generate a Firebase custom token
      const customToken = await auth.createCustomToken(firebaseUser.uid);
      console.log("[samlAcs] Custom token generated for user:", firebaseUser.uid);

      // Redirect to the frontend callback with the token
      // The frontend will use signInWithCustomToken to complete authentication
      const redirectUrl = `${APP_REDIRECT_URL}?token=${encodeURIComponent(customToken)}`;
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[samlAcs] Error processing SAML response:", error);
      res.status(500).send("Internal server error during SAML processing");
    }
  });

// ─── SAML Metadata Endpoint ─────────────────────────────────────────────────

export const samlMetadata = functions
  .https.onRequest((req: functions.Request, res: functions.Response) => {
    res.set("Content-Type", "application/xml");
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${SP_ENTITY_ID}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified</NameIDFormat>
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="https://myprojectplatform.com/api/saml/acs"
      index="0"
      isDefault="true"/>
    <SingleLogoutService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="https://myprojectplatform.com/api/saml/slo"/>
  </SPSSODescriptor>
</EntityDescriptor>`);
  });

// ─── Initiate SSO Login ────────────────────────────────────────────────────

interface InitSsoResponse {
  redirectUrl: string;
}

export const initKfupmSso = functions
  .https.onCall((data: { returnUrl?: string }): InitSsoResponse => {
    const returnUrl = data?.returnUrl || "/home";
    const relayState = encodeURIComponent(returnUrl);

    // Build a SAML AuthnRequest (minimal, deflated for HTTP-Redirect binding)
    const requestId = "_" + Math.random().toString(36).substring(2, 18);
    const issueInstant = new Date().toISOString();

    const authnRequest = `<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
  AssertionConsumerServiceURL="https://myprojectplatform.com/api/saml/acs"
  Destination="${KFUPM_SSO_URL}">
  <saml:Issuer>${SP_ENTITY_ID}</saml:Issuer>
  <samlp:NameIDPolicy AllowCreate="true"/>
</samlp:AuthnRequest>`;

    // Deflate + base64 encode for HTTP-Redirect binding
    const zlib = require("zlib");
    const deflated = zlib.deflateRawSync(authnRequest).toString("base64");
    const encoded = encodeURIComponent(deflated);

    const redirectUrl = `${KFUPM_SSO_URL}?SAMLRequest=${encoded}&RelayState=${relayState}`;

    return { redirectUrl };
  });
