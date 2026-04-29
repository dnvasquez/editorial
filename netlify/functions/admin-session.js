const crypto = require("crypto");

const COOKIE_NAME = "editorial_admin_session";

function signPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function decodePayload(payload) {
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : "";
}

exports.handler = async function (event) {
  const sessionSecret = process.env.CMS_ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "CMS auth is not configured on Netlify." })
    };
  }

  const token = getCookieValue(event.headers.cookie || event.headers.Cookie || "", COOKIE_NAME);
  const parts = token.split(".");
  if (parts.length !== 2) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "No auth session." })
    };
  }

  const [payload, signature] = parts;
  if (signPayload(payload, sessionSecret) !== signature) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid auth session." })
    };
  }

  let data;
  try {
    data = decodePayload(payload);
  } catch (error) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid auth session." })
    };
  }

  if (!data || typeof data.exp !== "number" || data.exp <= Date.now()) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Expired auth session." })
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ ok: true, user: { username: data.u || "admin" } })
  };
};
