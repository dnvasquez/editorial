(function () {
  var PAGE_STORAGE_KEY = "editorialCmsPages";
  var CONTENT_STORAGE_KEY = "editorialCmsPageContent";
  var STORAGE_KEYS = {
    programs: "editorialCmsProgramas",
    episodes: "editorialCmsEpisodios",
    columns: "editorialCmsColumnas",
    publications: "editorialCmsPublicaciones",
    columnViews: "editorialCmsColumnViews",
    comments: "editorialCmsComments"
  };
  var REMOTE_STATE_ENDPOINT = "/.netlify/functions/cms-state";
  var COLUMN_VIEWS_ENDPOINT = "/.netlify/functions/column-views";
  var REMOTE_STATE_KEYS = [
    "editorialCmsProgramas",
    "editorialCmsEpisodios",
    "editorialCmsColumnas",
    "editorialCmsPublicaciones",
    "editorialCmsColumnViews",
    "editorialCmsComments",
    "editorialCmsPages",
    "editorialCmsPageContent",
    "editorialCmsSections",
    "editorialCmsSectionContent"
  ];
  // Public counters and comment caches should be read locally, not pushed back as editable CMS state.
  var REMOTE_STATE_SYNC_KEYS = REMOTE_STATE_KEYS.filter(function (key) {
    return key !== "editorialCmsColumnViews" && key !== "editorialCmsComments";
  });
  var REMOTE_STATE_STORE_KEY = "__editorialCmsRemoteState";
  var remoteSyncTimer = null;

  var PAGE_DEFINITIONS = [
    { id: "index", label: "Inicio", file: "index.html" },
    { id: "programas", label: "Programas", file: "programas.html" },
    { id: "columnas", label: "Columnas", file: "columnas.html" },
    { id: "publicaciones", label: "Publicaciones", file: "publicaciones.html" },
    { id: "about", label: "Nosotros", file: "about.html" },
    { id: "contact", label: "Contacto", file: "contact.html" }
  ];

  function clone(item) {
    return JSON.parse(JSON.stringify(item));
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function readArray(key) {
    var store = getRemoteStateStore();
    var parsed = store[key];
    return Array.isArray(parsed) ? clone(parsed) : [];
  }

  function writeArray(key, items) {
    var normalized = Array.isArray(items) ? clone(items) : [];
    getRemoteStateStore()[key] = normalized;
    return normalized;
  }

  function readObject(key) {
    var store = getRemoteStateStore();
    var parsed = store[key];
    return isPlainObject(parsed) ? clone(parsed) : {};
  }

  function writeObject(key, value) {
    var payload = value && typeof value === "object" && !Array.isArray(value) ? clone(value) : {};
    getRemoteStateStore()[key] = payload;
    return payload;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isLocalPreviewEnvironment() {
    if (!window.location || window.location.protocol === "file:") return true;
    return window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1";
  }

  function readSnapshot() {
    return clone(getRemoteStateStore());
  }

  function getRemoteStateStore() {
    var store = window[REMOTE_STATE_STORE_KEY];
    if (!store || typeof store !== "object" || Array.isArray(store)) {
      store = {};
      window[REMOTE_STATE_STORE_KEY] = store;
    }
    return store;
  }

  function replaceRemoteStateStore(snapshot) {
    var store = getRemoteStateStore();
    Object.keys(store).forEach(function (key) {
      delete store[key];
    });

    if (snapshot && typeof snapshot === "object") {
      Object.keys(snapshot).forEach(function (key) {
        store[key] = clone(snapshot[key]);
      });
    }

    return store;
  }

  function pickSnapshotKeys(snapshot, keys) {
    var picked = {};
    (Array.isArray(keys) ? keys : []).forEach(function (key) {
      if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, key)) return;
      var value = snapshot[key];
      if (value === null || value === undefined) return;
      picked[key] = value;
    });
    return picked;
  }

  function hasSnapshotData(snapshot, keys) {
    var sourceKeys = Array.isArray(keys) ? keys : REMOTE_STATE_KEYS;
    return sourceKeys.some(function (key) {
      var value = snapshot && snapshot[key];
      if (Array.isArray(value)) return value.length > 0;
      if (isPlainObject(value)) return Object.keys(value).length > 0;
      return Boolean(value);
    });
  }

  function mergeSnapshotObject(baseValue, overrideValue) {
    var base = isPlainObject(baseValue) ? baseValue : {};
    var override = isPlainObject(overrideValue) ? overrideValue : {};
    var merged = {};

    Object.keys(base).forEach(function (key) {
      merged[key] = clone(base[key]);
    });

    Object.keys(override).forEach(function (key) {
      var incoming = override[key];
      if (incoming === null || incoming === undefined) {
        return;
      }

      var current = merged[key];
      if (Array.isArray(current) && Array.isArray(incoming)) {
        merged[key] = mergeSnapshotArray(current, incoming);
        return;
      }

      if (isPlainObject(current) && isPlainObject(incoming)) {
        merged[key] = mergeSnapshotObject(current, incoming);
        return;
      }

      merged[key] = clone(incoming);
    });

    return merged;
  }

  function mergeSnapshotArray(baseArray, overrideArray) {
    function canMergeById(items) {
      return Array.isArray(items) && items.length > 0 && items.every(function (item) {
        return isPlainObject(item) && item.id !== undefined && item.id !== null;
      });
    }

    if (!Array.isArray(overrideArray)) {
      return Array.isArray(baseArray) ? clone(baseArray) : [];
    }

    if (!canMergeById(baseArray) || !canMergeById(overrideArray)) {
      return clone(overrideArray);
    }

    var merged = [];
    var indexById = {};

    baseArray.forEach(function (item) {
      var cloned = clone(item);
      indexById[String(cloned.id)] = merged.length;
      merged.push(cloned);
    });

    overrideArray.forEach(function (item) {
      var cloned = clone(item);
      var id = String(cloned.id);
      if (Object.prototype.hasOwnProperty.call(indexById, id)) {
        merged[indexById[id]] = mergeSnapshotObject(merged[indexById[id]], cloned);
        return;
      }
      indexById[id] = merged.length;
      merged.push(cloned);
    });

    return merged;
  }

  function mergeSnapshotState(remoteState, localState) {
    var remote = isPlainObject(remoteState) ? remoteState : {};
    var local = isPlainObject(localState) ? localState : {};
    return mergeSnapshotObject(remote, local);
  }

  function readRemoteStateSync() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", REMOTE_STATE_ENDPOINT, false);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send(null);

      if (xhr.status >= 200 && xhr.status < 300) {
        var payload = JSON.parse(xhr.responseText || "{}");
        if (payload && typeof payload === "object") {
          return payload.state && typeof payload.state === "object" ? payload.state : payload;
        }
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function readColumnViewsSync() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", COLUMN_VIEWS_ENDPOINT, false);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send(null);

      if (xhr.status >= 200 && xhr.status < 300) {
        var payload = JSON.parse(xhr.responseText || "{}");
        if (payload && typeof payload === "object" && payload.views && typeof payload.views === "object") {
          return payload.views;
        }
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function syncSnapshotToServer(snapshot, silent) {
    if (!snapshot || typeof snapshot !== "object") return Promise.resolve();
    if (typeof window.fetch !== "function") return Promise.resolve();
    if (isLocalPreviewEnvironment()) {
      return Promise.resolve(null);
    }

    var remoteState = readRemoteStateSync();
    var currentState = mergeSnapshotState(
      remoteState && typeof remoteState === "object" ? remoteState : {},
      readSnapshot() && typeof readSnapshot() === "object" ? readSnapshot() : {}
    );
    var payload = mergeSnapshotState(currentState, snapshot && typeof snapshot === "object" ? snapshot : {});

    if (!hasSnapshotData(payload, REMOTE_STATE_KEYS)) {
      return Promise.resolve(null);
    }

    var request = window.fetch(REMOTE_STATE_ENDPOINT, {
      method: "PUT",
      credentials: "include",
      keepalive: true,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ state: payload })
    }).then(function (response) {
      if (response.ok) {
        return response;
      }

      return response.text().then(function (text) {
        var message = text || ("HTTP " + response.status);
        try {
          var parsed = JSON.parse(text);
          message = parsed && (parsed.error || parsed.message) ? (parsed.error || parsed.message) : message;
        } catch (error) {}
        throw new Error(message);
      });
    });

    if (silent) {
      request.catch(function () {});
    }

    return request;
  }

  function flushRemoteSync() {
    syncSnapshotToServer(readSnapshot(), true);
  }

  function syncStateNow() {
    return syncSnapshotToServer(readSnapshot(), false);
  }

  function queueRemoteSync() {
    if (remoteSyncTimer) {
      window.clearTimeout(remoteSyncTimer);
    }

    remoteSyncTimer = window.setTimeout(function () {
      remoteSyncTimer = null;
      flushRemoteSync();
    }, 150);
  }

  function hydrateRemoteState() {
    var remoteState = readRemoteStateSync();
    replaceRemoteStateStore(remoteState && typeof remoteState === "object" ? remoteState : {});
  }

  function normalizeDate(dateValue) {
    if (!dateValue) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;

    var cleaned = String(dateValue).replace(/\s+/g, " ").trim();
    var parts = cleaned.split(" ");
    if (parts.length < 3) return cleaned;

    var months = {
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      setiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12"
    };

    var day = parts[0].padStart(2, "0");
    var month = months[(parts[1] || "").toLowerCase()];
    var year = parts[2];

    if (!month || !/^\d{4}$/.test(year)) return cleaned;
    return year + "-" + month + "-" + day;
  }

  function formatDisplayDate(dateValue) {
    var normalized = normalizeDate(dateValue);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return dateValue || "";
    var date = new Date(normalized + "T12:00:00");
    var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
  }

  function estimateReadingLabel(text) {
    var words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220)) + " min";
  }

  function normalizeColumnistItem(item, index) {
    var member = item && typeof item === "object" ? clone(item) : {};
    member.id = String(member.id || slugify(member.name) || ("columnista-" + (index + 1)));
    member.name = String(member.name || "");
    member.role = String(member.role || "");
    member.bio = String(member.bio || "");
    member.image = String(member.image || "");
    member.twitter = String(member.twitter || "");
    member.instagram = String(member.instagram || "");
    member.facebook = String(member.facebook || "");
    member.linkedin = String(member.linkedin || "");
    return member;
  }

  function normalizeColumnistList(items) {
    return (Array.isArray(items) ? items : []).map(function (item, index) {
      return normalizeColumnistItem(item, index);
    });
  }

  function getColumnistasForAdmin() {
    var content = getPageContentSection("columnistas");
    if (!content) return [];
    return normalizeColumnistList(content.items);
  }

  function findColumnistaByRef(columnistRef) {
    if (!columnistRef) return null;
    var lookup = String(columnistRef);
    return getColumnistasForAdmin().find(function (item) {
      return String(item.id) === lookup || slugify(item.name) === lookup;
    }) || null;
  }

  function getColumnistaById(columnistId) {
    return findColumnistaByRef(columnistId);
  }

  function getColumnistaPageUrl(columnist) {
    if (!columnist) return "columnista.html";
    var ref = columnist.id || slugify(columnist.name || "");
    if (!ref) return "";
    return "columnista.html?id=" + encodeURIComponent(ref);
  }

  function resolveColumnAuthor(column) {
    if (!column) return "Autor/a";

    var columnista = null;
    if (column.autorId) {
      columnista = getColumnistaById(column.autorId);
    }
    if (!columnista && column.autor) {
      var inferredId = slugify(column.autor);
      columnista = getColumnistaById(inferredId) || getColumnistasForAdmin().find(function (item) {
        return slugify(item.name) === inferredId;
      }) || null;
    }

    return columnista && columnista.name ? columnista.name : (column.autor || "Autor/a");
  }

  function toParagraphArray(content) {
    if (Array.isArray(content)) return content;
    return String(content || "")
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(function (paragraph) { return paragraph.trim(); })
      .filter(Boolean);
  }

  function toHashtagArray(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return String(item || "").trim();
      }).filter(Boolean);
    }

    return String(value || "")
      .split(/[\n,]+/)
      .map(function (tag) { return tag.trim(); })
      .filter(Boolean);
  }

  function normalizeHashtag(tag) {
    var value = String(tag || "").trim();
    if (!value) return "";
    value = value.replace(/^#+/, "");
    value = value.replace(/\s+/g, "-");
    return "#" + value;
  }

  function normalizeHashtagList(value) {
    var seen = {};
    return toHashtagArray(value)
      .map(normalizeHashtag)
      .filter(function (tag) {
        if (!tag || seen[tag]) return false;
        seen[tag] = true;
        return true;
      });
  }

  function parseTranscript(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line) {
        var parts = line.split(":");
        if (parts.length < 2) {
          return { locutor: "Locutor", texto: line };
        }

        return {
          locutor: parts.shift().trim() || "Locutor",
          texto: parts.join(":").trim()
        };
      });
  }

  function serializeTranscript(items) {
    return (Array.isArray(items) ? items : []).map(function (item) {
      return (item.locutor || "Locutor") + ": " + (item.texto || "");
    }).join("\n");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isProbablyHtml(value) {
    return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
  }

  function htmlToPlainText(html) {
    var sandbox = document.createElement("div");
    sandbox.innerHTML = String(html || "");
    return (sandbox.textContent || "").replace(/\u00a0/g, " ").trim();
  }

  function sanitizeColumnContentHtml(html) {
    var allowedTags = {
      A: true,
      B: true,
      BLOCKQUOTE: true,
      BR: true,
      EM: true,
      H2: true,
      H3: true,
      I: true,
      IMG: true,
      IFRAME: true,
      LI: true,
      OL: true,
      P: true,
      STRONG: true,
      SOURCE: true,
      VIDEO: true,
      U: true,
      UL: true
    };

    function appendSanitizedChildren(source, target) {
      Array.prototype.forEach.call(source.childNodes, function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          target.appendChild(document.createTextNode(child.nodeValue));
          return;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) {
          return;
        }

        var tagName = child.tagName.toUpperCase();
        if (tagName === "SCRIPT" || tagName === "STYLE" || tagName === "OBJECT" || tagName === "EMBED" || tagName === "AUDIO") {
          return;
        }

        if (tagName === "DIV") {
          var paragraph = document.createElement("p");
          appendSanitizedChildren(child, paragraph);
          if (!paragraph.textContent.trim() && !paragraph.querySelector("br")) {
            paragraph.appendChild(document.createElement("br"));
          }
          target.appendChild(paragraph);
          return;
        }

        if (!allowedTags[tagName]) {
          appendSanitizedChildren(child, target);
          return;
        }

        var clean = document.createElement(tagName.toLowerCase());
        if (tagName === "A") {
          var href = sanitizeLinkUrl(child.getAttribute("href"));
          clean.setAttribute("href", href);
          if (child.getAttribute("target") === "_blank") {
            clean.setAttribute("target", "_blank");
            clean.setAttribute("rel", "noopener noreferrer");
          }
        } else if (tagName === "IMG") {
          clean.setAttribute("src", sanitizeImageUrl(child.getAttribute("src"), ""));
          clean.setAttribute("alt", child.getAttribute("alt") || "");
          clean.setAttribute("loading", "lazy");
          clean.setAttribute("decoding", "async");
        } else if (tagName === "IFRAME") {
          clean.setAttribute("src", sanitizeIframeUrl(child.getAttribute("src"), ""));
          clean.setAttribute("loading", "lazy");
          clean.setAttribute("title", child.getAttribute("title") || "");
          clean.setAttribute("allowfullscreen", "allowfullscreen");
          clean.setAttribute("referrerpolicy", child.getAttribute("referrerpolicy") || "strict-origin-when-cross-origin");
          clean.setAttribute("allow", child.getAttribute("allow") || "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        } else if (tagName === "VIDEO") {
          clean.setAttribute("src", sanitizeMediaUrl(child.getAttribute("src"), ""));
          clean.setAttribute("controls", "controls");
          clean.setAttribute("preload", child.getAttribute("preload") || "metadata");
          if (child.hasAttribute("poster")) {
            clean.setAttribute("poster", sanitizeImageUrl(child.getAttribute("poster"), ""));
          }
          if (child.hasAttribute("playsinline")) {
            clean.setAttribute("playsinline", "playsinline");
          }
        } else if (tagName === "SOURCE") {
          var sourceSrc = sanitizeMediaUrl(child.getAttribute("src"), "");
          if (!sourceSrc) return;
          clean.setAttribute("src", sourceSrc);
          if (child.getAttribute("type")) {
            clean.setAttribute("type", child.getAttribute("type"));
          }
          if (child.getAttribute("media")) {
            clean.setAttribute("media", child.getAttribute("media"));
          }
        }

        appendSanitizedChildren(child, clean);

        if ((tagName === "P" || tagName === "BLOCKQUOTE" || tagName === "H2" || tagName === "H3" || tagName === "H4" || tagName === "LI") &&
          !clean.textContent.trim() &&
          !clean.querySelector("br")) {
          clean.appendChild(document.createElement("br"));
        }

        target.appendChild(clean);
      });
    }

    var sandbox = document.createElement("div");
    sandbox.innerHTML = String(html || "");
    var output = document.createElement("div");
    appendSanitizedChildren(sandbox, output);
    return output.innerHTML;
  }

  function columnContentToHtml(content) {
    if (Array.isArray(content)) {
      return content.map(function (paragraph) {
        var text = String(paragraph || "").trim();
        return text ? "<p>" + escapeHtml(text).replace(/\n/g, "<br>") + "</p>" : "";
      }).filter(Boolean).join("");
    }

    var raw = String(content || "").trim();
    if (!raw) return "";

    if (isProbablyHtml(raw)) {
      return sanitizeColumnContentHtml(raw);
    }

    return raw
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(function (paragraph) {
        var text = String(paragraph || "").trim();
        return text ? "<p>" + escapeHtml(text).replace(/\n/g, "<br>") + "</p>" : "";
      })
      .filter(Boolean)
      .join("");
  }

  function columnContentToPlainText(content) {
    if (Array.isArray(content)) {
      return content.join("\n\n");
    }

    var raw = String(content || "").trim();
    if (!raw) return "";

    if (isProbablyHtml(raw)) {
      return htmlToPlainText(raw);
    }

    return raw;
  }

  function clampString(value, maxLength) {
    var text = String(value || "");
    var limit = parseInt(maxLength, 10);
    if (!isFinite(limit) || limit <= 0) return text;
    return text.slice(0, limit);
  }

  function sanitizeMediaUrl(value, fallback) {
    var raw = String(value || "").trim();
    if (!raw) return fallback || "";

    try {
      var parsed = new URL(raw, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "blob:") {
        return parsed.href;
      }
    } catch (error) {
      return fallback || "";
    }

    return fallback || "";
  }

  function sanitizeIframeUrl(value, fallback) {
    var raw = String(value || "").trim();
    if (!raw) return fallback || "";

    try {
      var parsed = new URL(raw, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.href;
      }
    } catch (error) {
      return fallback || "";
    }

    return fallback || "";
  }

  function mergeById(baseItems, localItems, options) {
    var merged = {};
    var sortFn = options && options.sortFn;

    (baseItems || []).forEach(function (item) {
      merged[String(item.id)] = clone(item);
    });

    (localItems || []).forEach(function (item) {
      if (!item || !item.id) return;
      if (item._deleted) {
        delete merged[String(item.id)];
        return;
      }

      merged[String(item.id)] = clone(item);
    });

    var result = Object.keys(merged).map(function (key) { return merged[key]; });
    if (typeof sortFn === "function") {
      result.sort(sortFn);
    }
    return result;
  }

  function getBasePrograms() {
    return Array.isArray(window.PROGRAMAS) ? window.PROGRAMAS.map(clone) : [];
  }

  function getBaseEpisodes() {
    return Array.isArray(window.EPISODIOS) ? window.EPISODIOS.map(clone) : [];
  }

  function getBaseColumns() {
    return Array.isArray(window.COLUMNAS) ? window.COLUMNAS.map(clone) : [];
  }

  function getBasePublications() {
    return Array.isArray(window.PUBLICACIONES) ? window.PUBLICACIONES.map(clone) : [];
  }

  function getPrograms() {
    return mergeById(getBasePrograms(), readArray(STORAGE_KEYS.programs), {
      sortFn: function (a, b) {
        return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
      }
    }).filter(function (program) {
      return program.visible !== false;
    });
  }

  function getProgramsForAdmin() {
    return mergeById(getBasePrograms(), readArray(STORAGE_KEYS.programs), {
      sortFn: function (a, b) {
        return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
      }
    });
  }

  function saveProgram(program) {
    var localItems = readArray(STORAGE_KEYS.programs);
    var id = program.id || slugify(program.nombre) || ("programa-" + Date.now());
    var payload = clone(program);
    payload.id = id;
    if (typeof payload.visible !== "boolean") payload.visible = true;
    delete payload._deleted;

    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = payload;
    } else {
      localItems.push(payload);
    }

    writeArray(STORAGE_KEYS.programs, localItems);
    flushRemoteSync();
    queueRemoteSync();
    return payload;
  }

  function deleteProgram(id) {
    var localItems = readArray(STORAGE_KEYS.programs);
    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = { id: id, _deleted: true };
    } else {
      localItems.push({ id: id, _deleted: true });
    }

    writeArray(STORAGE_KEYS.programs, localItems);
    flushRemoteSync();
    queueRemoteSync();
  }

  function getEpisodes() {
    return mergeById(getBaseEpisodes(), readArray(STORAGE_KEYS.episodes), {
      sortFn: function (a, b) {
        return new Date((normalizeDate(b.fecha) || "1900-01-01") + "T12:00:00").getTime() -
          new Date((normalizeDate(a.fecha) || "1900-01-01") + "T12:00:00").getTime();
      }
    }).filter(function (episode) {
      return episode.visible !== false;
    });
  }

  function getEpisodesForAdmin() {
    return mergeById(getBaseEpisodes(), readArray(STORAGE_KEYS.episodes), {
      sortFn: function (a, b) {
        return new Date((normalizeDate(b.fecha) || "1900-01-01") + "T12:00:00").getTime() -
          new Date((normalizeDate(a.fecha) || "1900-01-01") + "T12:00:00").getTime();
      }
    });
  }

  function saveEpisode(episode) {
    var localItems = readArray(STORAGE_KEYS.episodes);
    var id = episode.id || ("ep-" + Date.now());
    var payload = clone(episode);
    payload.id = id;
    if (typeof payload.visible !== "boolean") payload.visible = true;
    payload.transcripcion = Array.isArray(payload.transcripcion) ? payload.transcripcion : parseTranscript(payload.transcripcion);
    delete payload._deleted;

    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = payload;
    } else {
      localItems.push(payload);
    }

    writeArray(STORAGE_KEYS.episodes, localItems);
    flushRemoteSync();
    queueRemoteSync();
    return payload;
  }

  function deleteEpisode(id) {
    var localItems = readArray(STORAGE_KEYS.episodes);
    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = { id: id, _deleted: true };
    } else {
      localItems.push({ id: id, _deleted: true });
    }

    writeArray(STORAGE_KEYS.episodes, localItems);
    flushRemoteSync();
    queueRemoteSync();
  }

  function normalizeColumnForSite(column) {
    var views = getColumnViews();
    var columnId = String(column.id);
    var contentHtml = column.contenidoHtml ? sanitizeColumnContentHtml(column.contenidoHtml) : columnContentToHtml(column.contenido);
    var contentText = columnContentToPlainText(column.contenidoHtml || column.contenido);
    var hashtags = normalizeHashtagList(column.hashtags);
    var columnImage = column.imagen || column.banner || "images/col01_img.jpg";
    return {
      id: column.id,
      titulo: column.titulo || "Sin titulo",
      autor: resolveColumnAuthor(column),
      autorId: column.autorId || slugify(column.autor || ""),
      fecha: formatDisplayDate(column.fecha),
      lectura: column.lectura || estimateReadingLabel(contentText),
      imagen: columnImage,
      banner: columnImage,
      resumen: column.resumen || "",
      contenido: contentText,
      contenidoHtml: contentHtml,
      hashtags: hashtags,
      vistas: views[columnId] || 0,
      categoria: column.categoria || "Opinion",
      estado: column.estado || "publicada",
      visible: column.visible !== false
    };
  }

  function getColumnViews() {
    var raw = readObject(STORAGE_KEYS.columnViews);
    var normalized = {};

    Object.keys(raw).forEach(function (key) {
      var value = parseInt(raw[key], 10);
      normalized[String(key)] = isFinite(value) && value > 0 ? value : 0;
    });

    return normalized;
  }

  function formatViewLabel(count) {
    var value = parseInt(count, 10);
    var total = isFinite(value) && value > 0 ? value : 0;
    return total + " vista" + (total === 1 ? "" : "s");
  }

  function getColumnsForAdmin() {
    return mergeById(getBaseColumns().map(function (column) {
      var autorId = column.autorId || slugify(column.autor || "");
      var contenidoHtml = column.contenidoHtml ? sanitizeColumnContentHtml(column.contenidoHtml) : columnContentToHtml(column.contenido);
      return {
        id: column.id,
        titulo: column.titulo,
        autor: resolveColumnAuthor(column),
        autorId: autorId,
        fecha: normalizeDate(column.fecha),
        lectura: column.lectura || estimateReadingLabel(columnContentToPlainText(column.contenidoHtml || column.contenido)),
        imagen: column.imagen || column.banner,
        banner: column.imagen || column.banner,
        resumen: column.resumen,
        hashtags: Array.isArray(column.hashtags) ? normalizeHashtagList(column.hashtags).join(", ") : String(column.hashtags || ""),
        contenido: columnContentToPlainText(column.contenidoHtml || column.contenido),
        contenidoHtml: contenidoHtml,
        categoria: column.categoria || "Opinion",
        estado: "publicada",
        visible: true
      };
    }), readArray(STORAGE_KEYS.columns), {
      sortFn: function (a, b) {
        return new Date((a.fecha || "1900-01-01") + "T12:00:00").getTime() <
          new Date((b.fecha || "1900-01-01") + "T12:00:00").getTime() ? 1 : -1;
      }
    });
  }

  function getColumns() {
    return getColumnsForAdmin()
      .filter(function (column) {
        return column.estado === "publicada" && column.visible !== false;
      })
      .map(normalizeColumnForSite);
  }

  function saveColumn(column) {
    var localItems = readArray(STORAGE_KEYS.columns);
    var id = column.id || ("col-" + Date.now());
    var payload = clone(column);
    payload.id = id;
    payload.titulo = clampString(payload.titulo, 120);
    payload.resumen = clampString(payload.resumen, 280);
    payload.autorId = String(payload.autorId || slugify(payload.autor || ""));
    if (typeof payload.visible !== "boolean") payload.visible = true;
    if (!payload.imagen && payload.banner) {
      payload.imagen = payload.banner;
    }
    payload.banner = payload.imagen || payload.banner;
    payload.hashtags = normalizeHashtagList(payload.hashtags);
    payload.contenidoHtml = sanitizeColumnContentHtml(payload.contenidoHtml || payload.contenido || "");
    payload.contenido = payload.contenidoHtml;
    payload.lectura = payload.lectura || estimateReadingLabel(columnContentToPlainText(payload.contenidoHtml));
    delete payload._deleted;

    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = payload;
    } else {
      localItems.push(payload);
    }

    writeArray(STORAGE_KEYS.columns, localItems);
    return payload;
  }

  function deleteColumn(id) {
    var localItems = readArray(STORAGE_KEYS.columns);
    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = { id: id, _deleted: true };
    } else {
      localItems.push({ id: id, _deleted: true });
    }

    writeArray(STORAGE_KEYS.columns, localItems);
    var views = getColumnViews();
    if (Object.prototype.hasOwnProperty.call(views, String(id))) {
      delete views[String(id)];
      writeObject(STORAGE_KEYS.columnViews, views);
    }
  }

  function getPublicationsForAdmin() {
    return mergeById(getBasePublications(), readArray(STORAGE_KEYS.publications), {
      sortFn: function (a, b) {
        return String(b.fecha || "").localeCompare(String(a.fecha || ""), "es");
      }
    });
  }

  function getPublications() {
    return getPublicationsForAdmin().filter(function (publication) {
      return publication.visible !== false;
    });
  }

  function savePublication(publication) {
    var localItems = readArray(STORAGE_KEYS.publications);
    var id = publication.id || ("pub-" + Date.now());
    var payload = clone(publication);
    payload.id = id;
    if (typeof payload.visible !== "boolean") payload.visible = true;
    delete payload._deleted;

    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = payload;
    } else {
      localItems.push(payload);
    }

    writeArray(STORAGE_KEYS.publications, localItems);
    flushRemoteSync();
    queueRemoteSync();
    return payload;
  }

  function deletePublication(id) {
    var localItems = readArray(STORAGE_KEYS.publications);
    var index = localItems.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index >= 0) {
      localItems[index] = { id: id, _deleted: true };
    } else {
      localItems.push({ id: id, _deleted: true });
    }

    writeArray(STORAGE_KEYS.publications, localItems);
    flushRemoteSync();
    queueRemoteSync();
  }

  function buildDefaultPageContent() {
    return {
      about: {
        teamTitle: "Equipo Editorial",
        teamMembers: [
          {
            name: "Jean Smith",
            role: "Editora asociada",
            bio: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur ab quas facilis obcaecati non ea, est odit repellat distinctio incidunt, quia aliquam eveniet quod deleniti impedit sapiente atque tenetur porro?",
            image: "images/person_1.jpg",
            twitter: "#",
            instagram: "#",
            facebook: "#",
            linkedin: "#"
          },
          {
            name: "David A. Vásquez Stuardo",
            role: "Editor general",
            bio: "Agrónomo y Máster en Gestión de Recursos Naturales. Especialista en dinámicas territoriales con más de una década en campo. Editor general comprometido con el rigor y la accesibilidad.",
            image: "images/person_2.jpg",
            twitter: "#",
            instagram: "#",
            facebook: "#",
            linkedin: "#"
          },
          {
            name: "John Smith",
            role: "Editor de contenidos",
            bio: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur ab quas facilis obcaecati non ea, est odit repellat distinctio incidunt, quia aliquam eveniet quod deleniti impedit sapiente atque tenetur porro?",
            image: "images/person_4.jpg",
            twitter: "#",
            instagram: "#",
            facebook: "#",
            linkedin: "#"
          }
        ],
        manifestoImage: "images/hero_bg_1.jpg",
        manifestoLeft: "Esta plataforma nace del convencimiento de que la complejidad territorial latinoamericana requiere análisis riguroso y multiformato. Publicamos desde perspectivas que articulan disciplinas: ecología política, sociología rural, agronomía y geografía ambiental. No buscamos simplificar realidades, sino hacerlas accesibles sin perder profundidad.\n\nNos enfocamos en cuestiones que moldean territorios: fragmentación de paisajes, conservación ambiental, conflictividades rurales y justicia territorial. Estos no son temas técnicos aislados, sino cuestiones políticas que afectan vidas de comunidades en toda América Latina.",
        manifestoRight: "Producimos en múltiples formatos: artículos de análisis, podcasts, reportes técnicos y ensayos reflexivos. Cada pieza busca alimentar debate público informado sin sacrificar rigor académico. El conocimiento sobre territorios debe circular más allá de universidades, llegando a quienes deciden y a comunidades que viven sus consecuencias.\n\nNos compromete comprender territorios como condición para habitarlos justamente. Por eso publicamos voces diversas: investigadores, dirigentes comunitarios, activistas ambientales y especialistas en políticas. Cada perspectiva suma a entendimiento más denso de lo que está en juego."
      },
      columnistas: {
        title: "Nuestros Columnistas",
        items: [
          {
            id: "megan-smith",
            name: "Megan Smith",
            role: "FilosofÃ­a PolÃ­tica",
            bio: "Doctora en FilosofÃ­a por la Universidad de Buenos Aires. Escribe sobre pensamiento crÃ­tico y democracia.",
            image: "images/person_1.jpg",
            twitter: "#",
            instagram: "#",
            facebook: "#",
            linkedin: "#"
          },
          {
            id: "ana-garcia",
            name: "Ana GarcÃ­a",
            role: "EconomÃ­a Laboral",
            bio: "Economista especializada en mercado de trabajo y tecnologÃ­a. Investiga el impacto de la automatizaciÃ³n.",
            image: "images/person_4.jpg",
            twitter: "#",
            instagram: "#",
            facebook: "#",
            linkedin: "#"
          },
          {
            id: "carlos-ruiz",
            name: "Carlos Ruiz",
            role: "ComunicaciÃ³n y PolÃ­tica",
            bio: "Periodista y analista polÃ­tico. Cubre la intersecciÃ³n entre medios digitales, redes sociales y democracia.",
            image: "images/person_5.jpg",
            twitter: "#",
            instagram: "#",
            facebook: "#",
            linkedin: "#"
          }
        ]
      },
      invitados: {
        title: "Invitados Destacados",
        items: [
          {
            name: "Megan Smith",
            role: "Directora Editorial",
            bio: "Especialista en narrativa digital y curaduría de contenidos editoriales.",
            image: "images/person_1.jpg"
          },
          {
            name: "David A. Vásquez Stuardo",
            role: "Editor general",
            bio: "Agrónomo y gestor territorial con foco en ambiente, ciencia y divulgación.",
            image: "images/person_2.jpg"
          },
          {
            name: "Philip Martin",
            role: "Editor de contenidos",
            bio: "Acompaña procesos de edición, guion y despliegue de publicaciones multiformato.",
            image: "images/person_3.jpg"
          },
          {
            name: "Steven Ericson",
            role: "Colaborador invitado",
            bio: "Analiza tendencias, formatos y distribución de contenidos editoriales.",
            image: "images/person_4.jpg"
          },
          {
            name: "Nathan Dumlao",
            role: "Investigador invitado",
            bio: "Se enfoca en innovación, entrevistas y mediación entre academia y público general.",
            image: "images/person_5.jpg"
          },
          {
            name: "Brook Smith",
            role: "Columnista invitado",
            bio: "Escribe sobre política pública, territorio y cultura editorial contemporánea.",
            image: "images/person_6.jpg"
          }
        ]
      },
      contact: {
        firstNameLabel: "Nombre",
        lastNameLabel: "Apellido",
        emailLabel: "Correo electrónico",
        subjectLabel: "Asunto",
        messageLabel: "Mensaje",
        sendLabel: "Enviar mensaje",
        addressLabel: "Dirección",
        address: "203 Fake St. Mountain View, San Francisco, California, USA",
        phoneLabel: "Teléfono",
        phone: "+1 232 3235 324",
        emailInfoLabel: "Correo",
        emailInfo: "youremail@domain.com",
        subscribeTitle: "Suscríbete",
        subscribeText: "Recibe novedades, columnas y publicaciones directamente en tu correo.",
        subscribePlaceholder: "Ingresa tu email",
        subscribeButton: "Enviar",
        subscribeImage: "images/hero_bg_1.jpg"
      }
    };
  }

  function getPageContent() {
    var defaults = buildDefaultPageContent();
    var stored = readObject(CONTENT_STORAGE_KEY);

    Object.keys(defaults).forEach(function (key) {
      if (!stored[key] || typeof stored[key] !== "object") return;
      defaults[key] = Object.assign({}, defaults[key], clone(stored[key]));
    });

    return defaults;
  }

  function getPageContentSection(sectionId) {
    var all = getPageContent();
    return all[sectionId] ? clone(all[sectionId]) : null;
  }

  function savePageContentSection(sectionId, data) {
    var all = getPageContent();
    if (!all[sectionId]) return null;
    all[sectionId] = clone(data);
    writeObject(CONTENT_STORAGE_KEY, all);
    hydrateGlobals();
    flushRemoteSync();
    queueRemoteSync();
    return all[sectionId];
  }

  function sanitizeImageUrl(value, fallback) {
    var raw = String(value || "").trim();
    if (!raw) return fallback || "";

    if (/^data:image\//i.test(raw)) {
      return raw;
    }

    try {
      var parsed = new URL(raw, window.location.origin);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1") {
        return parsed.pathname + (parsed.search || "") + (parsed.hash || "");
      }
      if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "blob:") {
        if (isLocalPreviewEnvironment()) {
          return parsed.href;
        }
        if (parsed.protocol === "blob:") {
          return parsed.href;
        }
        return "/.netlify/functions/image-proxy?url=" + encodeURIComponent(parsed.href);
      }
    } catch (error) {
      return fallback || "";
    }

    return fallback || "";
  }

  function sanitizeLinkUrl(value) {
    var raw = String(value || "").trim();
    if (!raw) return "#";
    if (raw === "#") return raw;

    try {
      var parsed = new URL(raw, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" || parsed.protocol === "tel:") {
        return parsed.href;
      }
    } catch (error) {
      return "#";
    }

    return "#";
  }

  function setSafeBackgroundImage(element, value, fallback) {
    if (!element) return;
    var safeUrl = sanitizeImageUrl(value, fallback || "");
    element.style.backgroundImage = safeUrl ? 'url("' + safeUrl.replace(/"/g, "%22") + '")' : "";
  }

  function setSafeImageSource(image, value, fallback, altText) {
    if (!image) return;
    image.src = sanitizeImageUrl(value, fallback || "");
    image.alt = altText || image.alt || "";
    image.decoding = "async";
    if (!image.hasAttribute("loading")) {
      image.loading = "lazy";
    }
  }

  function optimizeImages(body) {
    if (!body) return;

    Array.prototype.forEach.call(body.querySelectorAll("img"), function (image) {
      if (!image.hasAttribute("decoding")) {
        image.decoding = "async";
      }

      var shouldPrioritize = Boolean(
        image.closest("#cms-page-hero") ||
        image.closest(".site-blocks-cover") ||
        image.closest(".hero") ||
        image.closest(".site-block") ||
        image.closest(".navbar-brand")
      );

      if (shouldPrioritize) {
        image.loading = "eager";
        if (!image.hasAttribute("fetchpriority")) {
          image.setAttribute("fetchpriority", "high");
        }
      } else if (!image.hasAttribute("loading")) {
        image.loading = "lazy";
      }
    });
  }

  function appendParagraphs(container, text) {
    if (!container) return;
    container.textContent = "";

    String(text || "")
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(function (paragraph) { return paragraph.trim(); })
      .filter(Boolean)
      .forEach(function (paragraph) {
        var p = document.createElement("p");
        p.textContent = paragraph;
        container.appendChild(p);
      });
  }

  function appendSocialLinks(container, member, linkClass) {
    if (!container) return;
    container.textContent = "";

    var socialMap = [
      { key: "twitter", icon: "icon-twitter" },
      { key: "instagram", icon: "icon-instagram" },
      { key: "facebook", icon: "icon-facebook" },
      { key: "linkedin", icon: "icon-linkedin" }
    ];

    socialMap
      .filter(function (item) { return member[item.key]; })
      .forEach(function (item) {
        var link = document.createElement("a");
        link.href = sanitizeLinkUrl(member[item.key]);
        link.className = linkClass;
        var icon = document.createElement("span");
        icon.className = item.icon;
        link.appendChild(icon);
        container.appendChild(link);
      });
  }

  function getTeamMemberColumnClass(totalMembers, isHome) {
    var suffix = isHome ? " mb-5 mb-lg-5" : " text-center mb-5";

    if (totalMembers <= 1) {
      return "col-md-8 col-lg-6" + suffix;
    }
    if (totalMembers === 2 || totalMembers === 4) {
      return "col-md-6 col-lg-5" + suffix;
    }

    return "col-md-6 col-lg-4" + suffix;
  }

  function renderAboutContent(body) {
    var about = getPageContentSection("about");
    if (!about) return;

    var teamTitle = body.querySelector("#about-team-title");
    var aboutGrid = body.querySelector("#about-team-grid");
    var homeTeamTitle = body.querySelector("#home-team-title");
    var homeTeamGrid = body.querySelector("#home-team-grid");
    var manifestoImage = body.querySelector("#about-manifesto-image");
    var manifestoLeft = body.querySelector("#about-manifesto-left");
    var manifestoRight = body.querySelector("#about-manifesto-right");

    if (teamTitle) {
      teamTitle.textContent = about.teamTitle || "Equipo Editorial";
    }
    if (homeTeamTitle) {
      homeTeamTitle.textContent = about.teamTitle || "El Equipo";
    }
    var visibleMembers = (about.teamMembers || []).slice(0, 6);
    if (aboutGrid) {
      aboutGrid.className = "row justify-content-center";
      aboutGrid.textContent = "";
      visibleMembers.forEach(function (member) {
        var column = document.createElement("div");
        column.className = getTeamMemberColumnClass(visibleMembers.length, false);
        column.setAttribute("data-aos", "fade-up");

        var image = document.createElement("img");
        image.className = "cms-team-member-photo rounded-circle mb-3";
        setSafeImageSource(image, member.image, "images/person_1.jpg", member.name || "Miembro del equipo");

        var name = document.createElement("h2");
        name.className = "text-black font-weight-light mb-2";
        name.textContent = member.name || "Sin nombre";

        var role = document.createElement("div");
        role.className = "text-muted mb-3";
        role.textContent = member.role || "";

        var bio = document.createElement("p");
        bio.textContent = member.bio || "";

        var socials = document.createElement("p");
        appendSocialLinks(socials, member, "pl-0 pr-3");

        column.appendChild(image);
        column.appendChild(name);
        column.appendChild(role);
        column.appendChild(bio);
        column.appendChild(socials);
        aboutGrid.appendChild(column);
      });
    }
    if (homeTeamGrid) {
      homeTeamGrid.className = "row justify-content-center";
      homeTeamGrid.textContent = "";
      visibleMembers.forEach(function (member) {
        var column = document.createElement("div");
        column.className = getTeamMemberColumnClass(visibleMembers.length, true);

        var card = document.createElement("div");
        card.className = "team-member";

        var image = document.createElement("img");
        image.className = "img-fluid";
        setSafeImageSource(image, member.image, "images/person_1.jpg", member.name || "Miembro del equipo");

        var text = document.createElement("div");
        text.className = "text";

        var name = document.createElement("h2");
        name.className = "mb-2 font-weight-light h4";
        name.textContent = member.name || "Sin nombre";

        var role = document.createElement("span");
        role.className = "d-block mb-2 text-white-opacity-05";
        role.textContent = member.role || "";

        var bio = document.createElement("p");
        bio.className = "mb-4";
        bio.textContent = member.bio || "";

        var socials = document.createElement("p");
        appendSocialLinks(socials, member, "text-white p-2");

        text.appendChild(name);
        text.appendChild(role);
        text.appendChild(bio);
        text.appendChild(socials);

        card.appendChild(image);
        card.appendChild(text);
        column.appendChild(card);
        homeTeamGrid.appendChild(column);
      });
    }
    if (manifestoImage) {
      setSafeImageSource(manifestoImage, about.manifestoImage, "images/hero_bg_1.jpg", "Manifiesto");
    }
    if (manifestoLeft) {
      appendParagraphs(manifestoLeft, about.manifestoLeft);
    }
    if (manifestoRight) {
      appendParagraphs(manifestoRight, about.manifestoRight);
    }
  }

  function renderGuestsContent(body) {
    var guests = getPageContentSection("invitados");
    if (!guests) return;

    var title = body.querySelector("#home-guests-title");
    var carousel = body.querySelector(".nonloop-block-13");
    var items = Array.isArray(guests.items) ? guests.items : [];

    if (title) {
      title.textContent = guests.title || "Invitados Destacados";
    }

    if (carousel) {
      carousel.textContent = "";
      items.forEach(function (guest) {
        var card = document.createElement("div");
        card.className = "text-center p-3 p-md-5 bg-white";

        var media = document.createElement("div");
        media.className = "mb-4";

        var image = document.createElement("img");
        image.className = "w-50 mx-auto img-fluid rounded-circle";
        setSafeImageSource(image, guest.image, "images/person_1.jpg", guest.name || "Invitado destacado");
        media.appendChild(image);

        var content = document.createElement("div");

        var name = document.createElement("h3");
        name.className = "font-weight-light h5";
        name.textContent = guest.name || "Sin nombre";

        var bio = document.createElement("p");
        bio.textContent = guest.bio || "";

        var role = document.createElement("p");
        role.className = "text-muted mb-0";
        role.textContent = guest.role || "";

        content.appendChild(name);
        content.appendChild(bio);
        content.appendChild(role);

        card.appendChild(media);
        card.appendChild(content);
        carousel.appendChild(card);
      });
    }
  }

  function renderColumnistasContent(body) {
    var columnistas = getPageContentSection("columnistas");
    if (!columnistas) return;

    var section = body.querySelector('[data-cms-section="columnistas"]');
    if (!section) return;

    var items = normalizeColumnistList(columnistas.items);
    section.textContent = "";

    var container = document.createElement("div");
    container.className = "container";
    container.setAttribute("data-aos", "fade-up");

    var titleRow = document.createElement("div");
    titleRow.className = "row mb-5";

    var titleColumn = document.createElement("div");
    titleColumn.className = "col-md-12 text-center";

    var title = document.createElement("h2");
    title.className = "font-weight-bold text-black";
    title.textContent = columnistas.title || "Nuestros Columnistas";

    titleColumn.appendChild(title);
    titleRow.appendChild(titleColumn);
    container.appendChild(titleRow);

    var grid = document.createElement("div");
    grid.className = "row";

    items.forEach(function (item) {
      var column = document.createElement("div");
      column.className = "col-md-6 col-lg-4 mb-5";

      var card = document.createElement("div");
      card.className = "team-member";

      var image = document.createElement("img");
      image.className = "img-fluid";
      setSafeImageSource(image, item.image, "images/person_1.jpg", item.name || "Columnista");

      var text = document.createElement("div");
      text.className = "text";

      var name = document.createElement("h2");
      name.className = "mb-2 font-weight-light h4";
      var nameLink = document.createElement("a");
      nameLink.href = getColumnistaPageUrl(item);
      nameLink.textContent = item.name || "Sin nombre";
      nameLink.className = "columnista-link";
      name.appendChild(nameLink);

      var role = document.createElement("span");
      role.className = "d-block mb-2 text-white-opacity-05";
      role.textContent = item.role || "";

      var bio = document.createElement("p");
      bio.className = "mb-4";
      bio.textContent = item.bio || "";

      var socials = document.createElement("p");
      appendSocialLinks(socials, item, "text-white p-2");

      text.appendChild(name);
      text.appendChild(role);
      text.appendChild(bio);
      text.appendChild(socials);

      card.appendChild(image);
      card.appendChild(text);
      column.appendChild(card);
      grid.appendChild(column);
    });

    container.appendChild(grid);
    section.appendChild(container);
  }

  function renderContactContent(body) {
    var contact = getPageContentSection("contact");
    if (!contact) return;

    var map = {
      "#contact-first-name-label": contact.firstNameLabel,
      "#contact-last-name-label": contact.lastNameLabel,
      "#contact-email-label": contact.emailLabel,
      "#contact-subject-label": contact.subjectLabel,
      "#contact-message-label": contact.messageLabel,
      "#contact-address-label": contact.addressLabel,
      "#contact-address-value": contact.address,
      "#contact-phone-label": contact.phoneLabel,
      "#contact-email-info-label": contact.emailInfoLabel,
      "#contact-subscribe-title": contact.subscribeTitle,
      "#contact-subscribe-text": contact.subscribeText
    };

    Object.keys(map).forEach(function (selector) {
      var element = body.querySelector(selector);
      if (!element) return;
      element.textContent = map[selector] || "";
    });

    var sendButton = body.querySelector("#contact-send-button");
    if (sendButton) {
      sendButton.value = contact.sendLabel || "Enviar mensaje";
    }

    var phoneLink = body.querySelector("#contact-phone-link");
    if (phoneLink) {
      phoneLink.href = contact.phone ? "tel:" + String(contact.phone).replace(/\s+/g, "") : "#";
      phoneLink.textContent = contact.phone || "";
    }

    var emailLink = body.querySelector("#contact-email-link");
    if (emailLink) {
      emailLink.href = contact.emailInfo ? "mailto:" + contact.emailInfo : "#";
      emailLink.textContent = contact.emailInfo || "";
    }

    var subscribeInput = body.querySelector("#contact-subscribe-input");
    if (subscribeInput) {
      subscribeInput.placeholder = contact.subscribePlaceholder || "";
      subscribeInput.setAttribute("aria-label", contact.subscribePlaceholder || "");
    }

    var subscribeButton = body.querySelector("#contact-subscribe-button");
    if (subscribeButton) {
      subscribeButton.textContent = contact.subscribeButton || "Enviar";
    }

    var subscribeBanner = body.querySelector("#contact-subscribe-banner");
    if (subscribeBanner && contact.subscribeImage) {
      setSafeBackgroundImage(subscribeBanner, contact.subscribeImage, "images/hero_bg_1.jpg");
    }
  }

  function renderFooterContent(body) {
    if (!body) return;

    var footer = body.querySelector('footer[data-cms-section="footer"]');
    if (!footer) return;

    var socialLinks = [
      { href: "https://www.facebook.com/", label: "Facebook", icon: "icon-facebook" },
      { href: "https://www.instagram.com/", label: "Instagram", icon: "icon-instagram" },
      { href: "https://www.youtube.com/", label: "YouTube", icon: "icon-youtube" },
      { href: "https://open.spotify.com/", label: "Spotify", icon: "icon-spotify" }
    ];

    footer.classList.add("site-footer", "site-footer--structured");
    footer.innerHTML = '' +
      '<div class="container">' +
      '<div class="site-footer__grid">' +
      '<div class="site-footer__brand">' +
      '<a href="index.html" class="site-footer__logo-link" aria-label="Ir al inicio"><img src="logo_hor_col.png" alt="El Deslinde" class="site-footer__logo"></a>' +
      '<p>Editorial digital de contenido cr&iacute;tico sobre territorio, agricultura y sociedad.</p>' +
      '<p class="site-footer__brand-note">Podcasts, columnas y publicaciones en una sola plataforma.</p>' +
      '</div>' +
      '<div class="site-footer__column">' +
      '<h3 class="footer-heading mb-4">Explorar</h3>' +
      '<ul class="list-unstyled site-footer__links">' +
      '<li><a href="programas.html">Programas</a></li>' +
      '<li><a href="columnas.html">Columnas</a></li>' +
      '<li><a href="publicaciones.html">Publicaciones</a></li>' +
      '<li><a href="about.html">Nosotros</a></li>' +
      '</ul>' +
      '</div>' +
      '<div class="site-footer__column">' +
      '<h3 class="footer-heading mb-4">Contenido reciente</h3>' +
      '<ul id="footer-episodios" class="list-unstyled site-footer__latest"></ul>' +
      '</div>' +
      '<div class="site-footer__column">' +
      '<h3 class="footer-heading mb-4">S&iacute;guenos</h3>' +
      '<ul class="list-unstyled site-footer__links site-footer__social-links">' +
      socialLinks.map(function (item) {
        return '<li><a href="' + item.href + '" target="_blank" rel="noopener"><span class="' + item.icon + '"></span> ' + item.label + '</a></li>';
      }).join("") +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<div class="site-footer__bottom">' +
      '<p class="site-footer__copyright">Copyright &copy; ' + new Date().getFullYear() + ' El Deslinde. Todos los derechos reservados.</p>' +
      '</div>' +
      '</div>';
  }

  function buildDefaultPages() {
    var pages = {};
    PAGE_DEFINITIONS.forEach(function (page) {
      pages[page.id] = {
        visible: true,
        heroTitle: "",
        heroSubtitle: "",
        heroImage: page.id === "index" ? "images/hero_bg_1.jpg" : ""
      };
      if (page.id === "index") {
        pages[page.id].featuredContentType = "";
        pages[page.id].featuredContentId = "";
        pages[page.id].featuredEpisodeId = "";
        pages[page.id].manualHeroTitle = "";
        pages[page.id].manualHeroMeta = "";
        pages[page.id].manualHeroAudio = "";
        pages[page.id].manualHeroTranscriptLink = "";
      }
    });
    return pages;
  }

  function getPageConfigs() {
    var stored = readObject(PAGE_STORAGE_KEY);
    var merged = buildDefaultPages();

    Object.keys(merged).forEach(function (key) {
      if (!stored[key] || typeof stored[key] !== "object") return;
      Object.keys(merged[key]).forEach(function (field) {
        if (stored[key][field] !== undefined) {
          merged[key][field] = stored[key][field];
        }
      });
    });

    if (merged.index) {
      if (!merged.index.featuredContentType && merged.index.featuredEpisodeId) {
        merged.index.featuredContentType = "episode";
      }
      if (!merged.index.featuredContentId && merged.index.featuredEpisodeId) {
        merged.index.featuredContentId = merged.index.featuredEpisodeId;
      }
    }

    return merged;
  }

  function getPageConfig(pageId) {
    var configs = getPageConfigs();
    return configs[pageId] || buildDefaultPages()[pageId] || null;
  }

  function getSectionConfig() {
    return readObject("editorialCmsSections");
  }

  function isSectionEnabled(pageKey, sectionKey) {
    var config = getSectionConfig();
    return !(config[pageKey] && config[pageKey][sectionKey] === false);
  }

  function isNavigationLinkVisible(pageId) {
    var pageConfig = getPageConfig(pageId);
    if (pageConfig && pageConfig.visible === false) return false;

    if (!isSectionEnabled(pageId, "footer")) {
      return false;
    }

    var sectionMap = {
      programas: "listado-programas",
      columnas: "listado-columnas",
      publicaciones: "catalogo",
      about: "equipo-editorial",
      contact: "formulario"
    };

    var sectionKey = sectionMap[pageId];
    if (sectionKey && !isSectionEnabled(pageId, sectionKey)) {
      return false;
    }

    return true;
  }

  function savePageConfig(pageId, config) {
    var all = getPageConfigs();
    if (!all[pageId]) return null;
    all[pageId] = {
      visible: config.visible !== false,
      heroTitle: pageId === "index" ? "" : String(config.heroTitle || ""),
      heroSubtitle: pageId === "index" ? "" : String(config.heroSubtitle || ""),
      heroImage: String(config.heroImage || "")
    };
    if (pageId === "index") {
      all[pageId].featuredContentType = String(config.featuredContentType || "");
      all[pageId].featuredContentId = String(config.featuredContentId || "");
      all[pageId].featuredEpisodeId = String(config.featuredEpisodeId || "");
      all[pageId].manualHeroTitle = String(config.manualHeroTitle || "");
      all[pageId].manualHeroMeta = String(config.manualHeroMeta || "");
      all[pageId].manualHeroAudio = String(config.manualHeroAudio || "");
      all[pageId].manualHeroTranscriptLink = String(config.manualHeroTranscriptLink || "");
    }
    writeObject(PAGE_STORAGE_KEY, all);
    flushRemoteSync();
    queueRemoteSync();
    if (isLocalPreviewEnvironment()) {
      return Promise.resolve(all[pageId]);
    }
    return syncStateNow().then(function () {
      return all[pageId];
    });
  }

  function hydrateGlobals() {
    if (typeof window.PROGRAMAS !== "undefined") {
      window.PROGRAMAS = getPrograms();
    }
    if (typeof window.EPISODIOS !== "undefined") {
      window.EPISODIOS = getEpisodes();
    }
    if (typeof window.COLUMNAS !== "undefined") {
      window.COLUMNAS = getColumns();
    }
    if (typeof window.PUBLICACIONES !== "undefined") {
      window.PUBLICACIONES = getPublications();
    }
  }

  function applyPageConfig(root) {
    var scope = root || document;
    var body = scope.body || document.body;
    if (!body) return;

    var pageId = body.getAttribute("data-cms-page");
    if (!pageId) return;

    var config = getPageConfig(pageId);
    if (!config) return;

    renderAboutContent(body);
    renderGuestsContent(body);
    renderColumnistasContent(body);
    renderContactContent(body);
    renderFooterContent(body);

    applyNavigationVisibility(body);
    applyHomepageSectionVisibility(body);

    if (config.visible === false) {
      var wrap = body.querySelector(".site-wrap");
      if (wrap) wrap.style.display = "none";
      if (!body.querySelector(".cms-page-hidden")) {
        var hidden = document.createElement("div");
        hidden.className = "cms-page-hidden";
        hidden.style.padding = "72px 24px";
        hidden.style.textAlign = "center";
        hidden.innerHTML = "<h1 style=\"font-family:Poppins,sans-serif;\">Pagina temporalmente no visible</h1><p style=\"font-family:Poppins,sans-serif;\">Este contenido fue ocultado desde el CMS.</p>";
        body.appendChild(hidden);
      }
      return;
    }

    var hero = body.querySelector("#cms-page-hero");
    var heroTitle = body.querySelector("#cms-hero-title");
    var heroSubtitle = body.querySelector("#cms-hero-subtitle");

    if (hero && config.heroImage) {
      setSafeBackgroundImage(hero, config.heroImage, "");
    }
    if (heroTitle && config.heroTitle) {
      heroTitle.textContent = config.heroTitle;
    }
    if (heroSubtitle && config.heroSubtitle) {
      heroSubtitle.textContent = config.heroSubtitle;
    }

    window.setTimeout(function () {
      applyNavigationVisibility(body);
      applyHomepageSectionVisibility(body);
      optimizeImages(body);
    }, 0);
  }

  function setElementVisibility(element, visible) {
    if (!element) return;
    element.style.display = visible ? "" : "none";
  }

  function toggleLinksByHref(body, href, visible) {
    if (!body) return;

    body.querySelectorAll('a[href="' + href + '"]').forEach(function (link) {
      var inNavigation = link.closest(".site-navigation, .site-mobile-menu, footer");
      if (!inNavigation) return;

      var listItem = link.closest("li");
      if (listItem) {
        setElementVisibility(listItem, visible);
        return;
      }

      setElementVisibility(link, visible);
    });
  }

  function applyNavigationVisibility(body) {
    var hrefMap = {
      programas: "programas.html",
      columnas: "columnas.html",
      publicaciones: "publicaciones.html",
      about: "about.html",
      contact: "contact.html"
    };

    Object.keys(hrefMap).forEach(function (pageId) {
      toggleLinksByHref(body, hrefMap[pageId], isNavigationLinkVisible(pageId));
    });
  }

  function applyHomepageSectionVisibility(body) {
    if (!body || body.getAttribute("data-cms-page") !== "index") return;

    var sectionMap = {
      programas: ["programas-episodios"],
      episodios: ["programas-episodios"],
      columnas: ["columnas"],
      publicaciones: ["publicaciones"],
      about: ["equipo"]
    };

    var sectionVisibility = {};
    Object.keys(sectionMap).forEach(function (pageId) {
      var pageConfig = getPageConfig(pageId);
      var visible = !pageConfig || pageConfig.visible !== false;
      sectionMap[pageId].forEach(function (sectionId) {
        if (!Object.prototype.hasOwnProperty.call(sectionVisibility, sectionId)) {
          sectionVisibility[sectionId] = true;
        }
        sectionVisibility[sectionId] = sectionVisibility[sectionId] && visible;
      });
    });

    Object.keys(sectionVisibility).forEach(function (sectionId) {
      setElementVisibility(body.querySelector('[data-cms-section="' + sectionId + '"]'), sectionVisibility[sectionId]);
    });
  }

  function findPageDefinition(pageId) {
    return PAGE_DEFINITIONS.find(function (page) {
      return page.id === pageId;
    }) || null;
  }

  window.EditorialCmsSite = {
    PAGE_DEFINITIONS: PAGE_DEFINITIONS,
    STORAGE_KEYS: STORAGE_KEYS,
    PAGE_STORAGE_KEY: PAGE_STORAGE_KEY,
    slugify: slugify,
    parseTranscript: parseTranscript,
    serializeTranscript: serializeTranscript,
    sanitizeColumnContentHtml: sanitizeColumnContentHtml,
    columnContentToHtml: columnContentToHtml,
    columnContentToPlainText: columnContentToPlainText,
    sanitizeImageUrl: sanitizeImageUrl,
    getPrograms: getPrograms,
    getProgramsForAdmin: getProgramsForAdmin,
    saveProgram: saveProgram,
    deleteProgram: deleteProgram,
    getEpisodes: getEpisodes,
    getEpisodesForAdmin: getEpisodesForAdmin,
    saveEpisode: saveEpisode,
    deleteEpisode: deleteEpisode,
    getColumns: getColumns,
    getColumnsForAdmin: getColumnsForAdmin,
    saveColumn: saveColumn,
    deleteColumn: deleteColumn,
    toHashtagArray: toHashtagArray,
    getPublications: getPublications,
    getPublicationsForAdmin: getPublicationsForAdmin,
    savePublication: savePublication,
    deletePublication: deletePublication,
    getColumnViews: getColumnViews,
    getPageContent: getPageContent,
    getPageContentSection: getPageContentSection,
    savePageContentSection: savePageContentSection,
    syncStateNow: syncStateNow,
    getColumnistasForAdmin: getColumnistasForAdmin,
    getColumnistaById: getColumnistaById,
    getColumnistaPageUrl: getColumnistaPageUrl,
    getPageConfigs: getPageConfigs,
    getPageConfig: getPageConfig,
    savePageConfig: savePageConfig,
    findPageDefinition: findPageDefinition,
    hydrateGlobals: hydrateGlobals,
    formatViewLabel: formatViewLabel,
    renderAboutContent: renderAboutContent,
    renderContactContent: renderContactContent,
    applyPageConfig: applyPageConfig
  };

  hydrateRemoteState();
  hydrateGlobals();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applyPageConfig(document);
    });
  } else {
    applyPageConfig(document);
  }

})();
