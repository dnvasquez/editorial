(function () {
  var AUTH_BASE = "/.netlify/functions";
  var SESSION_ENDPOINT = AUTH_BASE + "/admin-session";
  var LOGOUT_ENDPOINT = AUTH_BASE + "/admin-logout";

  function getActiveSession() {
    return fetch(SESSION_ENDPOINT, { credentials: "include" })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json().catch(function () {
          return null;
        });
      })
      .then(function (payload) {
        return payload && payload.user ? payload.user : null;
      })
      .catch(function () {
        return null;
      });
  }

  function requireSession() {
    if (!document.body.classList.contains("admin-dashboard-body")) return Promise.resolve(null);
    return getActiveSession().then(function (session) {
      if (!session) {
        window.location.href = "admin-login.html";
      }
      return session;
    });
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
      fetch(LOGOUT_ENDPOINT, { method: "POST", credentials: "include" })
        .finally(function () {
          window.location.href = "admin-login.html";
        });
    });
  }

  requireSession().then(function (session) {
    var sessionUser = document.getElementById("admin-session-user");
    if (session && sessionUser) {
      sessionUser.textContent = session.username;
    }
    bindEditor();
  });
})();
