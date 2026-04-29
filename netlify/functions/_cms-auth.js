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

function getSessionFromEvent(event) {
  const sessionSecret = process.env.CMS_ADMIN_SESSION_SECRET;
  if (!sessionSecret) return null;

  const headers = (event && event.headers) || {};
  const token = getCookieValue(headers.cookie || headers.Cookie || "", COOKIE_NAME);
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (signPayload(payload, sessionSecret) !== signature) return null;

  let data;
  try {
    data = decodePayload(payload);
  } catch (error) {
    return null;
  }

  if (!data || typeof data.exp !== "number" || data.exp <= Date.now()) {
    return null;
  }

  return {
    username: data.u || "admin"
  };
}

module.exports = {
  getSessionFromEvent
};
