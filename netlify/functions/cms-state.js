const { getSessionFromEvent } = require("./_cms-auth");

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

  try {
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

exports.handler = async function (event) {
  if (event.httpMethod === "GET") {
    const state = await readRemoteState();
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
    body = {};
  }

  const state = body && typeof body.state === "object" ? body.state : null;
  if (!state) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing CMS state payload." })
    };
  }

  try {
    await writeRemoteState(state, `Update CMS state from ${session.username}`);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unable to persist CMS state." })
    };
  }
};
