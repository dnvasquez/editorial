const DEFAULT_REPO = "dnvasquez/editorial";
const DEFAULT_BRANCH = "main";
const DEFAULT_PATH = "cms-state.json";
const DEFAULT_IMAGE = "images/col01_img.jpg";

function getRepoFullName() {
  return process.env.CMS_DATA_REPO || DEFAULT_REPO;
}

function getBranch() {
  return process.env.CMS_DATA_BRANCH || DEFAULT_BRANCH;
}

function getPath() {
  return process.env.CMS_DATA_PATH || DEFAULT_PATH;
}

function getGitHubToken() {
  return process.env.CMS_DATA_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
}

function normalizeRepoPath(path) {
  return encodeURIComponent(path).replace(/%2F/g, "/");
}

function buildRawUrl(repo, branch, path) {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function getOrigin(event) {
  const headers = (event && event.headers) || {};
  const proto = String(headers["x-forwarded-proto"] || headers["X-Forwarded-Proto"] || "https").split(",")[0].trim() || "https";
  const host = String(headers.host || headers.Host || "").split(",")[0].trim();
  return host ? `${proto}://${host}` : "https://estacionrural.netlify.app";
}

async function readState() {
  const repo = getRepoFullName();
  const branch = getBranch();
  const path = getPath();
  const token = getGitHubToken();

  try {
    if (token) {
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${normalizeRepoPath(path)}`;
      const apiResponse = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });

      if (apiResponse.ok) {
        const payload = await apiResponse.json();
        const content = payload && payload.content ? String(payload.content).replace(/\n/g, "") : "";
        if (content) {
          const text = Buffer.from(content, payload.encoding === "base64" ? "base64" : "utf8").toString("utf8");
          const parsed = JSON.parse(text || "{}");
          return parsed && typeof parsed === "object" ? parsed : {};
        }
      }
    }

    const response = await fetch(buildRawUrl(repo, branch, path), {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) return {};
    const text = await response.text();
    if (!text.trim()) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
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

function buildPageHtml(options) {
  const title = options.title || "Columna";
  const description = options.description || "";
  const image = options.image || "";
  const canonicalUrl = options.canonicalUrl || "";
  const pageUrl = options.pageUrl || canonicalUrl || "";
  const author = options.author || "";
  const published = options.published || "";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} | El Deslinde</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:site_name" content="El Deslinde">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl || pageUrl)}">
    <meta property="article:author" content="${escapeHtml(author)}">
    ${published ? `<meta property="article:published_time" content="${escapeHtml(published)}">` : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl || pageUrl)}">
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #fcfcf6; color: #111; }
      .wrap { max-width: 860px; margin: 0 auto; padding: 32px 20px 56px; }
      .card { background: #fff; border: 1px solid rgba(0,0,0,.06); box-shadow: 0 18px 38px -30px rgba(0,0,0,.28); }
      .media { width: 100%; height: auto; display: block; }
      .body { padding: 28px; }
      .eyebrow { display: inline-block; color: #1f6b4e; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; margin-bottom: 12px; }
      h1 { margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.25rem); line-height: 1.05; }
      p { margin: 0 0 16px; font-size: 1.05rem; line-height: 1.7; }
      .meta { color: #6b6f67; font-size: .9rem; margin-bottom: 18px; }
      .btn { display: inline-block; padding: 12px 18px; background: #f23a2e; color: #fff; text-decoration: none; border-radius: 999px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="media">` : ""}
        <div class="body">
          <div class="eyebrow">Columna</div>
          <h1>${escapeHtml(title)}</h1>
          ${author ? `<div class="meta">Por ${escapeHtml(author)}${published ? ` · ${escapeHtml(published)}` : ""}</div>` : ""}
          <p>${escapeHtml(description)}</p>
          <a class="btn" href="${escapeHtml(pageUrl)}">Abrir columna</a>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

exports.handler = async function (event) {
  const id = (event.queryStringParameters && event.queryStringParameters.id) || "";
  const origin = getOrigin(event);
  const siteOrigin = origin;

  const state = await readState();
  const columns = getColumnsFromState(state);
  const column = findColumnById(columns, id);

  if (!column) {
    const fallbackUrl = `${siteOrigin}/columnas.html`;
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: buildPageHtml({
        title: "Columna no encontrada",
        description: "La columna solicitada no está disponible en este momento.",
        image: `${siteOrigin}/${DEFAULT_IMAGE}`,
        canonicalUrl: fallbackUrl,
        pageUrl: fallbackUrl
      })
    };
  }

  const title = String(column.titulo || "Columna");
  const description = String(column.resumen || "");
  const image = absoluteUrl(siteOrigin, column.banner || column.imagen || DEFAULT_IMAGE);
  const pageUrl = `${siteOrigin}/columna.html?id=${encodeURIComponent(column.id)}`;
  const canonicalUrl = pageUrl;
  const published = column.fecha && /^\d{4}-\d{2}-\d{2}$/.test(column.fecha) ? `${column.fecha}T12:00:00Z` : "";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    },
    body: buildPageHtml({
      title,
      description,
      image,
      canonicalUrl,
      pageUrl,
      author: column.autor || "",
      published
    })
  };
};
