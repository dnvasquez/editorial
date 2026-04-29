const COOKIE_NAME = "editorial_admin_session";

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : "";
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signPayload(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
}

function decodePayload(payload) {
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function isAuthenticated(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;

  const payload = parts[0];
  const signature = parts[1];
  const expected = await signPayload(payload, secret);
  if (expected !== signature) return false;

  let data;
  try {
    data = decodePayload(payload);
  } catch (error) {
    return false;
  }

  return Boolean(data && typeof data.exp === "number" && data.exp > Date.now());
}

export default async function (request, context) {
  const pathname = new URL(request.url).pathname;
  const loginPath = "/admin-login.html";
  const protectedPaths = new Set(["/admin-columnas.html", "/admin-seccion.html"]);

  if (!protectedPaths.has(pathname) && pathname !== loginPath) {
    return;
  }

  const sessionSecret = Netlify.env.get("CMS_ADMIN_SESSION_SECRET");
  if (!sessionSecret) {
    return new Response("CMS auth is not configured on Netlify.", { status: 500 });
  }

  const token = context.cookies.get(COOKIE_NAME);
  const authenticated = await isAuthenticated(token, sessionSecret);

  if (pathname === loginPath) {
    if (authenticated) {
      return Response.redirect(new URL("/admin-columnas.html", request.url), 302);
    }
    return;
  }

  if (!authenticated) {
    return Response.redirect(new URL(loginPath, request.url), 302);
  }
}

export const config = {
  path: "/*"
};
