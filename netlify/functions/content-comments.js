const DEFAULT_REPO = "dnvasquez/editorial";
const DEFAULT_BRANCH = "main";
const DEFAULT_PATH = "cms-state.json";
const COMMENTS_STATE_KEY = "editorialCmsComments";
const ALLOWED_TYPES = new Set(["episode", "column"]);

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

function readRequestBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return {};
  }
}

function normalizeType(value) {
  const type = String(value || "").trim();
  return ALLOWED_TYPES.has(type) ? type : "";
}

function buildCommentKey(type, contentId) {
  return `${type}:${contentId}`;
}

function normalizeComment(comment) {
  return {
    id: String(comment && comment.id ? comment.id : `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    type: String(comment && comment.type ? comment.type : ""),
    contentId: String(comment && comment.contentId ? comment.contentId : ""),
    name: String(comment && comment.name ? comment.name : "Visitante"),
    message: String(comment && comment.message ? comment.message : "").trim(),
    pageUrl: String(comment && comment.pageUrl ? comment.pageUrl : ""),
    pageTitle: String(comment && comment.pageTitle ? comment.pageTitle : ""),
    createdAt: String(comment && comment.createdAt ? comment.createdAt : new Date().toISOString())
  };
}

function getCommentsMap(state) {
  const raw = state && state[COMMENTS_STATE_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return Object.keys(raw).reduce((accumulator, key) => {
    const items = Array.isArray(raw[key]) ? raw[key] : [];
    accumulator[key] = items.map(normalizeComment).filter((item) => item.message);
    return accumulator;
  }, {});
}

function getSortedComments(items) {
  return (Array.isArray(items) ? items : [])
    .map(normalizeComment)
    .filter((item) => item.message)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

exports.handler = async function (event) {
  const state = await readRemoteState();
  const commentsMap = getCommentsMap(state);

  if (event.httpMethod === "GET") {
    const type = normalizeType(event.queryStringParameters && event.queryStringParameters.type);
    const contentId = String(event.queryStringParameters && event.queryStringParameters.id ? event.queryStringParameters.id : "").trim();

    if (!type || !contentId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing comment type or content id." })
      };
    }

    const key = buildCommentKey(type, contentId);
    const comments = getSortedComments(commentsMap[key] || []);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true, type, contentId, comments, count: comments.length })
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
  const type = normalizeType(body.type);
  const contentId = String(body.id || body.contentId || "").trim();
  const name = String(body.name || "Visitante").trim().slice(0, 80) || "Visitante";
  const message = String(body.message || "").trim().slice(0, 1000);
  const pageUrl = String(body.pageUrl || "").trim().slice(0, 500);
  const pageTitle = String(body.pageTitle || "").trim().slice(0, 200);

  if (!type || !contentId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing comment type or content id." })
    };
  }

  if (!message) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing comment text." })
    };
  }

  const key = buildCommentKey(type, contentId);
  const nextComment = normalizeComment({
    type,
    contentId,
    name,
    message,
    pageUrl,
    pageTitle,
    createdAt: new Date().toISOString()
  });

  const comments = getSortedComments(commentsMap[key] || []);
  comments.unshift(nextComment);

  state[COMMENTS_STATE_KEY] = commentsMap;
  state[COMMENTS_STATE_KEY][key] = comments.slice(0, 200);

  try {
    await writeRemoteState(state, `Add comment for ${key}`);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true, comment: nextComment, comments: state[COMMENTS_STATE_KEY][key], count: state[COMMENTS_STATE_KEY][key].length })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unable to persist comment." })
    };
  }
};
