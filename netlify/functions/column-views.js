const DEFAULT_REPO = "dnvasquez/editorial";
const DEFAULT_BRANCH = "main";
const DEFAULT_PATH = "cms-state.json";

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

function buildApiUrl(repo, path) {
  return `https://api.github.com/repos/${repo}/contents/${normalizeRepoPath(path)}`;
}

async function readRemoteState() {
  const repo = getRepoFullName();
  const branch = getBranch();
  const path = getPath();
  const token = getGitHubToken();

  try {
    if (token) {
      const response = await fetch(`${buildApiUrl(repo, path)}?ref=${encodeURIComponent(branch)}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });

      if (response.ok) {
        const payload = await response.json();
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

    if (!response.ok) {
      return {};
    }

    const text = await response.text();
    if (!text.trim()) return {};

    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

async function writeRemoteState(state, message) {
  const token = getGitHubToken();
  if (!token) {
    throw new Error("CMS_DATA_GITHUB_TOKEN is not configured.");
  }

  const repo = getRepoFullName();
  const branch = getBranch();
  const path = getPath();
  const apiUrl = buildApiUrl(repo, path);
  const content = Buffer.from(JSON.stringify(state, null, 2), "utf8").toString("base64");

  let sha = null;
  try {
    const current = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    if (current.ok) {
      const currentJson = await current.json();
      sha = currentJson && currentJson.sha ? currentJson.sha : null;
    }
  } catch (error) {
    sha = null;
  }

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      message,
      content,
      branch,
      ...(sha ? { sha } : {})
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Unable to update CMS state.");
  }

  return response.json();
}

function normalizeCount(value) {
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getViewsMap(state) {
  const raw = state && state.editorialCmsColumnViews;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return Object.keys(raw).reduce((accumulator, key) => {
    accumulator[key] = normalizeCount(raw[key]);
    return accumulator;
  }, {});
}

function readRequestBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return {};
  }
}

exports.handler = async function (event) {
  const state = await readRemoteState();
  const views = getViewsMap(state);

  if (event.httpMethod === "GET") {
    const id = (event.queryStringParameters && event.queryStringParameters.id) ? String(event.queryStringParameters.id) : "";
    const count = id ? normalizeCount(views[id]) : 0;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true, count, views })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "GET, POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const body = readRequestBody(event);
  const id = String(body.id || "").trim();
  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing column id." })
    };
  }

  const nextCount = normalizeCount(views[id]) + 1;
  views[id] = nextCount;
  state.editorialCmsColumnViews = views;

  try {
    await writeRemoteState(state, `Increment column view for ${id}`);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true, id, count: nextCount, views })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unable to persist column view count." })
    };
  }
};
