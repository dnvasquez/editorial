const DEFAULT_IMAGE = "images/col01_img.jpg";
const DEFAULT_TITLE = "Columna — Estación Rural";
const DEFAULT_DESCRIPTION = "Lecturas editoriales, opinión y análisis de Estación Rural.";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getOrigin(url) {
  const parsed = new URL(url);
  return parsed.origin;
}

async function readState(requestUrl) {
  try {
    const response = await fetch(new URL("/.netlify/functions/cms-state", requestUrl).toString(), {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) return {};
    const payload = await response.json();
    return payload && typeof payload.state === "object" ? payload.state : {};
  } catch (error) {
    return {};
  }
}

function getColumnsFromState(state) {
  const columns = Array.isArray(state && state.editorialCmsColumnas) ? state.editorialCmsColumnas : [];
  return columns.filter((column) => column && !column._deleted);
}

function findColumnById(columns, id) {
  return columns.find((column) => String(column.id || "") === String(id || "")) || null;
}

function absoluteUrl(origin, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw)) return raw;
  if (raw.startsWith("//")) {
    return `${origin.split(":")[0]}:${raw}`;
  }
  return `${origin.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
}

function buildMeta(column, origin, requestUrl) {
  const pageUrl = requestUrl.toString();
  const title = String(column.titulo || DEFAULT_TITLE);
  const description = String(column.resumen || DEFAULT_DESCRIPTION);
  const image = absoluteUrl(origin, column.banner || column.imagen || DEFAULT_IMAGE);
  const author = String(column.autor || "");
  const published = column.fecha && /^\d{4}-\d{2}-\d{2}$/.test(column.fecha) ? `${column.fecha}T12:00:00Z` : "";

  return [
    `<title>${escapeHtml(title)} | Estación Rural</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta property="og:site_name" content="Estación Rural">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta property="og:image:secure_url" content="${escapeHtml(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}">`,
    `<meta property="article:author" content="${escapeHtml(author)}">`,
    published ? `<meta property="article:published_time" content="${escapeHtml(published)}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`
  ].filter(Boolean).join("\n    ");
}

export default async function (request, context) {
  const requestUrl = new URL(request.url);
  if (requestUrl.pathname !== "/columna.html") {
    return context.next();
  }

  const id = requestUrl.searchParams.get("id") || "";
  const state = await readState(request.url);
  const columns = getColumnsFromState(state);
  const column = findColumnById(columns, id);

  if (!column) {
    return context.next();
  }

  const origin = getOrigin(request.url);
  const response = await context.next();
  const html = await response.text();
  const meta = buildMeta(column, origin, requestUrl);

  const nextHtml = html.replace(
    /<head([^>]*)>/i,
    `<head$1>\n    ${meta}\n    <link rel="preload" as="image" href="${escapeHtml(absoluteUrl(origin, column.banner || column.imagen || DEFAULT_IMAGE))}">`
  );

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("transfer-encoding");
  headers.set("content-type", "text/html; charset=utf-8");

  return new Response(nextHtml, {
    status: response.status,
    headers
  });
}

export const config = {
  path: "/columna.html"
};
