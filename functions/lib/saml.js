"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.initKfupmSso = exports.samlMetadata = exports.samlAcs = void 0;

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

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
const APP_REDIRECT_URL =
  "https://kfupm.myprojectplatform.com/auth/kfupm/callback";

// KFUPM subdomain — used to look up the institution's Firestore document
const KFUPM_SUBDOMAIN = "kfupm";

/**
 * Decode common XML entities.
 */
function decodeXmlEntities(value) {
  if (!value) {
    return "";
  }

  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .trim();
}

/**
 * Extracts the SAML assertion from a SAMLResponse.
 *
 * This parser intentionally supports different XML namespace prefixes,
 * for example:
 *
 * <saml:Attribute>
 * <saml2:Attribute>
 * <Attribute>
 *
 * ADFS may use different namespace prefixes while still using the same
 * SAML XML namespace.
 */
function parseSamlResponse(samlXml) {
  const info = {
    email: "",
    name: "",
  };

  console.log(
    "[samlAcs] Starting SAML attribute parsing. XML length:",
    samlXml.length,
  );

  // ─────────────────────────────────────────────────────────────────────
  // Extract NameID
  // ─────────────────────────────────────────────────────────────────────

  const nameIdMatch = samlXml.match(
    /<(?:[\w.-]+:)?NameID\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?NameID>/i,
  );

  if (nameIdMatch) {
    info.nameId = decodeXmlEntities(nameIdMatch[1]);

    console.log("[samlAcs] NameID found:", info.nameId);

    // If NameID looks like an email address, use it as email.
    if (info.nameId.includes("@")) {
      info.email = info.nameId;
    }
  } else {
    console.log("[samlAcs] No NameID found");
  }

  // ─────────────────────────────────────────────────────────────────────
  // Extract all Attribute elements
  // ─────────────────────────────────────────────────────────────────────
  //
  // Supports:
  //
  // <saml:Attribute>
  // <saml2:Attribute>
  // <Attribute>
  //
  // This is important because the namespace prefix itself is not
  // semantically important in XML.
  // ─────────────────────────────────────────────────────────────────────

  const attributeRegex =
    /<(?:[\w.-]+:)?Attribute\b[^>]*Name\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?Attribute>/gi;

  let match;
  let attributeCount = 0;

  while ((match = attributeRegex.exec(samlXml)) !== null) {
    attributeCount++;

    const attrName = decodeXmlEntities(match[1]);
    const attrBody = match[2];

    console.log("[samlAcs] Found SAML attribute:", attrName);

    // ─────────────────────────────────────────────────────────────────
    // Extract AttributeValue elements
    // Supports:
    //
    // <saml:AttributeValue>
    // <saml2:AttributeValue>
    // <AttributeValue>
    // ─────────────────────────────────────────────────────────────────

    const valueRegex =
      /<(?:[\w.-]+:)?AttributeValue\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?AttributeValue>/gi;

    const values = [];

    let valueMatch;

    while ((valueMatch = valueRegex.exec(attrBody)) !== null) {
      const value = decodeXmlEntities(valueMatch[1].replace(/<[^>]+>/g, ""));

      if (value) {
        values.push(value);
      }
    }

    const value = values[0] || "";

    console.log("[samlAcs] Attribute value:", {
      name: attrName,
      value: value,
    });

    // ─────────────────────────────────────────────────────────────────
    // Match known KFUPM claims
    // ─────────────────────────────────────────────────────────────────

    switch (attrName) {
      // Email
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress":
      case "http://schemas.xmlsoap.org/claims/EmailAddress":
      case "http://schemas.xmlsoap.org/claims/emailaddress":
      case "email":
      case "emailaddress":
      case "mail":
        if (value && !info.email) {
          info.email = value;
        }
        break;

      // Name
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name":
      case "name":
        if (value) {
          info.name = value;
        }
        break;

      // Given Name
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname":
      case "givenname":
      case "givenName":
        if (value) {
          info.givenName = value;
        }
        break;

      // Surname
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname":
      case "surname":
        if (value) {
          info.surname = value;
        }
        break;

      // UPN
      case "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn":
      case "http://schemas.xmlsoap.org/claims/UPN":
      case "http://schemas.xmlsoap.org/claims/upn":
      case "upn":
        if (value) {
          info.upn = value;
        }
        break;

      // Role
      case "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
      case "role":
        if (value) {
          info.role = value;
        }
        break;

      default:
        console.log("[samlAcs] Unrecognized SAML attribute:", attrName);
        break;
    }
  }

  console.log("[samlAcs] Total SAML attributes found:", attributeCount);

  // ─────────────────────────────────────────────────────────────────────
  // Build full name from givenName + surname if name wasn't provided
  // ─────────────────────────────────────────────────────────────────────

  if (!info.name && (info.givenName || info.surname)) {
    info.name = [info.givenName, info.surname].filter(Boolean).join(" ");
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPN fallback
  // ─────────────────────────────────────────────────────────────────────

  if (!info.email && info.upn && info.upn.includes("@")) {
    info.email = info.upn;
  }

  console.log("[samlAcs] Final parsed SAML user info:", {
    email: info.email,
    name: info.name,
    givenName: info.givenName,
    surname: info.surname,
    upn: info.upn,
    role: info.role,
    nameId: info.nameId,
  });

  return info;
}

/**
 * Basic SAML response validation.
 *
 * NOTE:
 * Full XML signature verification is not implemented here.
 *
 * For production-grade SAML validation, use a proper SAML/XML library
 * such as @node-saml or xml-crypto.
 */
function validateSamlResponse(samlXml) {
  // ─────────────────────────────────────────────────────────────────────
  // Check for SAML Assertion
  // ─────────────────────────────────────────────────────────────────────

  if (
    !samlXml.includes("<saml:Assertion") &&
    !samlXml.includes("<saml2:Assertion") &&
    !samlXml.includes("<Assertion")
  ) {
    return {
      valid: false,
      error: "No SAML assertion found in response",
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Check Issuer
  // ─────────────────────────────────────────────────────────────────────

  const issuerMatch = samlXml.match(
    /<(?:[\w.-]+:)?Issuer\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?Issuer>/i,
  );

  if (issuerMatch) {
    const issuer = decodeXmlEntities(issuerMatch[1]);

    console.log("[samlAcs] SAML issuer:", issuer);

    if (issuer !== KFUPM_IDP_ENTITY_ID) {
      return {
        valid: false,
        error: `Unexpected issuer: ${issuer}`,
      };
    }
  } else {
    console.warn("[samlAcs] No SAML issuer found");
  }

  // ─────────────────────────────────────────────────────────────────────
  // Check Status
  // ─────────────────────────────────────────────────────────────────────

  const statusMatch = samlXml.match(
    /<(?:[\w.-]+:)?StatusCode\b[^>]*Value\s*=\s*["']([^"']+)["']/i,
  );

  if (statusMatch) {
    const statusCode = statusMatch[1];

    console.log("[samlAcs] SAML status:", statusCode);

    if (!statusCode.endsWith("Success")) {
      return {
        valid: false,
        error: `SAML response status not success: ${statusCode}`,
      };
    }
  } else {
    console.warn("[samlAcs] No SAML status code found");
  }

  // ─────────────────────────────────────────────────────────────────────
  // Check Audience
  // ─────────────────────────────────────────────────────────────────────

  const audienceMatch = samlXml.match(
    /<(?:[\w.-]+:)?Audience\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?Audience>/i,
  );

  if (audienceMatch) {
    const audience = decodeXmlEntities(audienceMatch[1]);

    console.log("[samlAcs] SAML audience:", audience);

    if (audience !== SP_ENTITY_ID) {
      return {
        valid: false,
        error: `Unexpected audience: ${audience}`,
      };
    }
  } else {
    console.warn("[samlAcs] No SAML audience found");
  }

  return {
    valid: true,
  };
}

/**
 * Determines the platform role from the SAML role claim.
 *
 * KFUPM may send roles like:
 * Student
 * Faculty
 * Staff
 * Teacher
 * Professor
 * Instructor
 */
function mapRole(samlRole) {
  if (!samlRole) {
    return "student";
  }

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

exports.samlAcs = functions.https.onRequest(async (req, res) => {
  var _a, _b, _c;

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
    console.log("[samlAcs] ───────────── SAML ACS START ─────────────");

    // ─────────────────────────────────────────────────────────────────
    // Get SAMLResponse from POST body
    // ─────────────────────────────────────────────────────────────────

    const samlResponseB64 = req.body.SAMLResponse;

    if (!samlResponseB64) {
      console.error("[samlAcs] No SAMLResponse in POST body");

      res.status(400).send("Missing SAMLResponse");
      return;
    }

    console.log(
      "[samlAcs] Received SAMLResponse base64 length:",
      samlResponseB64.length,
    );

    // ─────────────────────────────────────────────────────────────────
    // Decode base64 SAML response
    // ─────────────────────────────────────────────────────────────────

    const samlXml = Buffer.from(samlResponseB64, "base64").toString("utf8");

    console.log("[samlAcs] Decoded SAML XML length:", samlXml.length);

    // IMPORTANT:
    // Temporary diagnostic logging so we can see exactly what ADFS
    // sends to the ACS.
    console.log("[samlAcs] Decoded SAML XML:", samlXml);

    // ─────────────────────────────────────────────────────────────────
    // Validate SAML response
    // ─────────────────────────────────────────────────────────────────

    const validation = validateSamlResponse(samlXml);

    if (!validation.valid) {
      console.error("[samlAcs] SAML validation failed:", validation.error);

      res.status(401).send(`SAML validation failed: ${validation.error}`);

      return;
    }

    console.log("[samlAcs] SAML validation passed");

    // ─────────────────────────────────────────────────────────────────
    // Parse user information
    // ─────────────────────────────────────────────────────────────────

    const userInfo = parseSamlResponse(samlXml);

    console.log("[samlAcs] Parsed user info:", {
      email: userInfo.email,
      name: userInfo.name,
      upn: userInfo.upn,
      role: userInfo.role,
    });

    // ─────────────────────────────────────────────────────────────────
    // Email is required
    // ─────────────────────────────────────────────────────────────────

    if (!userInfo.email) {
      console.error("[samlAcs] No email found in SAML response");

      res.status(400).send("No email address in SAML response");

      return;
    }

    console.log("[samlAcs] Email successfully extracted:", userInfo.email);

    // ─────────────────────────────────────────────────────────────────
    // Look up or create Firebase Auth user
    // ─────────────────────────────────────────────────────────────────

    let firebaseUser;

    try {
      firebaseUser = await auth.getUserByEmail(userInfo.email);

      console.log("[samlAcs] Existing user found:", firebaseUser.uid);
    } catch (err) {
      console.log(
        "[samlAcs] User not found, creating new account for:",
        userInfo.email,
      );

      firebaseUser = await auth.createUser({
        email: userInfo.email,
        emailVerified: true,
        displayName: userInfo.name || userInfo.email,
        password: Math.random().toString(36).slice(2) + Date.now().toString(36),
      });

      console.log("[samlAcs] New user created:", firebaseUser.uid);
    }

    // ─────────────────────────────────────────────────────────────────
    // Map SAML role
    // ─────────────────────────────────────────────────────────────────

    const platformRole = mapRole(userInfo.role);

    console.log(
      "[samlAcs] SAML role:",
      userInfo.role,
      "→ platform role:",
      platformRole,
    );

    // ─────────────────────────────────────────────────────────────────
    // Find KFUPM school
    // ─────────────────────────────────────────────────────────────────

    let schoolId = null;

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
          console.warn(
            "[samlAcs] No school found with subdomain:",
            KFUPM_SUBDOMAIN,
          );
        }
      } catch (schoolErr) {
        console.warn("[samlAcs] Error looking up KFUPM school:", schoolErr);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Update/Create Firestore user document
    // ─────────────────────────────────────────────────────────────────

    const userRef = db.collection("users").doc(firebaseUser.uid);

    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const newUserData = {
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        role: platformRole,
        status: "active",
        email_verified: true,
        sso_provider: "kfupm",
        sso_upn: userInfo.upn || null,
        sso_name_id: userInfo.nameId || null,
        school_id: schoolId,
        schoolIdNumber: userInfo.upn || null,
        profile_incomplete: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        last_login: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userRef.set(newUserData);

      console.log(
        "[samlAcs] Firestore user document created with profile_incomplete=true",
      );
    } else {
      const updateData = {
        name:
          userInfo.name ||
          ((_a = userDoc.data()) === null || _a === void 0
            ? void 0
            : _a.name) ||
          userInfo.email,

        email_verified: true,

        sso_provider: "kfupm",

        sso_upn:
          userInfo.upn ||
          ((_b = userDoc.data()) === null || _b === void 0
            ? void 0
            : _b.sso_upn) ||
          null,

        last_login: admin.firestore.FieldValue.serverTimestamp(),

        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      // If the existing user doesn't have a school_id yet,
      // assign it now.
      if (
        schoolId &&
        !((_c = userDoc.data()) === null || _c === void 0
          ? void 0
          : _c.school_id)
      ) {
        updateData.school_id = schoolId;
      }

      await userRef.update(updateData);

      console.log("[samlAcs] Firestore user document updated");
    }

    // ─────────────────────────────────────────────────────────────────
    // Generate Firebase custom token
    // ─────────────────────────────────────────────────────────────────

    const customToken = await auth.createCustomToken(firebaseUser.uid);

    console.log("[samlAcs] Custom token generated for user:", firebaseUser.uid);

    // ─────────────────────────────────────────────────────────────────
    // Redirect to frontend callback
    // ─────────────────────────────────────────────────────────────────

    const redirectUrl = `${APP_REDIRECT_URL}?token=${encodeURIComponent(
      customToken,
    )}`;

    console.log("[samlAcs] Redirecting user to frontend callback");

    res.redirect(302, redirectUrl);

    console.log("[samlAcs] ───────────── SAML ACS SUCCESS ─────────────");
  } catch (error) {
    console.error("[samlAcs] Error processing SAML response:", error);

    res.status(500).send("Internal server error during SAML processing");
  }
});

// ─── SAML Metadata Endpoint ─────────────────────────────────────────────────

exports.samlMetadata = functions.https.onRequest((req, res) => {
  res.set("Content-Type", "application/xml");

  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor
  xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${SP_ENTITY_ID}">

  <SPSSODescriptor
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">

    <NameIDFormat>
      urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
    </NameIDFormat>

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

// ─── Initialize KFUPM SSO ───────────────────────────────────────────────────

exports.initKfupmSso = functions.https.onCall((data) => {
  const returnUrl =
    (data === null || data === void 0 ? void 0 : data.returnUrl) || "/home";

  const relayState = encodeURIComponent(returnUrl);

  // Build a SAML AuthnRequest
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
  <samlp:NameIDPolicy
    AllowCreate="true"
    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"/>
</samlp:AuthnRequest>`;

  // Deflate + base64 encode for HTTP-Redirect binding
  const zlib = require("zlib");

  const deflated = zlib.deflateRawSync(authnRequest).toString("base64");

  const encoded = encodeURIComponent(deflated);

  const redirectUrl = `${KFUPM_SSO_URL}?SAMLRequest=${encoded}&RelayState=${relayState}`;

  return {
    redirectUrl,
  };
});
