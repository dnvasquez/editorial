const { getSessionFromEvent } = require("./_cms-auth");

const DEFAULT_REPO = "dnvasquez/editorial";
const DEFAULT_BRANCH = "main";
const DEFAULT_PATH = "cms-state.json";
const GITHUB_FETCH_TIMEOUT_MS = 10000;

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

async function fetchWithTimeout(url, options, timeoutMs, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);

  try {
    return await fetch(url, Object.assign({}, options || {}, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeIncomingValue(value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeIncomingValue(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      const next = sanitizeIncomingValue(value[key]);
      if (next !== undefined) {
        acc[key] = next;
      }
      return acc;
    }, {});
  }

  return value;
}

function mergeDefinedState(currentState, incomingState) {
  const nextState = Array.isArray(currentState) ? currentState.slice() : Object.assign({}, currentState || {});
  const sanitized = sanitizeIncomingValue(incomingState);

  if (!sanitized || typeof sanitized !== "object") {
    return nextState;
  }

  Object.keys(sanitized).forEach((key) => {
    nextState[key] = sanitized[key];
  });

  return nextState;
}

async function readRemoteState() {
  const repo = getRepoFullName();
  const branch = getBranch();
  const path = getPath();
  const token = getGitHubToken();

  try {
    if (token) {
      console.log("[cms-state] readRemoteState api start", { repo, branch, path });
      const response = await fetchWithTimeout(`${buildApiUrl(repo, path)}?ref=${encodeURIComponent(branch)}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }, GITHUB_FETCH_TIMEOUT_MS, "GitHub read");

      if (response.ok) {
        const payload = await response.json();
        const content = payload && payload.content ? String(payload.content).replace(/\n/g, "") : "";
        if (content) {
          const text = Buffer.from(content, payload.encoding === "base64" ? "base64" : "utf8").toString("utf8");
          const parsed = JSON.parse(text || "{}");
          console.log("[cms-state] readRemoteState api ok", { keys: Object.keys(parsed || {}) });
          return parsed && typeof parsed === "object" ? parsed : {};
        }
      }
    }

    console.log("[cms-state] readRemoteState raw start", { repo, branch, path });
    const response = await fetchWithTimeout(buildRawUrl(repo, branch, path), {
      headers: { Accept: "application/json" }
    }, GITHUB_FETCH_TIMEOUT_MS, "GitHub raw read");

    if (!response.ok) {
      return {};
    }

    const text = await response.text();
    if (!text.trim()) return {};

    const parsed = JSON.parse(text);
    console.log("[cms-state] readRemoteState raw ok", { keys: Object.keys(parsed || {}) });
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("[cms-state] readRemoteState failed", error);
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
    console.log("[cms-state] writeRemoteState sha fetch start", { repo, branch, path });
    const current = await fetchWithTimeout(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }, GITHUB_FETCH_TIMEOUT_MS, "GitHub sha read");

    if (current.ok) {
      const currentJson = await current.json();
      sha = currentJson && currentJson.sha ? currentJson.sha : null;
    }
  } catch (error) {
    console.error("[cms-state] writeRemoteState sha fetch failed", error);
    sha = null;
  }

  const writeBody = JSON.stringify({
    message,
    content,
    branch,
    ...(sha ? { sha } : {})
  });

  console.log("[cms-state] writeRemoteState put start", {
    repo,
    branch,
    path,
    hasSha: Boolean(sha),
    bodyLength: writeBody.length
  });

  const response = await fetchWithTimeout(apiUrl, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: writeBody
  }, GITHUB_FETCH_TIMEOUT_MS, "GitHub write");

  console.log("[cms-state] writeRemoteState put end", { ok: response.ok, status: response.status });

  if (!response.ok) {
    const text = await response.text();
    console.error("[cms-state] writeRemoteState put failed", text);
    throw new Error(text || "Unable to update CMS state.");
  }

  return response.json();
}

exports.handler = async function (event) {
  console.log("[cms-state] handler start", {
    method: event && event.httpMethod,
    path: event && event.path,
    bodyLength: event && event.body ? String(event.body).length : 0
  });

  if (event.httpMethod === "GET") {
    const state = await readRemoteState();
    console.log("[cms-state] handler GET ok", { keys: Object.keys(state || {}) });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true, state })
    };
  }

  if (event.httpMethod !== "PUT" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "GET, PUT, POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const session = getSessionFromEvent(event);
  if (!session) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not authenticated." })
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    console.error("[cms-state] handler body parse failed", error);
    body = {};
  }

  const state = body && typeof body.state === "object" ? body.state : null;
  console.log("[cms-state] handler parsed body", {
    bodyKeys: Object.keys(body || {}),
    stateKeys: state && typeof state === "object" ? Object.keys(state) : [],
    columnsLength: state && Array.isArray(state.editorialCmsColumnas) ? state.editorialCmsColumnas.length : 0
  });
  if (!state) {
    console.error("[cms-state] handler missing state payload");
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing CMS state payload." })
    };
  }

  try {
    console.log("[cms-state] handler read current state start");
    const currentState = await readRemoteState();
    console.log("[cms-state] handler read current state done", { keys: Object.keys(currentState || {}) });
    const nextState = mergeDefinedState(currentState && typeof currentState === "object" ? currentState : {}, state);
    console.log("[cms-state] handler write state start", { keys: Object.keys(nextState || {}) });
    await writeRemoteState(nextState, `Update CMS state from ${session.username}`);
    console.log("[cms-state] handler write state done");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    console.error("[cms-state] handler failed", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unable to persist CMS state." })
    };
  }
};
