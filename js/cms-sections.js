(function () {
  var STORAGE_KEY = "editorialCmsSections";
  var CONTENT_STORAGE_KEY = "editorialCmsSectionContent";
  var REMOTE_STATE_ENDPOINT = "/.netlify/functions/cms-state";
  var REMOTE_STATE_KEYS = [
    "editorialCmsProgramas",
    "editorialCmsEpisodios",
    "editorialCmsColumnas",
    "editorialCmsPublicaciones",
    "editorialCmsPages",
    "editorialCmsPageContent",
    "editorialCmsSections",
    "editorialCmsSectionContent"
  ];
  var remoteSyncTimer = null;
  var PAGE_DEFINITIONS = [
    {
      page: "index",
      label: "Inicio",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero destacado" },
        { id: "programas", label: "Resumen de programas" },
        { id: "episodios", label: "Resumen de episodios" },
        { id: "columnas", label: "Resumen de columnas" },
        { id: "publicaciones", label: "Resumen de publicaciones" },
        { id: "equipo", label: "Equipo" },
        { id: "invitados", label: "Invitados destacados" },
        { id: "suscripcion", label: "Banner de suscripcion" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "programas",
      label: "Programas",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "listado-programas", label: "Listado de programas" },
        { id: "ultimos-episodios", label: "Ultimos episodios" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "programa",
      label: "Programa individual",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "episodios-programa", label: "Episodios del programa" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "columnas",
      label: "Columnas",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "listado-columnas", label: "Listado de columnas" },
        { id: "columnistas", label: "Columnistas" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "columna",
      label: "Columna individual",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "contenido-columna", label: "Contenido principal" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "publicaciones",
      label: "Publicaciones",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "catalogo", label: "Catalogo" },
        { id: "propuesta", label: "Banner de propuesta" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "about",
      label: "Nosotros",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "equipo-editorial", label: "Equipo editorial" },
        { id: "manifiesto", label: "Presentacion" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "contact",
      label: "Contacto",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "formulario", label: "Formulario y datos" },
        { id: "suscripcion", label: "Banner de suscripcion" },
        { id: "footer", label: "Pie de pagina" }
      ]
    },
    {
      page: "single-post",
      label: "Episodio individual",
      sections: [
        { id: "header", label: "Encabezado" },
        { id: "hero", label: "Hero" },
        { id: "transcripcion", label: "Audio y transcripcion" },
        { id: "relacionados", label: "Capitulos relacionados" },
        { id: "footer", label: "Pie de pagina" }
      ]
    }
  ];

  function buildDefaultConfig() {
    var config = {};

    PAGE_DEFINITIONS.forEach(function (pageDef) {
      config[pageDef.page] = {};
      pageDef.sections.forEach(function (section) {
        config[pageDef.page][section.id] = true;
      });
    });

    return config;
  }

  function mergeWithDefaults(storedConfig) {
    var merged = buildDefaultConfig();

    if (!storedConfig || typeof storedConfig !== "object") {
      return merged;
    }

    Object.keys(merged).forEach(function (pageKey) {
      if (!storedConfig[pageKey] || typeof storedConfig[pageKey] !== "object") return;

      Object.keys(merged[pageKey]).forEach(function (sectionKey) {
        if (typeof storedConfig[pageKey][sectionKey] === "boolean") {
          merged[pageKey][sectionKey] = storedConfig[pageKey][sectionKey];
        }
      });
    });

    return merged;
  }

  function getConfig() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return mergeWithDefaults(raw ? JSON.parse(raw) : null);
    } catch (error) {
      return buildDefaultConfig();
    }
  }

  function saveConfig(config) {
    var normalized = mergeWithDefaults(config);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    queueRemoteSync();
    return normalized;
  }

  function setSectionState(pageKey, sectionKey, enabled) {
    var config = getConfig();
    if (!config[pageKey]) config[pageKey] = {};
    config[pageKey][sectionKey] = Boolean(enabled);
    return saveConfig(config);
  }

  function isSectionEnabled(pageKey, sectionKey) {
    var config = getConfig();
    return !(config[pageKey] && config[pageKey][sectionKey] === false);
  }

  function getContentConfig() {
    try {
      var raw = window.localStorage.getItem(CONTENT_STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveContentConfig(config) {
    var normalized = config && typeof config === "object" ? config : {};
    window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(normalized));
    queueRemoteSync();
    return normalized;
  }

  function getSectionContent(pageKey, sectionKey) {
    var config = getContentConfig();
    if (!config[pageKey] || typeof config[pageKey][sectionKey] !== "string") return "";
    return config[pageKey][sectionKey];
  }

  function setSectionContent(pageKey, sectionKey, html) {
    var config = getContentConfig();
    if (!config[pageKey] || typeof config[pageKey] !== "object") {
      config[pageKey] = {};
    }

    config[pageKey][sectionKey] = String(html || "");
    return saveContentConfig(config);
  }

  function clearSectionContent(pageKey, sectionKey) {
    var config = getContentConfig();
    if (config[pageKey] && Object.prototype.hasOwnProperty.call(config[pageKey], sectionKey)) {
      delete config[pageKey][sectionKey];
      if (!Object.keys(config[pageKey]).length) {
        delete config[pageKey];
      }
      saveContentConfig(config);
    }
    return config;
  }

  function sanitizeSectionUrl(value, allowImageData) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    if (allowImageData && /^data:image\//i.test(raw)) return raw;

    try {
      var parsed = new URL(raw, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" || parsed.protocol === "tel:") {
        return parsed.href;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function sanitizeSectionHtml(html) {
    var template = document.createElement("template");
    template.innerHTML = String(html || "");

    var blockedTags = ["script", "style", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "option", "meta", "link"];
    blockedTags.forEach(function (tagName) {
      Array.prototype.forEach.call(template.content.querySelectorAll(tagName), function (node) {
        node.remove();
      });
    });

    Array.prototype.forEach.call(template.content.querySelectorAll("*"), function (element) {
      Array.prototype.slice.call(element.attributes).forEach(function (attribute) {
        var name = attribute.name.toLowerCase();
        var value = attribute.value;

        if (name.indexOf("on") === 0 || name === "style") {
          element.removeAttribute(attribute.name);
          return;
        }

        if (name === "href" || name === "action" || name === "formaction" || name === "poster" || name === "xlink:href") {
          var safeUrl = sanitizeSectionUrl(value, false);
          if (safeUrl) {
            element.setAttribute(attribute.name, safeUrl);
          } else {
            element.removeAttribute(attribute.name);
          }
          return;
        }

        if (name === "src") {
          var safeSrc = sanitizeSectionUrl(value, true);
          if (safeSrc) {
            element.setAttribute(attribute.name, safeSrc);
          } else {
            element.removeAttribute(attribute.name);
          }
        }
      });
    });

    return template.content;
  }

  function renderSectionHtml(container, html) {
    if (!container) return;
    container.textContent = "";
    container.appendChild(sanitizeSectionHtml(html));
  }

  function readSnapshot() {
    var snapshot = {};

    REMOTE_STATE_KEYS.forEach(function (key) {
      try {
        var raw = window.localStorage.getItem(key);
        snapshot[key] = raw ? JSON.parse(raw) : null;
      } catch (error) {
        snapshot[key] = null;
      }
    });

    return snapshot;
  }

  function hasSnapshotData(snapshot) {
    return REMOTE_STATE_KEYS.some(function (key) {
      var value = snapshot && snapshot[key];
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === "object") return Object.keys(value).length > 0;
      return Boolean(value);
    });
  }

  function applySnapshotToLocalStorage(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;

    REMOTE_STATE_KEYS.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) return;
      var value = snapshot[key];
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
    });
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

  function syncSnapshotToServer(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    if (typeof window.fetch !== "function") return;

    window.fetch(REMOTE_STATE_ENDPOINT, {
      method: "PUT",
      credentials: "include",
      keepalive: true,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ state: snapshot })
    }).catch(function () {});
  }

  function queueRemoteSync() {
    if (remoteSyncTimer) {
      window.clearTimeout(remoteSyncTimer);
    }

    remoteSyncTimer = window.setTimeout(function () {
      remoteSyncTimer = null;
      syncSnapshotToServer(readSnapshot());
    }, 150);
  }

  function hydrateRemoteState() {
    var remoteState = readRemoteStateSync();
    if (remoteState && typeof remoteState === "object" && hasSnapshotData(remoteState)) {
      applySnapshotToLocalStorage(remoteState);
      return;
    }

    var localState = readSnapshot();
    if (hasSnapshotData(localState)) {
      syncSnapshotToServer(localState);
    }
  }

  function getSectionDefinition(pageKey, sectionKey) {
    var pageMatch = PAGE_DEFINITIONS.find(function (pageDef) {
      return pageDef.page === pageKey;
    });

    if (!pageMatch) return null;

    var sectionMatch = pageMatch.sections.find(function (sectionDef) {
      return sectionDef.id === sectionKey;
    });

    if (!sectionMatch) return null;

    return {
      page: pageMatch.page,
      pageLabel: pageMatch.label,
      section: sectionMatch.id,
      sectionLabel: sectionMatch.label
    };
  }

  function buildAdminSectionUrl(pageKey, sectionKey) {
    return "admin-seccion.html?pagina=" + encodeURIComponent(pageKey) + "&seccion=" + encodeURIComponent(sectionKey);
  }

  function renderAdminSectionNav(container, currentPage, currentSection) {
    if (!container) return;

    container.innerHTML = "";

    PAGE_DEFINITIONS.forEach(function (pageDef) {
      var group = document.createElement("div");
      group.className = "admin-sidebar-group";

      var heading = document.createElement("strong");
      heading.className = "admin-sidebar-group-title";
      heading.textContent = pageDef.label;
      group.appendChild(heading);

      var list = document.createElement("div");
      list.className = "admin-sidebar-links";

      pageDef.sections.forEach(function (sectionDef) {
        var link = document.createElement("a");
        var isActive = currentPage === pageDef.page && currentSection === sectionDef.id;
        link.href = buildAdminSectionUrl(pageDef.page, sectionDef.id);
        link.className = "admin-sidebar-link" + (isActive ? " is-active" : "");
        link.textContent = sectionDef.label;
        list.appendChild(link);
      });

      group.appendChild(list);
      container.appendChild(group);
    });
  }

  function applySections(root) {
    var scope = root || document;
    var body = scope.body || document.body;
    if (!body) return;

    var pageKey = body.getAttribute("data-cms-page");
    if (!pageKey) return;

    var elements = body.querySelectorAll("[data-cms-section]");
    Array.prototype.forEach.call(elements, function (element) {
      var sectionKey = element.getAttribute("data-cms-section");
      var enabled = isSectionEnabled(pageKey, sectionKey);
      element.style.display = enabled ? "" : "none";
      element.setAttribute("aria-hidden", enabled ? "false" : "true");
    });
  }

  function applyContentOverrides(root) {
    var scope = root || document;
    var body = scope.body || document.body;
    if (!body) return;

    var pageKey = body.getAttribute("data-cms-page");
    if (!pageKey) return;

    var elements = body.querySelectorAll("[data-cms-section]");
    Array.prototype.forEach.call(elements, function (element) {
      var sectionKey = element.getAttribute("data-cms-section");
      var html = getSectionContent(pageKey, sectionKey);
      if (html) {
        renderSectionHtml(element, html);
      }
    });
  }

  window.EditorialCmsSections = {
    STORAGE_KEY: STORAGE_KEY,
    CONTENT_STORAGE_KEY: CONTENT_STORAGE_KEY,
    PAGE_DEFINITIONS: PAGE_DEFINITIONS,
    buildDefaultConfig: buildDefaultConfig,
    getConfig: getConfig,
    saveConfig: saveConfig,
    setSectionState: setSectionState,
    isSectionEnabled: isSectionEnabled,
    getContentConfig: getContentConfig,
    saveContentConfig: saveContentConfig,
    getSectionContent: getSectionContent,
    setSectionContent: setSectionContent,
    clearSectionContent: clearSectionContent,
    getSectionDefinition: getSectionDefinition,
    buildAdminSectionUrl: buildAdminSectionUrl,
    renderAdminSectionNav: renderAdminSectionNav,
    applySections: applySections,
    applyContentOverrides: applyContentOverrides
  };

  hydrateRemoteState();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applySections(document);
    });
  } else {
    applySections(document);
  }
})();
