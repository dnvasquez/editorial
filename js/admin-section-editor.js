(function () {
  var SESSION_KEY = "editorialCmsSession";

  function getActiveSession() {
    var raw = window.sessionStorage.getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function clearSession() {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  }

  function requireSession() {
    if (!document.body.classList.contains("admin-dashboard-body")) return;
    if (!getActiveSession()) {
      window.location.href = "admin-login.html";
    }
  }

  function bindEditor() {
    if (!window.EditorialCmsSections) return;

    var params = new URLSearchParams(window.location.search);
    var firstPage = window.EditorialCmsSections.PAGE_DEFINITIONS[0];
    var firstSection = firstPage.sections[0];
    var pageKey = params.get("pagina") || firstPage.page;
    var sectionKey = params.get("seccion") || firstSection.id;
    var definition = window.EditorialCmsSections.getSectionDefinition(pageKey, sectionKey);

    if (!definition) {
      definition = window.EditorialCmsSections.getSectionDefinition(firstPage.page, firstSection.id);
      pageKey = definition.page;
      sectionKey = definition.section;
    }

    var session = getActiveSession();
    var sessionUser = document.getElementById("admin-session-user");
    var sectionsNav = document.getElementById("admin-sections-nav");
    var title = document.getElementById("admin-section-title");
    var subtitle = document.getElementById("admin-section-subtitle");
    var metaPage = document.getElementById("admin-meta-page");
    var metaSection = document.getElementById("admin-meta-section");
    var metaVisibility = document.getElementById("admin-meta-visibility");
    var visibleInput = document.getElementById("admin-section-visible");
    var htmlInput = document.getElementById("admin-section-html");
    var feedback = document.getElementById("admin-section-feedback");
    var form = document.getElementById("admin-section-form");
    var clearButton = document.getElementById("admin-clear-content");
    var publicLink = document.getElementById("admin-open-public");
    var logoutButton = document.getElementById("admin-logout");

    if (session && sessionUser) {
      sessionUser.textContent = session.username;
    }

    if (sectionsNav) {
      window.EditorialCmsSections.renderAdminSectionNav(sectionsNav, pageKey, sectionKey);
    }

    title.textContent = definition.sectionLabel;
    subtitle.textContent = "Editas la seccion \"" + definition.sectionLabel + "\" dentro de la pagina \"" + definition.pageLabel + "\".";
    metaPage.textContent = definition.pageLabel;
    metaSection.textContent = definition.sectionLabel;
    visibleInput.checked = window.EditorialCmsSections.isSectionEnabled(pageKey, sectionKey);
    htmlInput.value = window.EditorialCmsSections.getSectionContent(pageKey, sectionKey);
    metaVisibility.textContent = visibleInput.checked ? "Visible" : "Oculta";
    document.title = "CMS Admin | " + definition.sectionLabel;

    if (publicLink) {
      var pageFile = definition.page === "index" ? "index.html" : definition.page + ".html";
      publicLink.href = pageFile;
    }

    visibleInput.addEventListener("change", function () {
      metaVisibility.textContent = visibleInput.checked ? "Visible" : "Oculta";
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      window.EditorialCmsSections.setSectionState(pageKey, sectionKey, visibleInput.checked);
      if ((htmlInput.value || "").trim()) {
        window.EditorialCmsSections.setSectionContent(pageKey, sectionKey, htmlInput.value);
      } else {
        window.EditorialCmsSections.clearSectionContent(pageKey, sectionKey);
      }
      metaVisibility.textContent = visibleInput.checked ? "Visible" : "Oculta";
      feedback.textContent = "Seccion guardada. Recarga la vista publica para ver el cambio.";
    });

    clearButton.addEventListener("click", function () {
      htmlInput.value = "";
      window.EditorialCmsSections.clearSectionContent(pageKey, sectionKey);
      feedback.textContent = "Se elimino el HTML de reemplazo. La pagina usara su contenido original.";
    });

    logoutButton.addEventListener("click", function () {
      clearSession();
      window.location.href = "admin-login.html";
    });
  }

  requireSession();
  bindEditor();
})();
