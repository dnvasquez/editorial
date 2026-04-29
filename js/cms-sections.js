(function () {
  var STORAGE_KEY = "editorialCmsSections";
  var CONTENT_STORAGE_KEY = "editorialCmsSectionContent";
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
        element.innerHTML = html;
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applySections(document);
    });
  } else {
    applySections(document);
  }
})();
