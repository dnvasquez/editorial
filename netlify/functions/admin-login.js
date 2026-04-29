const crypto = require("crypto");

const COOKIE_NAME = "editorial_admin_session";

function base64Url(value) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function signPayload(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function buildCookie(value, maxAgeSeconds, host) {
  const secure = !/^localhost(?::\d+)?$/.test(host) && !/^127\.0\.0\.1(?::\d+)?$/.test(host);
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict"
  ];

  if (secure) {
    parts.push("Secure");
  }

  if (typeof maxAgeSeconds === "number") {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }

  return parts.join("; ");
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const adminUser = process.env.CMS_ADMIN_USER;
  const adminPassword = process.env.CMS_ADMIN_PASSWORD;
  const sessionSecret = process.env.CMS_ADMIN_SESSION_SECRET;

  if (!adminUser || !adminPassword || !sessionSecret) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "CMS auth is not configured on Netlify." })
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    body = {};
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const remember = Boolean(body.remember);

  if (username !== adminUser || password !== adminPassword) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Usuario o clave incorrectos." })
    };
  }

  const exp = Date.now() + (remember ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);
  const payload = base64Url(JSON.stringify({ u: username, exp }));
  const signature = signPayload(payload, sessionSecret);
  const cookieValue = `${payload}.${signature}`;
  const host = String(event.headers.host || event.headers.Host || "");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Set-Cookie": buildCookie(cookieValue, remember ? 30 * 24 * 60 * 60 : 8 * 60 * 60, host)
    },
    body: JSON.stringify({ ok: true, user: { username } })
  };
};
