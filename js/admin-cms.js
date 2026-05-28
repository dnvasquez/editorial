(function () {
  var AUTH_BASE = "/.netlify/functions";
  var LOGIN_ENDPOINT = AUTH_BASE + "/admin-login";
  var SESSION_ENDPOINT = AUTH_BASE + "/admin-session";
  var LOGOUT_ENDPOINT = AUTH_BASE + "/admin-logout";
  var DEV_SESSION_KEY = "editorialCmsDevSession";
  var DEV_USERNAME = "dev-admin";
  var DEV_PASSWORD = "dev-admin123";

  function isLocalDevHost() {
    return window.location.protocol === "file:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1";
  }

  function readDevSession() {
    try {
      var raw = window.sessionStorage.getItem(DEV_SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.exp !== "number" || parsed.exp <= Date.now()) {
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeDevSession(username, remember) {
    try {
      var exp = Date.now() + (remember ? 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);
      window.sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify({
        username: username,
        exp: exp
      }));
    } catch (error) {
      return null;
    }
  }

  function clearDevSession() {
    try {
      window.sessionStorage.removeItem(DEV_SESSION_KEY);
    } catch (error) {
      return null;
    }
  }

  function requireSession() {
    if (!document.body.classList.contains("admin-dashboard-body")) return;
    if (isLocalDevHost() && readDevSession()) return;
    fetch(SESSION_ENDPOINT, { credentials: "include" })
      .then(function (response) {
        if (!response.ok) {
          window.location.href = "admin-login.html";
        }
      })
      .catch(function () {
        window.location.href = "admin-login.html";
      });
  }

  function bindLogin() {
    var form = document.getElementById("admin-login-form");
    if (!form) return;

    var feedback = document.getElementById("admin-login-feedback");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      feedback.textContent = "Validando acceso...";

      if (isLocalDevHost()) {
        var localUsername = form.username.value.trim();
        var localPassword = form.password.value;
        if (localUsername === DEV_USERNAME && localPassword === DEV_PASSWORD) {
          writeDevSession(localUsername, form.remember.checked);
          feedback.textContent = "Acceso local correcto. Redirigiendo al panel...";
          window.setTimeout(function () {
            window.location.href = "admin-columnas.html";
          }, 300);
          return;
        }
      }

      fetch(LOGIN_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: form.username.value.trim(),
          password: form.password.value,
          remember: form.remember.checked
        })
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().catch(function () {
              return {};
            }).then(function (payload) {
              var message = payload && payload.error ? payload.error : "Usuario o clave incorrectos.";
              throw new Error(message);
            });
          }

          return response.json().catch(function () {
            return {};
          });
        })
        .then(function () {
          feedback.textContent = "Acceso correcto. Redirigiendo al panel...";
          window.setTimeout(function () {
            window.location.href = "admin-columnas.html";
          }, 300);
        })
        .catch(function (error) {
          feedback.textContent = error && error.message ? error.message : "No se pudo iniciar sesion. Verifica Netlify o Netlify Dev.";
        });
    });
  }

  function createLink(href, label, active) {
    return '<a href="' + href + '" class="admin-sidebar-link' + (active ? ' is-active' : '') + '">' + label + "</a>";
  }

  function getAdminRoute(view, id) {
    var url = "admin-columnas.html";
    var params = [];
    if (view) {
      params.push("view=" + encodeURIComponent(view));
    }
    if (id) {
      params.push("id=" + encodeURIComponent(id));
    }
    if (params.length) {
      url += "?" + params.join("&");
    }
    return url;
  }

  function routeAdmin(view, id, replaceState) {
    closeAdminModal();
    var url = getAdminRoute(view, id);
    if (window.history && window.history[replaceState ? "replaceState" : "pushState"]) {
      window.history[replaceState ? "replaceState" : "pushState"]({ view: view, id: id }, "", url);
    }
    renderDashboardRoute(view, id);
  }

  function parseAdminRoute() {
    var params = new URLSearchParams(window.location.search);
    return {
      view: params.get("view") || "dashboard",
      id: params.get("id") || ""
    };
  }

  function renderDashboardRoute(view, id) {
    renderSidebar(view, id);

    if (view === "page") {
      renderPageEditor(id || "index");
    } else if (view === "invitados-content") {
      renderGuestsContentEditor();
    } else if (view === "columnistas-content") {
      renderColumnistasContentEditor();
    } else if (view === "about-content") {
      renderAboutContentEditor();
    } else if (view === "contact-content") {
      renderContactContentEditor();
    } else if (view === "programs" || view === "program") {
      renderPrograms(view === "program" ? id : "");
    } else if (view === "episodes" || view === "episode") {
      renderEpisodes(view === "episode" ? id : "");
    } else if (view === "columns" || view === "column") {
      renderColumns(view === "column" ? id : "");
    } else if (view === "publications" || view === "publication") {
      renderPublications(view === "publication" ? id : "");
    } else {
      renderDashboard();
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function findById(items, id) {
    return items.find(function (item) {
      return String(item.id) === String(id);
    }) || null;
  }

  function buildFeaturedTypeOptions(selectedType) {
    var options = [
      { value: "", label: "Sin destacado" },
      { value: "episode", label: "Capitulo de podcast" },
      { value: "column", label: "Columna de opinion" },
      { value: "publication", label: "Publicacion" }
    ];

    return options.map(function (option) {
      return '<option value="' + option.value + '"' + (String(selectedType || "") === option.value ? ' selected' : '') + '>' + option.label + '</option>';
    }).join("");
  }

  function buildColumnAuthorOptions(selectedColumn) {
    var columnistas = window.EditorialCmsSite.getColumnistasForAdmin ? window.EditorialCmsSite.getColumnistasForAdmin() : [];
    var selectedValue = selectedColumn && selectedColumn.autorId ? String(selectedColumn.autorId) : "";
    var selectedName = selectedColumn && selectedColumn.autor ? String(selectedColumn.autor) : "";
    var selectedLookup = selectedValue || window.EditorialCmsSite.slugify(selectedName);
    var options = '<option value=""' + (!selectedLookup ? ' selected' : '') + '>Selecciona un columnista</option>';
    var currentMatches = false;

    columnistas.forEach(function (item) {
      var value = String(item.id || window.EditorialCmsSite.slugify(item.name));
      var label = item.name + (item.role ? " - " + item.role : "");
      if (selectedLookup && String(selectedLookup) === value) {
        currentMatches = true;
      }
      options += '<option value="' + escapeHtml(value) + '"' + (String(selectedLookup) === value ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    });

    if (selectedName && !currentMatches) {
      options += '<option value="' + escapeHtml(selectedLookup || window.EditorialCmsSite.slugify(selectedName)) + '" selected>' + escapeHtml(selectedName) + '</option>';
    }

    return options;
  }

  function buildFeaturedItemOptions(contentType, selectedId) {
    var options = '<option value=""' + (!selectedId ? ' selected' : '') + '>Sin contenido seleccionado</option>';
    var items = [];

    if (contentType === "episode") {
      var programs = window.EditorialCmsSite.getProgramsForAdmin();
      items = window.EditorialCmsSite.getEpisodesForAdmin().map(function (episode) {
        var program = findById(programs, episode.programaId);
        var label = (program ? program.nombre + " - " : "") + "Ep. " + (episode.numero || "-") + ": " + (episode.titulo || "Sin titulo");
        if (episode.visible === false) {
          label += " (oculto)";
        }
        return { id: episode.id, label: label };
      });
    } else if (contentType === "column") {
      items = window.EditorialCmsSite.getColumnsForAdmin().map(function (column) {
        var label = (column.autor || "Autor/a") + " - " + (column.titulo || "Sin titulo");
        if (column.visible === false) {
          label += " (oculta)";
        }
        return { id: column.id, label: label };
      });
    } else if (contentType === "publication") {
      items = window.EditorialCmsSite.getPublicationsForAdmin().map(function (publication) {
        var label = (publication.tipo || "Publicacion") + " - " + (publication.titulo || "Sin titulo");
        if (publication.visible === false) {
          label += " (oculta)";
        }
        return { id: publication.id, label: label };
      });
    }

    items.forEach(function (item) {
      options += '<option value="' + escapeHtml(item.id) + '"' + (String(selectedId || "") === String(item.id) ? ' selected' : '') + '>' + escapeHtml(item.label) + '</option>';
    });

    return options;
  }

  function getFeaturedContentData(contentType, contentId) {
    if (!contentType || !contentId) return null;

    if (contentType === "episode") {
      return findById(window.EditorialCmsSite.getEpisodesForAdmin(), contentId);
    }
    if (contentType === "column") {
      return findById(window.EditorialCmsSite.getColumnsForAdmin(), contentId);
    }
    if (contentType === "publication") {
      return findById(window.EditorialCmsSite.getPublicationsForAdmin(), contentId);
    }

    return null;
  }

  function getFeaturedContentImage(contentType, contentId) {
    var content = getFeaturedContentData(contentType, contentId);
    if (!content) return "";

    if (contentType === "episode") {
      return String(content.imagen || "").trim();
    }

    if (contentType === "column") {
      return String(content.imagen || content.banner || "").trim();
    }

    if (contentType === "publication") {
      return String(content.imagen || "").trim();
    }

    return "";
  }

  function buildPreviewDatum(label, value) {
    return '' +
      '<article class="admin-preview-datum">' +
      '<span class="admin-preview-datum-label">' + escapeHtml(label) + '</span>' +
      '<div class="admin-preview-datum-value">' + escapeHtml(value) + '</div>' +
      '</article>';
  }

  function bindImageUpload(fileInputId, targetInputId, feedbackId, label) {
    var fileInput = document.getElementById(fileInputId);
    var targetInput = document.getElementById(targetInputId);
    var feedback = feedbackId ? document.getElementById(feedbackId) : null;
    if (!fileInput || !targetInput) return;

    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;

      if (file.type && file.type.indexOf("image/") !== 0) {
        if (feedback) {
          feedback.textContent = "El archivo seleccionado no es una imagen valida.";
        }
        fileInput.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        targetInput.value = String(reader.result || "");
        targetInput.dispatchEvent(new Event("input", { bubbles: true }));
        if (feedback) {
          feedback.textContent = (label || "Imagen") + " cargada desde un archivo local.";
        }
      };
      reader.onerror = function () {
        if (feedback) {
          feedback.textContent = "No se pudo leer la imagen seleccionada.";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function buildFeaturedContentPreview(contentType, contentId) {
    var content = getFeaturedContentData(contentType, contentId);

    if (!contentType || !content) {
      return "";
    }

    var title = "";
    var data = [];

    if (contentType === "episode") {
      title = "Capitulo de podcast destacado";
      data = [
        buildPreviewDatum("Titulo", "Episodio " + (content.numero || "-") + ": " + (content.titulo || "Sin titulo")),
        buildPreviewDatum("Autor", content.autor || ""),
        buildPreviewDatum("Fecha de publicacion", content.fecha || ""),
        buildPreviewDatum("Duracion", content.duracion || ""),
        buildPreviewDatum("Enlace de transcripcion", "single-post.html?id=" + content.id)
      ];
    } else if (contentType === "column") {
      title = "Columna destacada";
      data = [
        buildPreviewDatum("Titulo", content.titulo || "Sin titulo"),
        buildPreviewDatum("Autor", content.autor || ""),
        buildPreviewDatum("Fecha de publicacion", content.fecha || ""),
        buildPreviewDatum("Tiempo de lectura", content.lectura || ""),
        buildPreviewDatum("Categoria", content.categoria || ""),
        buildPreviewDatum("Enlace", "columna.html?id=" + content.id)
      ];
    } else if (contentType === "publication") {
      title = "Publicacion destacada";
      data = [
        buildPreviewDatum("Titulo", content.titulo || "Sin titulo"),
        buildPreviewDatum("Tipo", content.tipo || ""),
        buildPreviewDatum("Fecha", content.fecha || ""),
        buildPreviewDatum("Resumen", content.resumen || ""),
        buildPreviewDatum("Enlace", content.enlace || "")
      ];
    }

    return '' +
      '<div class="admin-preview-panel">' +
      '<div class="admin-preview-head"><span class="admin-kicker">Vista previa</span><h3>' + title + '</h3></div>' +
      '<div class="admin-preview-grid">' + data.join("") + '</div>' +
      '</div>';
  }

  function syncFeaturedContentPreview() {
    var typeSelect = document.getElementById("page-featured-type");
    var itemSelect = document.getElementById("page-featured-item");
    var preview = document.getElementById("page-featured-episode-preview");
    if (!typeSelect || !itemSelect || !preview) return;

    itemSelect.innerHTML = buildFeaturedItemOptions(typeSelect.value, itemSelect.value);
    preview.innerHTML = buildFeaturedContentPreview(typeSelect.value, itemSelect.value);
    preview.style.display = typeSelect.value && itemSelect.value ? "" : "none";
  }

  function createLink(href, label, active) {
    return '<a href="' + href + '" class="admin-sidebar-link' + (active ? ' is-active' : '') + '">' + label + "</a>";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function findById(items, id) {
    return items.find(function (item) {
      return String(item.id) === String(id);
    }) || null;
  }

  function buildFeaturedTypeOptions(selectedType) {
    var options = [
      { value: "", label: "Sin destacado" },
      { value: "episode", label: "Capitulo de podcast" },
      { value: "column", label: "Columna de opinion" },
      { value: "publication", label: "Publicacion" }
    ];

    return options.map(function (option) {
      return '<option value="' + option.value + '"' + (String(selectedType || "") === option.value ? ' selected' : '') + '>' + option.label + '</option>';
    }).join("");
  }

  function buildFeaturedItemOptions(contentType, selectedId) {
    var options = '<option value=""' + (!selectedId ? ' selected' : '') + '>Sin contenido seleccionado</option>';
    var items = [];

    if (contentType === "episode") {
      var programs = window.EditorialCmsSite.getProgramsForAdmin();
      items = window.EditorialCmsSite.getEpisodesForAdmin().map(function (episode) {
        var program = findById(programs, episode.programaId);
        var label = (program ? program.nombre + " - " : "") + "Ep. " + (episode.numero || "-") + ": " + (episode.titulo || "Sin titulo");
        if (episode.visible === false) {
          label += " (oculto)";
        }
        return { id: episode.id, label: label };
      });
    } else if (contentType === "column") {
      items = window.EditorialCmsSite.getColumnsForAdmin().map(function (column) {
        var label = (column.autor || "Autor/a") + " - " + (column.titulo || "Sin titulo");
        if (column.visible === false) {
          label += " (oculta)";
        }
        return { id: column.id, label: label };
      });
    } else if (contentType === "publication") {
      items = window.EditorialCmsSite.getPublicationsForAdmin().map(function (publication) {
        var label = (publication.tipo || "Publicacion") + " - " + (publication.titulo || "Sin titulo");
        if (publication.visible === false) {
          label += " (oculta)";
        }
        return { id: publication.id, label: label };
      });
    }

    items.forEach(function (item) {
      options += '<option value="' + escapeHtml(item.id) + '"' + (String(selectedId || "") === String(item.id) ? ' selected' : '') + '>' + escapeHtml(item.label) + '</option>';
    });

    return options;
  }

  function getFeaturedContentData(contentType, contentId) {
    if (!contentType || !contentId) return null;

    if (contentType === "episode") {
      return findById(window.EditorialCmsSite.getEpisodesForAdmin(), contentId);
    }
    if (contentType === "column") {
      return findById(window.EditorialCmsSite.getColumnsForAdmin(), contentId);
    }
    if (contentType === "publication") {
      return findById(window.EditorialCmsSite.getPublicationsForAdmin(), contentId);
    }

    return null;
  }

  function buildPreviewDatum(label, value) {
    return '' +
      '<article class="admin-preview-datum">' +
      '<span class="admin-preview-datum-label">' + escapeHtml(label) + '</span>' +
      '<div class="admin-preview-datum-value">' + escapeHtml(value) + '</div>' +
      '</article>';
  }

  function bindImageUpload(fileInputId, targetInputId, feedbackId, label) {
    var fileInput = document.getElementById(fileInputId);
    var targetInput = document.getElementById(targetInputId);
    var feedback = feedbackId ? document.getElementById(feedbackId) : null;
    if (!fileInput || !targetInput) return;

    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;

      if (file.type && file.type.indexOf("image/") !== 0) {
        if (feedback) {
          feedback.textContent = "El archivo seleccionado no es una imagen valida.";
        }
        fileInput.value = "";
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        targetInput.value = String(reader.result || "");
        targetInput.dispatchEvent(new Event("input", { bubbles: true }));
        if (feedback) {
          feedback.textContent = (label || "Imagen") + " cargada desde un archivo local.";
        }
      };
      reader.onerror = function () {
        if (feedback) {
          feedback.textContent = "No se pudo leer la imagen seleccionada.";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function buildFeaturedContentPreview(contentType, contentId) {
    var content = getFeaturedContentData(contentType, contentId);

    if (!contentType || !content) {
      return "";
    }

    var title = "";
    var data = [];

    if (contentType === "episode") {
      title = "Capitulo de podcast destacado";
      data = [
        buildPreviewDatum("Titulo", "Episodio " + (content.numero || "-") + ": " + (content.titulo || "Sin titulo")),
        buildPreviewDatum("Autor", content.autor || ""),
        buildPreviewDatum("Fecha de publicacion", content.fecha || ""),
        buildPreviewDatum("Duracion", content.duracion || ""),
        buildPreviewDatum("Enlace de transcripcion", "single-post.html?id=" + content.id)
      ];
    } else if (contentType === "column") {
      title = "Columna destacada";
      data = [
        buildPreviewDatum("Titulo", content.titulo || "Sin titulo"),
        buildPreviewDatum("Autor", content.autor || ""),
        buildPreviewDatum("Fecha de publicacion", content.fecha || ""),
        buildPreviewDatum("Tiempo de lectura", content.lectura || ""),
        buildPreviewDatum("Categoria", content.categoria || ""),
        buildPreviewDatum("Enlace", "columna.html?id=" + content.id)
      ];
    } else if (contentType === "publication") {
      title = "Publicacion destacada";
      data = [
        buildPreviewDatum("Titulo", content.titulo || "Sin titulo"),
        buildPreviewDatum("Tipo", content.tipo || ""),
        buildPreviewDatum("Fecha", content.fecha || ""),
        buildPreviewDatum("Resumen", content.resumen || ""),
        buildPreviewDatum("Enlace", content.enlace || "")
      ];
    }

    return '' +
      '<div class="admin-preview-panel">' +
      '<div class="admin-preview-head"><span class="admin-kicker">Vista previa</span><h3>' + title + '</h3></div>' +
      '<div class="admin-preview-grid">' + data.join("") + '</div>' +
      '</div>';
  }

  function syncFeaturedContentPreview() {
    var typeSelect = document.getElementById("page-featured-type");
    var itemSelect = document.getElementById("page-featured-item");
    var preview = document.getElementById("page-featured-episode-preview");
    if (!typeSelect || !itemSelect || !preview) return;

    itemSelect.innerHTML = buildFeaturedItemOptions(typeSelect.value, itemSelect.value);
    preview.innerHTML = buildFeaturedContentPreview(typeSelect.value, itemSelect.value);
    preview.style.display = typeSelect.value && itemSelect.value ? "" : "none";
  }

  function renderSidebar(currentView, currentId) {
    var nav = document.getElementById("admin-cms-nav");
    if (!nav || !window.EditorialCmsSite) return;

    var html = '';

    html += '<div class="admin-sidebar-group">';
    html += '<strong class="admin-sidebar-group-title">Gestion de pagina</strong>';
    html += '<div class="admin-sidebar-links">';
    html += createLink("admin-columnas.html", "Resumen CMS", currentView === "dashboard");
    window.EditorialCmsSite.PAGE_DEFINITIONS.forEach(function (page) {
      html += createLink("admin-columnas.html?view=page&id=" + encodeURIComponent(page.id), page.label, currentView === "page" && currentId === page.id);
    });
    html += '</div></div>';

    html += '<div class="admin-sidebar-group">';
    html += '<strong class="admin-sidebar-group-title">Gestion de contenido</strong>';
    html += '<div class="admin-sidebar-links">';
    html += createLink("admin-columnas.html?view=programs", "Programas", currentView === "programs" || currentView === "program");
    html += createLink("admin-columnas.html?view=episodes", "Episodios", currentView === "episodes" || currentView === "episode");
    html += createLink("admin-columnas.html?view=columns", "Columnas", currentView === "columns" || currentView === "column");
    html += createLink("admin-columnas.html?view=publications", "Publicaciones", currentView === "publications" || currentView === "publication");
    html += createLink("admin-columnas.html?view=invitados-content", "Invitados destacados", currentView === "invitados-content");
    html += createLink("admin-columnas.html?view=about-content", "Nosotros", currentView === "about-content");
    html += '</div></div>';

    nav.innerHTML = html;
  }

  function setHeader(kicker, title, subtitle) {
    document.getElementById("admin-view-kicker").textContent = kicker;
    document.getElementById("admin-view-title").textContent = title;
    document.getElementById("admin-view-subtitle").textContent = subtitle;
  }

  function renderDashboard() {
    setHeader(
      "Resumen CMS",
      "Gestion del sitio completa",
      "Navega por paginas del sitio o por bibliotecas de contenido. Cada modulo permite editar, ocultar o eliminar contenido desde una sola interfaz."
    );

    var programs = window.EditorialCmsSite.getProgramsForAdmin();
    var episodes = window.EditorialCmsSite.getEpisodesForAdmin();
    var columns = window.EditorialCmsSite.getColumnsForAdmin();
    var publications = window.EditorialCmsSite.getPublicationsForAdmin();
    var pageConfigs = window.EditorialCmsSite.getPageConfigs();
    var hiddenPages = Object.keys(pageConfigs).filter(function (key) {
      return pageConfigs[key].visible === false;
    });

    var columnViews = window.EditorialCmsSite.getColumnViews ? window.EditorialCmsSite.getColumnViews() : {};
    var totalColumnViews = 0;
    Object.keys(columnViews).forEach(function (columnId) {
      totalColumnViews += (columnViews[columnId] || 0);
    });

    var visibleColumns = columns.filter(function (c) { return c.visible !== false; });
    var visibleEpisodes = episodes.filter(function (e) { return e.visible !== false; });
    var visiblePublications = publications.filter(function (p) { return p.visible !== false; });

    var recentColumns = visibleColumns.slice(-3).reverse();
    var recentEpisodes = visibleEpisodes.slice(-3).reverse();

    var metricsHtml =
      '<section class="admin-overview-grid">' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Visualizaciones</span><strong>' + totalColumnViews + '</strong><p>Total de vistas en columnas publicadas.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Columnas</span><strong>' + visibleColumns.length + '</strong><p>' + (columns.length - visibleColumns.length) + ' ocultas.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Capítulos</span><strong>' + visibleEpisodes.length + '</strong><p>' + (episodes.length - visibleEpisodes.length) + ' ocultos.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Publicaciones</span><strong>' + visiblePublications.length + '</strong><p>' + (publications.length - visiblePublications.length) + ' ocultas.</p></article>' +
      '</section>';

    var recentColumnsHtml = '<section class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Últimas columnas</span><h3>Contenido reciente</h3></div></div>' +
      '<div class="admin-recent-list">';

    if (recentColumns.length > 0) {
      recentColumns.forEach(function (col) {
        var views = columnViews[col.id] || 0;
        recentColumnsHtml += '<div class="admin-recent-item"><div class="admin-recent-info"><strong>' + escapeHtml(col.autor || 'Anónimo') + '</strong><p>' + escapeHtml(col.titulo || 'Sin título') + '</p></div><div class="admin-recent-metric">' + views + ' vistas</div></div>';
      });
    } else {
      recentColumnsHtml += '<p class="admin-muted">Sin columnas publicadas aún.</p>';
    }
    recentColumnsHtml += '</div></section>';

    var recentEpisodesHtml = '<section class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Últimos capítulos</span><h3>Podcast reciente</h3></div></div>' +
      '<div class="admin-recent-list">';

    if (recentEpisodes.length > 0) {
      recentEpisodes.forEach(function (ep) {
        var program = findById(programs, ep.programaId);
        var programName = program ? program.nombre : 'Programa desconocido';
        recentEpisodesHtml += '<div class="admin-recent-item"><div class="admin-recent-info"><strong>Ep. ' + escapeHtml(ep.numero || '-') + ': ' + escapeHtml(ep.titulo || 'Sin título') + '</strong><p>' + escapeHtml(programName) + '</p></div></div>';
      });
    } else {
      recentEpisodesHtml += '<p class="admin-muted">Sin capítulos publicados aún.</p>';
    }
    recentEpisodesHtml += '</div></section>';

    document.getElementById("admin-main-content").innerHTML = metricsHtml + recentColumnsHtml + recentEpisodesHtml;
  }

  function renderPageEditor(pageId) {
    var page = window.EditorialCmsSite.findPageDefinition(pageId) || window.EditorialCmsSite.PAGE_DEFINITIONS[0];
    var config = window.EditorialCmsSite.getPageConfig(page.id);
    var featuredEpisodeField = "";
    var pageFields = "";

    if (page.id === "index") {
      var selectedType = config.featuredContentType || (config.featuredEpisodeId ? "episode" : "");
      var selectedItemId = config.featuredContentId || config.featuredEpisodeId || "";
      featuredEpisodeField =
        '<div class="admin-field"><label for="page-featured-type">Que quieres destacar</label><select id="page-featured-type" class="form-control">' + buildFeaturedTypeOptions(selectedType) + '</select></div>' +
        '<div class="admin-field"><label for="page-featured-item">Contenido destacado</label><select id="page-featured-item" class="form-control">' + buildFeaturedItemOptions(selectedType, selectedItemId) + '</select></div>' +
        '<div id="page-featured-episode-preview">' + buildFeaturedContentPreview(selectedType, selectedItemId) + '</div>';
      pageFields =
        '<div class="admin-field"><label for="page-hero-image">Imagen de fondo del hero</label><input id="page-hero-image" class="form-control" value="' + escapeHtml(config.heroImage) + '" placeholder="images/hero_bg_1.jpg o URL completa"><small class="text-muted">Esta imagen controla el fondo principal de Inicio.</small></div>';
    } else {
      pageFields =
        '<div class="admin-field"><label for="page-hero-title">Titulo</label><input id="page-hero-title" class="form-control" value="' + escapeHtml(config.heroTitle) + '" placeholder="Opcional"></div>' +
        '<div class="admin-field"><label for="page-hero-subtitle">Subtitulo</label><textarea id="page-hero-subtitle" class="form-control admin-textarea-sm" placeholder="Opcional">' + escapeHtml(config.heroSubtitle) + '</textarea></div>' +
        '<div class="admin-field"><label for="page-hero-image">Imagen</label><input id="page-hero-image" class="form-control" value="' + escapeHtml(config.heroImage) + '" placeholder="images/hero_bg_1.jpg o URL completa"></div>';
    }

    setHeader(
      "Pagina",
      page.label,
      page.id === "columnas"
        ? "Gestiona la visibilidad completa de esta pagina, sus ajustes generales y la seccion Columnistas que aparece debajo."
        : page.id === "contact"
          ? "Gestiona la visibilidad completa de esta pagina, sus ajustes generales y el contenido de formulario y cierre."
          : "Gestiona la visibilidad completa de esta pagina y sus ajustes generales de hero o contenido principal."
    );

    var pageHtml =
      '<section class="admin-card admin-editor-panel admin-editor-single">' +
      '<form id="admin-page-form" class="admin-form-stack" novalidate>' +
      '<label class="admin-section-toggle"><span>Pagina visible en el sitio</span><input id="page-visible" type="checkbox"' + (config.visible !== false ? ' checked' : '') + '></label>' +
      pageFields +
      featuredEpisodeField +
      '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar pagina</button><a href="' + page.file + '" target="_blank" rel="noopener" class="btn btn-outline-dark">Abrir pagina publica</a></div>' +
      '<p id="admin-page-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></section>';

    if (page.id === "columnas") {
      var columnistasState = getColumnistasContentState();
      pageHtml += buildColumnistasContentMarkup(columnistasState.content, columnistasState.items, 0);
    } else if (page.id === "contact") {
      var contactState = getContactContentState();
      pageHtml += buildContactContentMarkup(contactState);
    }

    document.getElementById("admin-main-content").innerHTML = pageHtml;

    document.getElementById("admin-page-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      var feedbackNode = document.getElementById("admin-page-feedback");
      try {
        await window.EditorialCmsSite.savePageConfig(page.id, {
          visible: document.getElementById("page-visible").checked,
          heroTitle: page.id === "index" ? "" : document.getElementById("page-hero-title").value,
          heroSubtitle: page.id === "index" ? "" : document.getElementById("page-hero-subtitle").value,
          heroImage: document.getElementById("page-hero-image").value,
          featuredContentType: page.id === "index" ? document.getElementById("page-featured-type").value : "",
          featuredContentId: page.id === "index" ? document.getElementById("page-featured-item").value : "",
          featuredEpisodeId: page.id === "index" && document.getElementById("page-featured-type").value === "episode"
            ? document.getElementById("page-featured-item").value
            : "",
          manualHeroTitle: "",
          manualHeroMeta: "",
          manualHeroAudio: "",
          manualHeroTranscriptLink: ""
        });
        feedbackNode.textContent = "Pagina guardada y sincronizada. Recarga la vista publica para ver los cambios.";
      } catch (error) {
        feedbackNode.textContent = "Se guardo de forma local, pero no se pudo sincronizar con Netlify. Revisa la sesión o el estado remoto.";
      }
    });

    if (page.id === "columnas") {
      bindColumnistasContentEditor(0, getColumnistasContentState().content);
    } else if (page.id === "contact") {
      bindContactContentEditor(getContactContentState());
    }

    if (page.id === "index") {
      var typeSelect = document.getElementById("page-featured-type");
      var itemSelect = document.getElementById("page-featured-item");
      if (typeSelect && itemSelect) {
        itemSelect.value = selectedItemId;
        typeSelect.addEventListener("change", function () {
          itemSelect.value = "";
          syncFeaturedContentPreview();
        });
        itemSelect.addEventListener("change", syncFeaturedContentPreview);
      }
      syncFeaturedContentPreview();
    }

    hydratePageEditorFromPublicPage(page, config);
  }

  function hydratePageEditorFromPublicPage(page, config) {
    var titleInput = document.getElementById("page-hero-title");
    var subtitleInput = document.getElementById("page-hero-subtitle");
    var imageInput = document.getElementById("page-hero-image");

    var needsHydration = page.id === "index"
      ? !config.heroImage
      : !config.heroTitle || !config.heroSubtitle || !config.heroImage;
    if (!needsHydration) return;

    var iframe = document.createElement("iframe");
    iframe.src = page.file;
    iframe.style.position = "absolute";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.border = "0";

    iframe.addEventListener("load", function () {
      try {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return;

        var hero = doc.querySelector("#cms-page-hero");
        var heroTitle = doc.querySelector("#cms-hero-title") || (hero ? hero.querySelector("h1, h2, h3") : null);
        var heroSubtitle = doc.querySelector("#cms-hero-subtitle") || (hero ? hero.querySelector("p") : null);
        if (titleInput && !titleInput.value && heroTitle) {
          titleInput.value = heroTitle.textContent.trim();
        }

        if (subtitleInput && !subtitleInput.value && heroSubtitle) {
          subtitleInput.value = heroSubtitle.textContent.trim();
        }

        if (!imageInput.value && hero) {
          var bg = hero.style.backgroundImage || (iframe.contentWindow.getComputedStyle(hero).backgroundImage || "");
          if (bg && bg !== "none") {
            imageInput.value = bg.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
          }
        }
      } catch (error) {
        // Si el navegador bloquea la lectura, dejamos los campos tal como estan.
      } finally {
        iframe.remove();
      }
    });

    document.body.appendChild(iframe);
  }

  function getEmptyTeamMember() {
    return {
      name: "",
      role: "",
      image: "",
      bio: "",
      twitter: "",
      instagram: "",
      facebook: "",
      linkedin: ""
    };
  }

  function getEmptyGuest() {
    return {
      name: "",
      role: "",
      bio: "",
      image: ""
    };
  }

  function getEmptyColumnist() {
    return {
      id: "",
      name: "",
      role: "",
      bio: "",
      image: "",
      twitter: "",
      instagram: "",
      facebook: "",
      linkedin: ""
    };
  }

  function readAboutContentDraft(fallbackContent) {
    var form = document.getElementById("admin-about-content-form");
    if (!form) return JSON.parse(JSON.stringify(fallbackContent));

    var draft = JSON.parse(JSON.stringify(fallbackContent));
    draft.teamTitle = document.getElementById("about-team-title").value;
    draft.manifestoImage = document.getElementById("about-manifesto-image").value;
    draft.manifestoLeft = document.getElementById("about-manifesto-left").value;
    draft.manifestoRight = document.getElementById("about-manifesto-right").value;

    var selectedIndex = Number(form.getAttribute("data-selected-member-index") || 0);
    if (draft.teamMembers[selectedIndex]) {
      draft.teamMembers[selectedIndex] = {
        name: document.getElementById("about-member-name").value,
        role: document.getElementById("about-member-role").value,
        image: document.getElementById("about-member-image").value,
        bio: document.getElementById("about-member-bio").value,
        twitter: document.getElementById("about-member-twitter").value,
        instagram: document.getElementById("about-member-instagram").value,
        facebook: document.getElementById("about-member-facebook").value,
        linkedin: document.getElementById("about-member-linkedin").value
      };
    }

    return draft;
  }

  function readGuestsContentDraft(fallbackContent) {
    var form = document.getElementById("admin-guests-content-form");
    if (!form) return JSON.parse(JSON.stringify(fallbackContent));

    var draft = JSON.parse(JSON.stringify(fallbackContent));
    draft.title = document.getElementById("guests-title").value;

    var selectedIndex = Number(form.getAttribute("data-selected-guest-index") || 0);
    if (draft.items[selectedIndex]) {
      draft.items[selectedIndex] = {
        name: document.getElementById("guests-item-name").value,
        role: document.getElementById("guests-item-role").value,
        image: document.getElementById("guests-item-image").value,
        bio: document.getElementById("guests-item-bio").value
      };
    }

    return draft;
  }

  function readColumnistasContentDraft(fallbackContent) {
    var titleInput = document.getElementById("columnistas-title");
    var draft = JSON.parse(JSON.stringify(fallbackContent));

    if (titleInput) {
      draft.title = titleInput.value;
    }

    return draft;
  }

  function getColumnistasContentState(contentOverride) {
    var content = contentOverride || window.EditorialCmsSite.getPageContentSection("columnistas");
    var items = Array.isArray(content.items) ? content.items.slice() : [];

    if (!items.length) {
      items = [getEmptyColumnist()];
    }

    items = items.map(function (item, index) {
      return Object.assign({}, getEmptyColumnist(), item, {
        id: String(item.id || window.EditorialCmsSite.slugify(item.name) || ("columnista-" + (index + 1)))
      });
    });

    return {
      content: content,
      items: items
    };
  }

  function buildColumnistasContentMarkup(content, items, selectedIndex) {
    var activeIndex = Math.max(0, Math.min(typeof selectedIndex === "number" ? selectedIndex : 0, items.length - 1));
    var titleValue = content.title || "Nuestros Columnistas";

    return '' +
      '<div class="admin-library-header admin-columnistas-heading"><div><span class="admin-kicker">Gestión de página</span><h3>Columnistas</h3></div></div>' +
      '<section class="admin-library-layout admin-library-split admin-columnistas-panel">' +
      '<div class="admin-card admin-library-card">' +
      '<form id="admin-columnistas-content-form" class="admin-form-stack" novalidate>' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Contenido</span><h3>Titulo de la seccion</h3></div><button id="columnistas-save-title" type="submit" class="btn btn-primary">Guardar titulo</button></div>' +
      '<div class="admin-field"><label for="columnistas-title">Titulo</label><input id="columnistas-title" class="form-control" value="' + escapeHtml(titleValue) + '"></div>' +
      '<p id="columnistas-content-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></div>' +
      '<div class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Columnistas</span><h3>Fichas</h3></div><button id="columnistas-add-item" type="button" class="btn btn-primary">Agregar columnista</button></div>' +
      '<div class="admin-library-meta"><span>' + items.length + ' columnistas</span><span>Haz clic en una fila para abrir el popup</span></div>' +
      '<div class="admin-table-head admin-column-table-head"><span>Nombre</span><span>Rol</span><span>Redes</span><span></span><span></span></div>' +
      '<div class="admin-column-list" id="columnistas-item-list">' + items.map(function (item, index) {
        var hasLinks = [item.twitter, item.instagram, item.facebook, item.linkedin].some(function (value) {
          return String(value || "").trim();
        }) ? "Con enlaces" : "Sin enlaces";
        return '<button type="button" class="admin-column-row' + (index === activeIndex ? ' is-editing' : '') + '" data-index="' + index + '">' +
          '<div class="admin-column-main"><strong>' + escapeHtml(item.name || ("Columnista " + (index + 1))) + '</strong></div>' +
          '<div class="admin-column-cell">' + escapeHtml(item.role || "Sin especialidad") + '</div>' +
          '<div class="admin-column-cell">' + escapeHtml(hasLinks) + '</div>' +
          '<div class="admin-column-cell">Abrir</div>' +
          '<div class="admin-column-cell"></div>' +
          '</button>';
      }).join("") + '</div>' +
      '</div></section>';
  }

  function bindColumnistasContentEditor(selectedColumnistaIndex, contentOverride) {
    var state = getColumnistasContentState(contentOverride);
    var content = state.content;
    var items = state.items;
    var selectedIndex = Math.max(0, Math.min(typeof selectedColumnistaIndex === "number" ? selectedColumnistaIndex : 0, items.length - 1));
    var form = document.getElementById("admin-columnistas-content-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var feedback = document.getElementById("columnistas-content-feedback");
      var next = readColumnistasContentDraft({
        title: content.title || "Nuestros Columnistas",
        items: items
      });
      var saved = window.EditorialCmsSite.savePageContentSection("columnistas", next);
      if (window.EditorialCmsSite && typeof window.EditorialCmsSite.hydrateGlobals === "function") {
        window.EditorialCmsSite.hydrateGlobals();
      }
      if (feedback) {
        feedback.textContent = "Contenido guardado. Sincronizando en segundo plano...";
      }

      if (saved) {
        window.setTimeout(function () {
          var params = new URLSearchParams(window.location.search);
          if (params.get("view") === "page" && params.get("id") === "columnas") {
            renderPageEditor("columnas");
          } else {
            renderColumnistasContentEditor(selectedIndex, saved);
          }
        }, 0);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll("#columnistas-item-list .admin-column-row"), function (button) {
      button.addEventListener("click", function () {
        var draft = readColumnistasContentDraft({
          title: content.title || "Nuestros Columnistas",
          items: items
        });
        openColumnistasEditorModal(Number(button.getAttribute("data-index")), draft, false);
      });
    });

    var addButton = document.getElementById("columnistas-add-item");
    if (addButton) {
      addButton.addEventListener("click", function () {
        var draft = readColumnistasContentDraft({
          title: content.title || "Nuestros Columnistas",
          items: items
        });
        draft.items.push(getEmptyColumnist());
        openColumnistasEditorModal(draft.items.length - 1, draft, true);
      });
    }
  }

  function readColumnistasModalDraft(modal, base) {
    var source = base || {};
    var titleInput = modal.querySelector("#columnistas-title");
    var items = Array.isArray(source.items) ? source.items.slice() : [];
    var selectedIndex = Number(modal.getAttribute("data-selected-columnista-index") || 0);

    if (!items.length) {
      items = [getEmptyColumnist()];
    }

    if (items[selectedIndex]) {
      var itemId = String(items[selectedIndex].id || "");
      items[selectedIndex] = {
        id: itemId || window.EditorialCmsSite.slugify(modal.querySelector("#columnistas-item-name").value) || ("columnista-" + Date.now()),
        name: modal.querySelector("#columnistas-item-name").value,
        role: modal.querySelector("#columnistas-item-role").value,
        bio: modal.querySelector("#columnistas-item-bio").value,
        image: modal.querySelector("#columnistas-item-image").value,
        twitter: modal.querySelector("#columnistas-item-twitter").value,
        instagram: modal.querySelector("#columnistas-item-instagram").value,
        facebook: modal.querySelector("#columnistas-item-facebook").value,
        linkedin: modal.querySelector("#columnistas-item-linkedin").value
      };
    }

    return {
      title: titleInput ? titleInput.value : source.title,
      items: items
    };
  }

  function openColumnistasEditorModal(selectedIndex, contentOverride, isNewItem) {
    var content = contentOverride || window.EditorialCmsSite.getPageContentSection("columnistas");
    var items = Array.isArray(content.items) ? content.items.slice() : [];
    if (!items.length) {
      items = [getEmptyColumnist()];
    }

    items = items.map(function (item, index) {
      return Object.assign({}, getEmptyColumnist(), item, {
        id: String(item.id || window.EditorialCmsSite.slugify(item.name) || ("columnista-" + (index + 1)))
      });
    });

    var activeIndex = Math.max(0, Math.min(typeof selectedIndex === "number" ? selectedIndex : 0, items.length - 1));
    var selectedItem = items[activeIndex] || getEmptyColumnist();
    var titleValue = content.title || "Nuestros Columnistas";
    var isNew = !!isNewItem;

    var html =
      '<div class="admin-modal-head">' +
      '<div><span class="admin-kicker">Biblioteca</span><h3>' + (isNew ? "Nuevo columnista" : "Editar columnista") + '</h3><p>' + (isNew ? "Completa los datos para agregar una nueva ficha." : "Actualiza la ficha o elimina el miembro de la lista.") + '</p></div>' +
      '</div>' +
      '<form id="columnistas-modal-form" class="admin-form-stack" data-selected-columnista-index="' + activeIndex + '" novalidate>' +
      '<div class="admin-field"><label for="columnistas-title">Titulo de seccion</label><input id="columnistas-title" class="form-control" value="' + escapeHtml(titleValue) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-name">Nombre</label><input id="columnistas-item-name" class="form-control" value="' + escapeHtml(selectedItem.name) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-role">Especialidad / Rol</label><input id="columnistas-item-role" class="form-control" value="' + escapeHtml(selectedItem.role) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-image">Imagen</label><input id="columnistas-item-image" class="form-control" value="' + escapeHtml(selectedItem.image) + '" placeholder="URL de imagen segura"><small class="text-muted">Usa siempre una URL de imagen.</small></div>' +
      '<div class="admin-field"><label for="columnistas-item-bio">Biografia</label><textarea id="columnistas-item-bio" class="form-control admin-textarea-sm">' + escapeHtml(selectedItem.bio) + '</textarea></div>' +
      '<div class="admin-field"><label for="columnistas-item-twitter">Twitter / X</label><input id="columnistas-item-twitter" class="form-control" value="' + escapeHtml(selectedItem.twitter) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-instagram">Instagram</label><input id="columnistas-item-instagram" class="form-control" value="' + escapeHtml(selectedItem.instagram) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-facebook">Facebook</label><input id="columnistas-item-facebook" class="form-control" value="' + escapeHtml(selectedItem.facebook) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-linkedin">LinkedIn</label><input id="columnistas-item-linkedin" class="form-control" value="' + escapeHtml(selectedItem.linkedin) + '"></div>' +
      '<div class="admin-actions admin-modal-actions">' +
      '<button type="button" class="btn btn-outline-dark" data-admin-modal-close>Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">Guardar columnista</button>' +
      (isNew ? "" : '<button id="columnistas-delete-item" type="button" class="btn btn-outline-dark">Eliminar</button>') +
      '</div>' +
      '<p id="columnistas-modal-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form>';

    var modal = openAdminModal(html, "admin-modal-columnistas", isNew ? "Nuevo columnista" : "Editar columnista");
    if (!modal) return;

    var form = modal.querySelector("#columnistas-modal-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var feedback = modal.querySelector("#columnistas-modal-feedback");
      var next = readColumnistasModalDraft(modal, {
        title: titleValue,
        items: items
      });
      var saved = window.EditorialCmsSite.savePageContentSection("columnistas", next);
      if (window.EditorialCmsSite && typeof window.EditorialCmsSite.hydrateGlobals === "function") {
        window.EditorialCmsSite.hydrateGlobals();
      }
      if (feedback) {
        feedback.textContent = isNew ? "Columnista creado. Actualizando la tabla..." : "Columnista actualizado. Actualizando la tabla...";
      }
      closeAdminModal();
      renderColumnistasContentEditor(next.items.length ? activeIndex : 0, saved);
    });

    var deleteButton = modal.querySelector("#columnistas-delete-item");
    if (deleteButton) {
      deleteButton.addEventListener("click", function () {
        if (!window.confirm("Se eliminara este columnista del sitio. Continuar?")) return;
        var next = readColumnistasModalDraft(modal, {
          title: titleValue,
          items: items
        });
        next.items.splice(activeIndex, 1);
        if (!next.items.length) {
          next.items.push(getEmptyColumnist());
        }
        var saved = window.EditorialCmsSite.savePageContentSection("columnistas", next);
        if (window.EditorialCmsSite && typeof window.EditorialCmsSite.hydrateGlobals === "function") {
          window.EditorialCmsSite.hydrateGlobals();
        }
        closeAdminModal();
        renderColumnistasContentEditor(Math.max(0, activeIndex - 1), saved);
      });
    }
  }

  function renderAboutContentEditor(selectedMemberIndex, contentOverride) {
    var content = contentOverride || window.EditorialCmsSite.getPageContentSection("about");
    var teamMembers = Array.isArray(content.teamMembers) ? content.teamMembers.slice() : [];
    if (!teamMembers.length) {
      teamMembers = [getEmptyTeamMember()];
    }
    var selectedIndex = Math.max(0, Math.min(typeof selectedMemberIndex === "number" ? selectedMemberIndex : 0, teamMembers.length - 1));
    var selectedMember = teamMembers[selectedIndex] || getEmptyTeamMember();

    setHeader(
      "Contenido",
      "Nosotros",
      "Edita el equipo editorial y el manifiesto. El bloque El Equipo de Inicio usa esta misma información."
    );

    document.getElementById("admin-main-content").innerHTML =
      '<section class="admin-card admin-editor-panel admin-editor-single">' +
      '<form id="admin-about-content-form" class="admin-form-stack" data-selected-member-index="' + selectedIndex + '" novalidate>' +
      '<div class="admin-field"><label for="about-team-title">Título del equipo</label><input id="about-team-title" class="form-control" value="' + escapeHtml(content.teamTitle) + '"></div>' +
      '<section class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Equipo</span><h3>Miembros</h3></div><button id="about-add-member" type="button" class="btn btn-primary">Agregar miembro</button></div>' +
      '<div class="admin-entity-list" id="about-member-list">' + teamMembers.map(function (member, index) {
        return '<button type="button" class="admin-entity-row' + (index === selectedIndex ? ' is-active' : '') + '" data-index="' + index + '">' +
          '<strong>' + escapeHtml(member.name || ("Miembro " + (index + 1))) + '</strong>' +
          '<span>' + escapeHtml(member.role || "Sin rol") + '</span></button>';
      }).join("") + '</div>' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Editor</span><h3>Ficha del miembro</h3></div>' + (teamMembers.length > 1 ? '<button id="about-remove-member" type="button" class="btn btn-outline-dark">Quitar miembro</button>' : '') + '</div>' +
      '<div class="admin-form-stack">' +
      '<div class="admin-field"><label for="about-member-name">Nombre</label><input id="about-member-name" class="form-control" value="' + escapeHtml(selectedMember.name) + '"></div>' +
      '<div class="admin-field"><label for="about-member-role">Rol</label><input id="about-member-role" class="form-control" value="' + escapeHtml(selectedMember.role) + '"></div>' +
      '<div class="admin-field"><label for="about-member-image">Imagen</label><input id="about-member-image" class="form-control" value="' + escapeHtml(selectedMember.image) + '"></div>' +
      '<div class="admin-field"><label for="about-member-bio">Biografía</label><textarea id="about-member-bio" class="form-control admin-textarea-sm">' + escapeHtml(selectedMember.bio) + '</textarea></div>' +
      '<div class="admin-field"><label for="about-member-twitter">Twitter/X</label><input id="about-member-twitter" class="form-control" value="' + escapeHtml(selectedMember.twitter) + '"></div>' +
      '<div class="admin-field"><label for="about-member-instagram">Instagram</label><input id="about-member-instagram" class="form-control" value="' + escapeHtml(selectedMember.instagram) + '"></div>' +
      '<div class="admin-field"><label for="about-member-facebook">Facebook</label><input id="about-member-facebook" class="form-control" value="' + escapeHtml(selectedMember.facebook) + '"></div>' +
      '<div class="admin-field"><label for="about-member-linkedin">LinkedIn</label><input id="about-member-linkedin" class="form-control" value="' + escapeHtml(selectedMember.linkedin) + '"></div>' +
      '</div></section>' +
      '<section class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Manifiesto</span><h3>Bloque editorial</h3></div></div>' +
      '<div class="admin-form-stack">' +
      '<div class="admin-field"><label for="about-manifesto-image">Imagen</label><input id="about-manifesto-image" class="form-control" value="' + escapeHtml(content.manifestoImage) + '"></div>' +
      '<div class="admin-field"><label for="about-manifesto-left">Columna izquierda</label><textarea id="about-manifesto-left" class="form-control admin-code-textarea">' + escapeHtml(content.manifestoLeft) + '</textarea></div>' +
      '<div class="admin-field"><label for="about-manifesto-right">Columna derecha</label><textarea id="about-manifesto-right" class="form-control admin-code-textarea">' + escapeHtml(content.manifestoRight) + '</textarea></div>' +
      '</div></section>' +
      '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar contenido</button><a href="about.html" target="_blank" rel="noopener" class="btn btn-outline-dark">Abrir página pública</a></div>' +
      '<p id="about-content-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></section>';

    document.getElementById("admin-about-content-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var next = readAboutContentDraft({
        teamTitle: content.teamTitle,
        teamMembers: teamMembers,
        manifestoImage: content.manifestoImage,
        manifestoLeft: content.manifestoLeft,
        manifestoRight: content.manifestoRight
      });
      window.EditorialCmsSite.savePageContentSection("about", next);
      document.getElementById("about-content-feedback").textContent = "Contenido guardado. About e Inicio reflejarán estos cambios.";
    });

    Array.prototype.forEach.call(document.querySelectorAll("#about-member-list .admin-entity-row"), function (button) {
      button.addEventListener("click", function () {
        var draft = readAboutContentDraft({
          teamTitle: content.teamTitle,
          teamMembers: teamMembers,
          manifestoImage: content.manifestoImage,
          manifestoLeft: content.manifestoLeft,
          manifestoRight: content.manifestoRight
        });
        renderAboutContentEditor(Number(button.getAttribute("data-index")), draft);
      });
    });

    var addButton = document.getElementById("about-add-member");
    if (addButton) {
      addButton.addEventListener("click", function () {
        var draft = readAboutContentDraft({
          teamTitle: content.teamTitle,
          teamMembers: teamMembers,
          manifestoImage: content.manifestoImage,
          manifestoLeft: content.manifestoLeft,
          manifestoRight: content.manifestoRight
        });
        draft.teamMembers.push(getEmptyTeamMember());
        renderAboutContentEditor(draft.teamMembers.length - 1, draft);
      });
    }

    var removeButton = document.getElementById("about-remove-member");
    if (removeButton) {
      removeButton.addEventListener("click", function () {
        var draft = readAboutContentDraft({
          teamTitle: content.teamTitle,
          teamMembers: teamMembers,
          manifestoImage: content.manifestoImage,
          manifestoLeft: content.manifestoLeft,
          manifestoRight: content.manifestoRight
        });
        draft.teamMembers.splice(selectedIndex, 1);
        renderAboutContentEditor(Math.max(0, selectedIndex - 1), draft);
      });
    }
  }

  function renderGuestsContentEditor(selectedGuestIndex, contentOverride) {
    var content = contentOverride || window.EditorialCmsSite.getPageContentSection("invitados");
    var items = Array.isArray(content.items) ? content.items.slice() : [];
    if (!items.length) {
      items = [getEmptyGuest()];
    }

    var selectedIndex = Math.max(0, Math.min(typeof selectedGuestIndex === "number" ? selectedGuestIndex : 0, items.length - 1));
    var selectedGuest = items[selectedIndex] || getEmptyGuest();

    setHeader(
      "Contenido",
      "Invitados destacados",
      "Edita el carrusel de invitados visibles en la portada. Cada tarjeta puede llevar imagen, cargo y descripción."
    );

    document.getElementById("admin-main-content").innerHTML =
      '<section class="admin-card admin-editor-panel admin-editor-single">' +
      '<form id="admin-guests-content-form" class="admin-form-stack" data-selected-guest-index="' + selectedIndex + '" novalidate>' +
      '<div class="admin-field"><label for="guests-title">Título de sección</label><input id="guests-title" class="form-control" value="' + escapeHtml(content.title) + '"></div>' +
      '<section class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Invitados</span><h3>Tarjetas</h3></div><button id="guests-add-item" type="button" class="btn btn-primary">Agregar invitado</button></div>' +
      '<div class="admin-entity-list" id="guests-item-list">' + items.map(function (item, index) {
        return '<button type="button" class="admin-entity-row' + (index === selectedIndex ? ' is-active' : '') + '" data-index="' + index + '">' +
          '<strong>' + escapeHtml(item.name || ("Invitado " + (index + 1))) + '</strong>' +
          '<span>' + escapeHtml(item.role || "Sin cargo") + '</span></button>';
      }).join("") + '</div>' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Editor</span><h3>Ficha del invitado</h3></div>' + (items.length > 1 ? '<button id="guests-remove-item" type="button" class="btn btn-outline-dark">Quitar invitado</button>' : '') + '</div>' +
      '<div class="admin-form-stack">' +
      '<div class="admin-field"><label for="guests-item-name">Nombre</label><input id="guests-item-name" class="form-control" value="' + escapeHtml(selectedGuest.name) + '"></div>' +
      '<div class="admin-field"><label for="guests-item-role">Cargo</label><input id="guests-item-role" class="form-control" value="' + escapeHtml(selectedGuest.role) + '"></div>' +
      '<div class="admin-field"><label for="guests-item-image">Imagen</label><input id="guests-item-image" class="form-control" value="' + escapeHtml(selectedGuest.image) + '" placeholder="URL de imagen segura"><small class="text-muted">Usa siempre una URL de imagen.</small></div>' +
      '<div class="admin-field"><label for="guests-item-bio">Descripción</label><textarea id="guests-item-bio" class="form-control admin-textarea-sm">' + escapeHtml(selectedGuest.bio) + '</textarea></div>' +
      '</div></section>' +
      '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar contenido</button><a href="index.html" target="_blank" rel="noopener" class="btn btn-outline-dark">Abrir página pública</a></div>' +
      '<p id="guests-content-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></section>';

    document.getElementById("admin-guests-content-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var next = readGuestsContentDraft({
        title: content.title,
        items: items
      });
      window.EditorialCmsSite.savePageContentSection("invitados", next);
      document.getElementById("guests-content-feedback").textContent = "Contenido guardado. La portada reflejará estos cambios.";
    });

    Array.prototype.forEach.call(document.querySelectorAll("#guests-item-list .admin-entity-row"), function (button) {
      button.addEventListener("click", function () {
        var draft = readGuestsContentDraft({
          title: content.title,
          items: items
        });
        renderGuestsContentEditor(Number(button.getAttribute("data-index")), draft);
      });
    });

    var addButton = document.getElementById("guests-add-item");
    if (addButton) {
      addButton.addEventListener("click", function () {
        var draft = readGuestsContentDraft({
          title: content.title,
          items: items
        });
        draft.items.push(getEmptyGuest());
        renderGuestsContentEditor(draft.items.length - 1, draft);
      });
    }

    var removeButton = document.getElementById("guests-remove-item");
    if (removeButton) {
      removeButton.addEventListener("click", function () {
        var draft = readGuestsContentDraft({
          title: content.title,
          items: items
        });
        draft.items.splice(selectedIndex, 1);
        renderGuestsContentEditor(Math.max(0, selectedIndex - 1), draft);
      });
    }
  }

  function renderColumnistasContentEditor(selectedColumnistaIndex, contentOverride) {
    var state = getColumnistasContentState(contentOverride);
    var content = state.content;
    var items = state.items;
    var selectedIndex = Math.max(0, Math.min(typeof selectedColumnistaIndex === "number" ? selectedColumnistaIndex : 0, items.length - 1));

    setHeader(
      "Contenido",
      "Nuestros columnistas",
      "Edita las fichas visibles en la secciÃ³n Columnistas de la pÃ¡gina Columnas. Esta lista alimenta tambiÃ©n el selector de autor en nuevas columnas."
    );

    document.getElementById("admin-main-content").innerHTML = buildColumnistasContentMarkup(content, items, selectedIndex);
    bindColumnistasContentEditor(selectedIndex, content);
  }

  function getContactContentState(contentOverride) {
    return contentOverride || window.EditorialCmsSite.getPageContentSection("contact");
  }

  function buildContactContentMarkup(content) {
    return '' +
      '<section class="admin-library-layout admin-library-split admin-contact-panel">' +
      '<div class="admin-card admin-library-card">' +
      '<form id="admin-contact-content-form" class="admin-form-stack" novalidate>' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Contenido</span><h3>Contacto</h3></div></div>' +
      '<div class="admin-contact-sections-grid">' +
      '<section class="admin-card admin-library-card admin-contact-section"><div class="admin-library-header"><div><span class="admin-kicker">Formulario</span><h3>Etiquetas</h3></div></div><div class="admin-form-stack">' +
      '<div class="admin-field"><label for="contact-first-name-label-input">Nombre</label><input id="contact-first-name-label-input" class="form-control" value="' + escapeHtml(content.firstNameLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-last-name-label-input">Apellido</label><input id="contact-last-name-label-input" class="form-control" value="' + escapeHtml(content.lastNameLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-email-label-input">Correo</label><input id="contact-email-label-input" class="form-control" value="' + escapeHtml(content.emailLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-subject-label-input">Asunto</label><input id="contact-subject-label-input" class="form-control" value="' + escapeHtml(content.subjectLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-message-label-input">Mensaje</label><input id="contact-message-label-input" class="form-control" value="' + escapeHtml(content.messageLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-send-label-input">Botón enviar</label><input id="contact-send-label-input" class="form-control" value="' + escapeHtml(content.sendLabel) + '"></div>' +
      '</div></section>' +
      '<section class="admin-card admin-library-card admin-contact-section"><div class="admin-library-header"><div><span class="admin-kicker">Datos</span><h3>Información de contacto</h3></div></div><div class="admin-form-stack">' +
      '<div class="admin-field"><label for="contact-address-label-input">Etiqueta dirección</label><input id="contact-address-label-input" class="form-control" value="' + escapeHtml(content.addressLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-address-input">Dirección</label><input id="contact-address-input" class="form-control" value="' + escapeHtml(content.address) + '"></div>' +
      '<div class="admin-field"><label for="contact-phone-label-input">Etiqueta teléfono</label><input id="contact-phone-label-input" class="form-control" value="' + escapeHtml(content.phoneLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-phone-input">Teléfono</label><input id="contact-phone-input" class="form-control" value="' + escapeHtml(content.phone) + '"></div>' +
      '<div class="admin-field"><label for="contact-email-info-label-input">Etiqueta correo</label><input id="contact-email-info-label-input" class="form-control" value="' + escapeHtml(content.emailInfoLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-email-info-input">Correo</label><input id="contact-email-info-input" class="form-control" value="' + escapeHtml(content.emailInfo) + '"></div>' +
      '</div></section>' +
      '<section class="admin-card admin-library-card admin-contact-section admin-contact-section--full"><div class="admin-library-header"><div><span class="admin-kicker">Cierre</span><h3>Bloque final</h3></div></div><div class="admin-form-stack">' +
      '<div class="admin-field"><label for="contact-subscribe-title-input">Título</label><input id="contact-subscribe-title-input" class="form-control" value="' + escapeHtml(content.subscribeTitle) + '"></div>' +
      '<div class="admin-field"><label for="contact-subscribe-text-input">Texto</label><textarea id="contact-subscribe-text-input" class="form-control admin-textarea-sm">' + escapeHtml(content.subscribeText) + '</textarea></div>' +
      '<div class="admin-field"><label for="contact-subscribe-placeholder-input">Placeholder email</label><input id="contact-subscribe-placeholder-input" class="form-control" value="' + escapeHtml(content.subscribePlaceholder) + '"></div>' +
      '<div class="admin-field"><label for="contact-subscribe-button-input">Botón</label><input id="contact-subscribe-button-input" class="form-control" value="' + escapeHtml(content.subscribeButton) + '"></div>' +
      '<div class="admin-field"><label for="contact-subscribe-image-input">Imagen de fondo</label><input id="contact-subscribe-image-input" class="form-control" value="' + escapeHtml(content.subscribeImage) + '"></div>' +
      '</div></section>' +
      '</div>' +
      '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar contenido</button><a href="contact.html" target="_blank" rel="noopener" class="btn btn-outline-dark">Abrir página pública</a></div>' +
      '<p id="contact-content-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></section>';
  }

  function bindContactContentEditor(contentOverride) {
    var content = getContactContentState(contentOverride);
    var form = document.getElementById("admin-contact-content-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      window.EditorialCmsSite.savePageContentSection("contact", {
        firstNameLabel: document.getElementById("contact-first-name-label-input").value,
        lastNameLabel: document.getElementById("contact-last-name-label-input").value,
        emailLabel: document.getElementById("contact-email-label-input").value,
        subjectLabel: document.getElementById("contact-subject-label-input").value,
        messageLabel: document.getElementById("contact-message-label-input").value,
        sendLabel: document.getElementById("contact-send-label-input").value,
        addressLabel: document.getElementById("contact-address-label-input").value,
        address: document.getElementById("contact-address-input").value,
        phoneLabel: document.getElementById("contact-phone-label-input").value,
        phone: document.getElementById("contact-phone-input").value,
        emailInfoLabel: document.getElementById("contact-email-info-label-input").value,
        emailInfo: document.getElementById("contact-email-info-input").value,
        subscribeTitle: document.getElementById("contact-subscribe-title-input").value,
        subscribeText: document.getElementById("contact-subscribe-text-input").value,
        subscribePlaceholder: document.getElementById("contact-subscribe-placeholder-input").value,
        subscribeButton: document.getElementById("contact-subscribe-button-input").value,
        subscribeImage: document.getElementById("contact-subscribe-image-input").value
      });

      var feedback = document.getElementById("contact-content-feedback");
      if (feedback) {
        feedback.textContent = "Contenido guardado. La página Contacto reflejará estos cambios.";
      }

      window.setTimeout(function () {
        var params = new URLSearchParams(window.location.search);
        if (params.get("view") === "page" && params.get("id") === "contact") {
          renderPageEditor("contact");
        } else {
          renderContactContentEditor();
        }
      }, 0);
    });
  }

  function renderContactContentEditor() {
    setHeader(
      "Contenido",
      "Contacto",
      "Edita el formulario, la informaciÃ³n de contacto y el bloque final de suscripciÃ³n."
    );
    var content = getContactContentState();
    document.getElementById("admin-main-content").innerHTML = buildContactContentMarkup(content);
    bindContactContentEditor(content);
  }

  function renderEntityEditor(options) {
    setHeader(options.kicker, options.title, options.subtitle);
    document.getElementById("admin-main-content").innerHTML = options.html;
    options.bind();
  }

  function closeAdminModal() {
    var existing = document.getElementById("admin-modal-overlay");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    document.body.classList.remove("admin-modal-open");
  }

  function openAdminModal(html, className, label) {
    closeAdminModal();

    var overlay = document.createElement("div");
    overlay.id = "admin-modal-overlay";
    overlay.className = "admin-modal-overlay";
    overlay.innerHTML =
      '<div class="admin-modal ' + (className || "") + '" role="dialog" aria-modal="true" aria-label="' + escapeHtml(label || "Dialogo") + '">' +
      '<button type="button" class="admin-modal-close" data-admin-modal-close aria-label="Cerrar">×</button>' +
      html +
      '</div>';

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay || event.target.closest("[data-admin-modal-close]")) {
        event.preventDefault();
        closeAdminModal();
      }
    });

    document.body.appendChild(overlay);
    document.body.classList.add("admin-modal-open");

    var focusTarget = overlay.querySelector("input, select, textarea, button");
    if (focusTarget && typeof focusTarget.focus === "function") {
      window.setTimeout(function () {
        focusTarget.focus();
      }, 0);
    }

    return overlay;
  }

  function buildColumnFields(prefix, selected) {
    var safe = selected || {};
    var id = prefix || "column";
    var titleLimit = 120;
    var summaryLimit = 280;
    var bodyLimit = 8000;
    var authorOptions = buildColumnAuthorOptions({
      autorId: safe.autorId || "",
      autor: safe.autor || ""
    });
    var contentHtml = safe.contenidoHtml
      ? sanitizeColumnEditorHtml(safe.contenidoHtml)
      : (window.EditorialCmsSite && typeof window.EditorialCmsSite.columnContentToHtml === "function"
        ? window.EditorialCmsSite.columnContentToHtml(safe.contenido || "")
        : sanitizeColumnEditorHtml(safe.contenido || ""));

    return '' +
      '<div class="admin-form-grid">' +
      '<label class="admin-section-toggle admin-field-full"><span>Visible en el sitio</span><input id="' + id + '-visible" type="checkbox"' + (safe.visible !== false ? ' checked' : '') + '></label>' +
      '<div class="admin-field"><label for="' + id + '-title">Título</label><input id="' + id + '-title" class="form-control" value="' + escapeHtml(safe.titulo || "") + '" required maxlength="' + titleLimit + '" data-char-limit="' + titleLimit + '"><small id="' + id + '-title-count" class="admin-char-count" data-char-counter="' + id + '-title" data-char-limit="' + titleLimit + '">0 / ' + titleLimit + ' caracteres</small></div>' +
      '<div class="admin-field"><label for="' + id + '-author">Autor</label><select id="' + id + '-author" class="form-control">' + authorOptions + '</select></div>' +
      '<div class="admin-field"><label for="' + id + '-date">Fecha</label><input id="' + id + '-date" class="form-control" value="' + escapeHtml(safe.fecha || "") + '" placeholder="2026-04-01"></div>' +
      '<div class="admin-field"><label for="' + id + '-category">Categoría</label><select id="' + id + '-category" class="form-control"><option value="Analisis"' + ((safe.categoria || "Opinion") === "Analisis" ? ' selected' : '') + '>Análisis</option><option value="Opinion"' + ((safe.categoria || "Opinion") === "Opinion" ? ' selected' : '') + '>Opinión</option><option value="Entrevista"' + (safe.categoria === "Entrevista" ? ' selected' : '') + '>Entrevista</option><option value="Territorio"' + (safe.categoria === "Territorio" ? ' selected' : '') + '>Territorio</option><option value="Politica publica"' + (safe.categoria === "Politica publica" ? ' selected' : '') + '>Política pública</option></select></div>' +
      '<div class="admin-field"><label for="' + id + '-status">Estado</label><select id="' + id + '-status" class="form-control"><option value="borrador"' + ((safe.estado || "borrador") === "borrador" ? ' selected' : '') + '>Borrador</option><option value="publicada"' + (safe.estado === "publicada" ? ' selected' : '') + '>Publicada</option></select></div>' +
      '<div class="admin-field"><label for="' + id + '-image">Imagen</label><input id="' + id + '-image" class="form-control" value="' + escapeHtml(safe.imagen || safe.banner || "") + '" placeholder="URL de imagen segura"><small class="text-muted">Se usa como portada y banner de la columna.</small></div>' +
      '<div class="admin-field admin-field-full"><label for="' + id + '-summary">Resumen</label><textarea id="' + id + '-summary" class="form-control admin-textarea-sm" maxlength="' + summaryLimit + '" data-char-limit="' + summaryLimit + '">' + escapeHtml(safe.resumen || "") + '</textarea><small id="' + id + '-summary-count" class="admin-char-count" data-char-counter="' + id + '-summary" data-char-limit="' + summaryLimit + '">0 / ' + summaryLimit + ' caracteres</small></div>' +
      '<div class="admin-field admin-field-full"><label for="' + id + '-hashtags">Hashtags</label><textarea id="' + id + '-hashtags" class="form-control admin-textarea-sm" placeholder="#clima, #agua, #territorio">' + escapeHtml(Array.isArray(safe.hashtags) ? safe.hashtags.join(", ") : String(safe.hashtags || "")) + '</textarea><small class="text-muted">Separados por comas o saltos de línea.</small></div>' +
      '<div class="admin-field admin-field-full">' +
      '<label for="' + id + '-content">Contenido</label>' +
      '<div class="admin-rich-editor" data-rich-editor data-rich-prefix="' + id + '">' +
      '<div class="admin-rich-toolbar" data-rich-toolbar>' +
      '<div class="admin-rich-format-group" role="group" aria-label="Estilos">' +
      '<button type="button" class="admin-rich-button admin-rich-format-button" data-rich-format-button="p" aria-pressed="true">Párrafo</button>' +
      '<button type="button" class="admin-rich-button admin-rich-format-button" data-rich-format-button="h2" aria-pressed="false">Título</button>' +
      '<button type="button" class="admin-rich-button admin-rich-format-button" data-rich-format-button="h3" aria-pressed="false">Subtítulo</button>' +
      '<button type="button" class="admin-rich-button admin-rich-format-button" data-rich-format-button="blockquote" aria-pressed="false">Cita</button>' +
      '</div>' +
      '<button type="button" class="admin-rich-button" data-rich-command="bold" aria-label="Negrita"><strong>B</strong></button>' +
      '<button type="button" class="admin-rich-button" data-rich-command="italic" aria-label="Cursiva"><em>I</em></button>' +
      '<button type="button" class="admin-rich-button" data-rich-command="underline" aria-label="Subrayado"><u>U</u></button>' +
      '<button type="button" class="admin-rich-button" data-rich-command="insertUnorderedList" aria-label="Lista con viñetas">• Lista</button>' +
      '<button type="button" class="admin-rich-button" data-rich-command="insertOrderedList" aria-label="Lista numerada">1. Lista</button>' +
      '<button type="button" class="admin-rich-button" data-rich-action="link" aria-label="Insertar enlace">Enlace</button>' +
      '<button type="button" class="admin-rich-button" data-rich-action="image" aria-label="Insertar imagen por url">Imagen</button>' +
      '<button type="button" class="admin-rich-button" data-rich-action="video" aria-label="Insertar video por url">Video</button>' +
      '<button type="button" class="admin-rich-button" data-rich-action="iframe" aria-label="Insertar iframe por url">Iframe</button>' +
      '</div>' +
      '<div id="' + id + '-content" class="admin-rich-editor-area" contenteditable="true" spellcheck="true" aria-multiline="true" data-char-limit="' + bodyLimit + '" data-initial-html="' + escapeHtml(contentHtml) + '"></div>' +
      '<small id="' + id + '-content-count" class="admin-char-count" data-char-counter="' + id + '-content" data-char-limit="' + bodyLimit + '">0 / ' + bodyLimit + ' caracteres</small>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function sanitizeColumnEditorHtml(html) {
    if (window.EditorialCmsSite && typeof window.EditorialCmsSite.sanitizeColumnContentHtml === "function") {
      return window.EditorialCmsSite.sanitizeColumnContentHtml(html || "");
    }
    return String(html || "");
  }

  function getEditorSelectionRange(editor) {
    var selection = window.getSelection && window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    var range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;
    return range.cloneRange();
  }

  function restoreEditorSelection(range) {
    if (!range || !window.getSelection) return;
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function promptForSafeUrl(message, fallback) {
    var raw = window.prompt(message, fallback || "");
    if (raw === null) return "";
    return String(raw || "").trim();
  }

  function sanitizeEditorImageUrl(value) {
    if (window.EditorialCmsSite && typeof window.EditorialCmsSite.sanitizeImageUrl === "function") {
      var safeImageUrl = window.EditorialCmsSite.sanitizeImageUrl(value, "");
      if (/^(data:|blob:)/i.test(String(safeImageUrl || ""))) return "";
      return safeImageUrl;
    }
    return String(value || "").trim();
  }

  function sanitizeEditorLinkUrl(value) {
    if (window.EditorialCmsSite && typeof window.EditorialCmsSite.sanitizeLinkUrl === "function") {
      return window.EditorialCmsSite.sanitizeLinkUrl(value);
    }
    return String(value || "").trim();
  }

  function sanitizeEditorMediaUrl(value) {
    if (window.EditorialCmsSite && typeof window.EditorialCmsSite.sanitizeMediaUrl === "function") {
      var safeMediaUrl = window.EditorialCmsSite.sanitizeMediaUrl(value, "");
      if (/^(data:|blob:)/i.test(String(safeMediaUrl || ""))) return "";
      return safeMediaUrl;
    }
    return String(value || "").trim();
  }

  function sanitizeEditorIframeUrl(value) {
    if (window.EditorialCmsSite && typeof window.EditorialCmsSite.sanitizeIframeUrl === "function") {
      return window.EditorialCmsSite.sanitizeIframeUrl(value, "");
    }
    return String(value || "").trim();
  }

  function getFieldCounterTarget(modal, prefix, name) {
    return modal.querySelector("#" + prefix + "-" + name + "-count");
  }

  function getPlainTextLength(value) {
    return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim().length;
  }

  function getRichEditorLength(editor) {
    if (!editor) return 0;
    var text = editor.innerText || editor.textContent || "";
    return getPlainTextLength(text);
  }

  function updateCharCounter(node, current, limit) {
    if (!node) return;
    node.textContent = current + " / " + limit + " caracteres";
    node.classList.toggle("is-over-limit", current > limit);
  }

  function bindTextCounter(input, counterNode, limit) {
    if (!input || !counterNode) return;
    var max = parseInt(limit, 10);
    if (!isFinite(max) || max <= 0) return;

    function refresh() {
      updateCharCounter(counterNode, getPlainTextLength(input.value), max);
    }

    input.addEventListener("input", function () {
      if (input.value.length > max) {
        input.value = input.value.slice(0, max);
      }
      refresh();
    });

    refresh();
  }

  function execRichCommand(editor, command, value) {
    if (!editor || typeof document.execCommand !== "function") return;
    editor.focus();
    document.execCommand(command, false, value || null);
  }

  function execRichFormatBlock(editor, value) {
    if (!editor || typeof document.execCommand !== "function") return;
    editor.focus();
    var tag = String(value || "").trim().toLowerCase();
    if (!tag) return;

    // Different browsers accept slightly different formatBlock values.
    var blockValue = "<" + tag + ">";
    try {
      document.execCommand("formatBlock", false, blockValue);
    } catch (error) {
      document.execCommand("formatBlock", false, tag);
    }
  }

  function insertHtmlAtSelection(editor, html, savedRange) {
    if (!editor || typeof document.execCommand !== "function") return;
    editor.focus();
    if (savedRange) {
      restoreEditorSelection(savedRange);
    }
    document.execCommand("insertHTML", false, html);
  }

  function insertRichLink(editor) {
    var savedRange = getEditorSelectionRange(editor);
    var url = promptForSafeUrl("Pega la URL del enlace:", "https://");
    if (!url) return;
    var safeUrl = sanitizeEditorLinkUrl(url);
    if (!safeUrl || safeUrl === "#") {
      window.alert("La URL del enlace no es válida.");
      return;
    }

    if (savedRange && !savedRange.collapsed) {
      insertHtmlAtSelection(editor, '<a href="' + escapeHtml(safeUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(savedRange.toString() || "Enlace") + '</a>', savedRange);
      return;
    }

    var text = promptForSafeUrl("Texto visible del enlace:", "Leer más") || "Leer más";
    insertHtmlAtSelection(editor, '<a href="' + escapeHtml(safeUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(text) + '</a>', savedRange);
  }

  function insertRichMedia(editor, kind) {
    var savedRange = getEditorSelectionRange(editor);
    var url = "";
    var altText = "";
    var titleText = "";

    if (kind === "image") {
      url = promptForSafeUrl("Pega la URL de la imagen:", "https://");
      if (!url) return;
      url = sanitizeEditorImageUrl(url);
      if (!url) {
        window.alert("La URL de la imagen no es válida.");
        return;
      }
      altText = promptForSafeUrl("Texto alternativo para la imagen:", "") || "";
      insertHtmlAtSelection(editor, '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(altText) + '">', savedRange);
      return;
    }

    if (kind === "video") {
      url = promptForSafeUrl("Pega la URL del video:", "https://");
      if (!url) return;
      url = sanitizeEditorMediaUrl(url);
      if (!url) {
        window.alert("La URL del video no es válida.");
        return;
      }
      insertHtmlAtSelection(editor, '<video controls preload="metadata" src="' + escapeHtml(url) + '"></video>', savedRange);
      return;
    }

    if (kind === "iframe") {
      url = promptForSafeUrl("Pega la URL del iframe:", "https://");
      if (!url) return;
      url = sanitizeEditorIframeUrl(url);
      if (!url) {
        window.alert("La URL del iframe no es válida.");
        return;
      }
      titleText = promptForSafeUrl("Título del iframe:", "") || "";
      insertHtmlAtSelection(editor, '<iframe src="' + escapeHtml(url) + '" title="' + escapeHtml(titleText) + '" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>', savedRange);
    }
  }

  function bindRichEditor(modal, prefix) {
    var editor = modal.querySelector("#" + prefix + "-content");
    var toolbar = modal.querySelector("[data-rich-toolbar]");
    var formatButtons = Array.prototype.slice.call(modal.querySelectorAll("[data-rich-format-button]"));
    var counterNode = modal.querySelector("#" + prefix + "-content-count");
    var bodyLimit = parseInt(editor && editor.getAttribute("data-char-limit"), 10) || 8000;

    if (!editor || !toolbar) return;

    var initialHtml = editor.getAttribute("data-initial-html") || "";
    editor.innerHTML = initialHtml;

    var savedRange = null;

    function refreshCounter() {
      updateCharCounter(counterNode, getRichEditorLength(editor), bodyLimit);
    }

    function cacheSelection() {
      var range = getEditorSelectionRange(editor);
      if (range) {
        savedRange = range;
      }
    }

    function restoreSavedSelection() {
      if (savedRange) {
        restoreEditorSelection(savedRange);
      }
    }

    function getCurrentBlockTag() {
      var selection = window.getSelection && window.getSelection();
      if (!selection || !selection.rangeCount) return "";
      var node = selection.anchorNode;
      if (!node) return "";
      if (node.nodeType === 3) {
        node = node.parentElement;
      }
      while (node && node !== editor) {
        if (node.nodeType === 1 && node.tagName) {
          var tagName = node.tagName.toLowerCase();
          if (tagName === "p" || tagName === "h2" || tagName === "h3" || tagName === "blockquote") {
            return tagName;
          }
        }
        node = node.parentElement;
      }
      return "p";
    }

    function syncFormatButtons() {
      var currentTag = getCurrentBlockTag();
      Array.prototype.forEach.call(formatButtons, function (button) {
        var value = String(button.getAttribute("data-rich-format-button") || "").toLowerCase();
        var active = value === currentTag;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    editor.addEventListener("mouseup", cacheSelection);
    editor.addEventListener("keyup", cacheSelection);
    editor.addEventListener("focus", cacheSelection);
    editor.addEventListener("beforeinput", function (event) {
      if (!event.inputType || event.inputType.indexOf("insert") !== 0) return;

      var currentLength = getRichEditorLength(editor);
      var selectionLength = 0;
      var selection = window.getSelection && window.getSelection();
      if (selection && selection.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
        selectionLength = getPlainTextLength(selection.toString());
      }

      var incomingLength = 1;
      if (event.inputType === "insertFromPaste" || event.inputType === "insertFromDrop") {
        var pasted = "";
        if (event.clipboardData) {
          pasted = event.clipboardData.getData("text/plain");
        } else if (event.dataTransfer) {
          pasted = event.dataTransfer.getData("text/plain");
        }
        incomingLength = getPlainTextLength(pasted || "");
      } else if (typeof event.data === "string") {
        incomingLength = getPlainTextLength(event.data);
      }

      if (currentLength - selectionLength + incomingLength > bodyLimit) {
        event.preventDefault();
      }
    });
    editor.addEventListener("input", function () {
      cacheSelection();
      refreshCounter();
    });

    toolbar.addEventListener("mousedown", function (event) {
      if (event.target.closest("[data-rich-format-button]")) {
        cacheSelection();
        event.preventDefault();
      } else if (event.target.closest("[data-rich-command], [data-rich-action]")) {
        event.preventDefault();
      }
    });

    Array.prototype.forEach.call(formatButtons, function (button) {
      button.addEventListener("click", function () {
        var value = button.getAttribute("data-rich-format-button");
        restoreSavedSelection();
        execRichFormatBlock(editor, value);
        cacheSelection();
        refreshCounter();
        syncFormatButtons();
      });
    });

    Array.prototype.forEach.call(toolbar.querySelectorAll("[data-rich-command]"), function (button) {
      button.addEventListener("click", function () {
        var command = button.getAttribute("data-rich-command");
        restoreSavedSelection();
        execRichCommand(editor, command);
        cacheSelection();
      });
    });

    Array.prototype.forEach.call(toolbar.querySelectorAll("[data-rich-action]"), function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-rich-action");
        restoreSavedSelection();
        if (action === "link") {
          insertRichLink(editor);
        } else if (action === "image" || action === "video" || action === "iframe") {
          insertRichMedia(editor, action);
        }
        cacheSelection();
        refreshCounter();
      });
    });

    editor.addEventListener("click", syncFormatButtons);
    editor.addEventListener("keyup", syncFormatButtons);
    editor.addEventListener("mouseup", syncFormatButtons);
    editor.addEventListener("focus", syncFormatButtons);

    refreshCounter();
    syncFormatButtons();
  }

  function readColumnModalDraft(modal, prefix, base) {
    var id = prefix || "column-modal";
    var source = base || {};
    var authorSelect = modal.querySelector("#" + id + "-author");
    var authorOption = authorSelect && authorSelect.selectedOptions ? authorSelect.selectedOptions[0] : null;
    var editor = modal.querySelector("#" + id + "-content");
    var contentHtml = editor ? editor.innerHTML : "";

    return {
      id: source.id || "",
      titulo: modal.querySelector("#" + id + "-title").value,
      autorId: authorSelect ? authorSelect.value : "",
      autor: authorOption ? authorOption.textContent.replace(/\s*-\s*.*$/, "") : "",
      fecha: modal.querySelector("#" + id + "-date").value,
      categoria: modal.querySelector("#" + id + "-category").value,
      estado: modal.querySelector("#" + id + "-status").value,
      imagen: modal.querySelector("#" + id + "-image").value,
      banner: modal.querySelector("#" + id + "-image").value,
      resumen: modal.querySelector("#" + id + "-summary").value,
      hashtags: modal.querySelector("#" + id + "-hashtags").value,
      contenido: contentHtml,
      contenidoHtml: contentHtml,
      visible: modal.querySelector("#" + id + "-visible").checked
    };
  }

  function openColumnEditorModal(column) {
    var isNew = !column || !column.id;
    var selected = column || {
      id: "",
      titulo: "",
      autor: "",
      autorId: "",
      fecha: "",
      categoria: "Opinion",
      resumen: "",
      hashtags: "",
      contenido: "",
      imagen: "",
      banner: "",
      estado: "borrador",
      visible: true
    };
    var prefix = "column-modal";

    var html =
      '<div class="admin-modal-head">' +
      '<div><span class="admin-kicker">Biblioteca</span><h3>' + (isNew ? "Nueva columna" : "Editar columna") + '</h3><p>' + (isNew ? "Completa los datos esenciales para publicar una nueva pieza." : "Revisa la columna, ajusta sus campos o elimínala si es necesario.") + '</p></div>' +
      '</div>' +
      '<form id="' + prefix + '-form" class="admin-form-stack" novalidate>' +
      buildColumnFields(prefix, selected) +
      '<div class="admin-actions admin-modal-actions">' +
      '<button type="button" class="btn btn-outline-dark" data-admin-modal-close>Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">' + (isNew ? "Crear columna" : "Guardar cambios") + '</button>' +
      (isNew ? "" : '<button id="' + prefix + '-delete" type="button" class="btn btn-outline-dark">Eliminar</button>') +
      '</div>' +
      '<p id="' + prefix + '-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form>';

    var modal = openAdminModal(html, "admin-modal-column", isNew ? "Nueva columna" : "Editar columna");
    if (!modal) return;

    var form = modal.querySelector("#" + prefix + "-form");
    if (!form) return;

    var titleInput = modal.querySelector("#" + prefix + "-title");
    var titleCounter = modal.querySelector("#" + prefix + "-title-count");
    var summaryInput = modal.querySelector("#" + prefix + "-summary");
    var summaryCounter = modal.querySelector("#" + prefix + "-summary-count");
    var contentEditor = modal.querySelector("#" + prefix + "-content");
    var contentCounter = modal.querySelector("#" + prefix + "-content-count");

    bindTextCounter(titleInput, titleCounter, 120);
    bindTextCounter(summaryInput, summaryCounter, 280);
    if (contentEditor && contentCounter) {
      bindRichEditor(modal, prefix);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var feedback = modal.querySelector("#" + prefix + "-feedback");
      var titleLength = getPlainTextLength(titleInput ? titleInput.value : "");
      var summaryLength = getPlainTextLength(summaryInput ? summaryInput.value : "");
      var contentLength = getRichEditorLength(contentEditor);

      if (titleLength > 120 || summaryLength > 280 || contentLength > 8000) {
        if (feedback) {
          feedback.textContent = "Revisa los límites: título 120 caracteres, resumen 280 y cuerpo 8000.";
        }
        return;
      }

      var saved = window.EditorialCmsSite.saveColumn(readColumnModalDraft(modal, prefix, selected));

      if (feedback) {
        feedback.textContent = isNew ? "Columna creada. Actualizando la tabla..." : "Columna actualizada. Actualizando la tabla...";
      }

      closeAdminModal();
      renderColumns(saved.id);
    });

    var deleteButton = modal.querySelector("#" + prefix + "-delete");
    if (deleteButton) {
      deleteButton.addEventListener("click", function () {
        if (!window.confirm("Se eliminará esta columna del sitio. ¿Continuar?")) return;
        window.EditorialCmsSite.deleteColumn(selected.id);
        closeAdminModal();
        renderColumns("");
      });
    }

  }

  function openColumnCreateModal() {
    openColumnEditorModal(null);
  }

  function openColumnEditModal(column) {
    openColumnEditorModal(column);
  }

  function readProgramModalDraft(modal, base) {
    var source = base || {};

    return {
      id: source.id || "",
      nombre: modal.querySelector("#program-name").value,
      frecuencia: modal.querySelector("#program-frequency").value,
      imagen: modal.querySelector("#program-image").value,
      descripcion: modal.querySelector("#program-description").value,
      visible: modal.querySelector("#program-visible").checked
    };
  }

  function openProgramEditorModal(program) {
    var isNew = !program || !program.id;
    var selected = program || {
      id: "",
      nombre: "",
      descripcion: "",
      imagen: "",
      frecuencia: "",
      visible: true
    };

    var html =
      '<div class="admin-modal-head">' +
      '<div><span class="admin-kicker">Biblioteca</span><h3>' + (isNew ? "Nuevo programa" : "Editar programa") + '</h3><p>' + (isNew ? "Completa los datos para publicar un nuevo programa." : "Revisa el programa, ajusta su portada o elimínalo si hace falta.") + '</p></div>' +
      '</div>' +
      '<form id="program-modal-form" class="admin-form-stack" novalidate>' +
      '<label class="admin-section-toggle"><span>Visible en el sitio</span><input id="program-visible" type="checkbox"' + (selected.visible !== false ? ' checked' : '') + '></label>' +
      '<div class="admin-field"><label for="program-name">Nombre</label><input id="program-name" class="form-control" value="' + escapeHtml(selected.nombre) + '" required></div>' +
      '<div class="admin-field"><label for="program-frequency">Frecuencia</label><input id="program-frequency" class="form-control" value="' + escapeHtml(selected.frecuencia) + '"></div>' +
      '<div class="admin-field"><label for="program-image">Imagen</label><input id="program-image" class="form-control" value="' + escapeHtml(selected.imagen) + '"></div>' +
      '<div class="admin-field"><label for="program-description">Descripcion</label><textarea id="program-description" class="form-control admin-textarea-sm">' + escapeHtml(selected.descripcion) + '</textarea></div>' +
      '<div class="admin-actions admin-modal-actions">' +
      '<button type="button" class="btn btn-outline-dark" data-admin-modal-close>Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">' + (isNew ? "Crear programa" : "Guardar cambios") + '</button>' +
      (isNew ? "" : '<button id="delete-program" type="button" class="btn btn-outline-dark">Eliminar</button>') +
      '</div>' +
      '<p id="program-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form>';

    var modal = openAdminModal(html, "admin-modal-program", isNew ? "Nuevo programa" : "Editar programa");
    if (!modal) return;

    var form = modal.querySelector("#program-modal-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var feedback = modal.querySelector("#program-feedback");
      var saved = window.EditorialCmsSite.saveProgram(readProgramModalDraft(modal, selected));
      if (feedback) {
        feedback.textContent = isNew ? "Programa creado. Actualizando la tabla..." : "Programa actualizado. Actualizando la tabla...";
      }
      closeAdminModal();
      renderPrograms(saved.id);
    });

    var deleteButton = modal.querySelector("#delete-program");
    if (deleteButton) {
      deleteButton.addEventListener("click", function () {
        if (!window.confirm("Se eliminara este programa del sitio. Continuar?")) return;
        window.EditorialCmsSite.deleteProgram(selected.id);
        closeAdminModal();
        renderPrograms("");
      });
    }
  }

  function renderPrograms(selectedId) {
    var programs = window.EditorialCmsSite.getProgramsForAdmin();
    var selected = findById(programs, selectedId) || null;
    var rowsHtml = programs.length ? programs.map(function (program) {
      var statusLabel = program.visible === false ? "Oculto" : "Visible";
      return '<button type="button" class="admin-program-row' + (selected && String(selected.id) === String(program.id) ? ' is-active' : '') + '" data-id="' + escapeHtml(program.id) + '">' +
        '<div class="admin-program-main"><strong>' + escapeHtml(program.nombre || "Sin nombre") + '</strong></div>' +
        '<div class="admin-program-cell">' + escapeHtml(program.frecuencia || "Sin frecuencia") + '</div>' +
        '<div><span class="admin-program-status' + (program.visible === false ? ' is-hidden' : '') + '">' + escapeHtml(statusLabel) + '</span></div>' +
        '<div class="admin-program-cell">Abrir</div>' +
        '</button>';
    }).join("") : '<div class="admin-empty-state">No hay programas creados todavia. Usa <strong>Nuevo programa</strong> para crear el primero.</div>';

    renderEntityEditor({
      kicker: "Contenido",
      title: "Programas",
      subtitle: "Gestiona programas desde una biblioteca unica. Cada fila abre un popup para editar su portadas, frecuencia y descripcion.",
      html:
        '<section class="admin-library-layout">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Programas</h3></div><button id="add-program" type="button" class="btn btn-primary">Nuevo programa</button></div>' +
        '<div class="admin-library-meta"><span>' + programs.length + ' programas</span><span>Haz clic en una fila para abrir el popup</span></div>' +
        '<div class="admin-table-head admin-program-table-head">' +
        '<span>Nombre</span><span>Frecuencia</span><span>Estado</span><span></span>' +
        '</div>' +
        '<div class="admin-program-list" id="program-list">' + rowsHtml + '</div>' +
        '</div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#program-list .admin-program-row"), function (button) {
          button.addEventListener("click", function () {
            var program = findById(programs, button.getAttribute("data-id"));
            openProgramEditorModal(program);
          });
        });
        var addButton = document.getElementById("add-program");
        if (addButton) {
          addButton.addEventListener("click", function () {
            openProgramEditorModal(null);
          });
        }
      }
    });
  }

  function renderEpisodes(selectedId) {
    var episodes = window.EditorialCmsSite.getEpisodesForAdmin();
    var programs = window.EditorialCmsSite.getProgramsForAdmin();
    var selected = findById(episodes, selectedId) || null;
    var episodeRowsHtml = episodes.length ? episodes.map(function (episode) {
      var program = findById(programs, episode.programaId);
      var statusLabel = episode.visible === false ? "Oculto" : "Visible";
      return '<button type="button" class="admin-column-row' + (selected && String(selected.id) === String(episode.id) ? ' is-editing' : '') + '" data-id="' + escapeHtml(episode.id) + '">' +
        '<div class="admin-column-main"><strong>' + escapeHtml(episode.titulo || "Sin titulo") + '</strong></div>' +
        '<div class="admin-column-cell">' + escapeHtml(program ? program.nombre : "Sin programa") + '</div>' +
        '<div class="admin-column-cell">' + escapeHtml(episode.fecha || "Sin fecha") + '</div>' +
        '<div><span class="admin-column-status' + (episode.visible === false ? ' is-borrador' : '') + '">' + escapeHtml(statusLabel) + '</span></div>' +
        '<div class="admin-column-cell">Abrir</div>' +
        '</button>';
    }).join("") : '<div class="admin-empty-state">No hay episodios creados todavia. Usa <strong>Nuevo episodio</strong> para crear el primero.</div>';

    renderEntityEditor({
      kicker: "Contenido",
      title: "Episodios",
      subtitle: "Gestiona episodios desde una biblioteca unica. Cada fila abre un popup para editar programa, audio, resumen y transcripcion.",
      html:
        '<section class="admin-library-layout">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Episodios</h3></div><button id="add-episode" type="button" class="btn btn-primary">Nuevo episodio</button></div>' +
        '<div class="admin-library-meta"><span>' + episodes.length + ' episodios</span><span>Haz clic en una fila para ver, editar o borrar</span></div>' +
        '<div class="admin-table-head admin-column-table-head">' +
        '<span>Titulo</span><span>Programa</span><span>Fecha</span><span>Estado</span><span></span>' +
        '</div>' +
        '<div class="admin-column-list" id="episode-list">' + episodeRowsHtml + '</div>' +
        '</div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#episode-list .admin-column-row"), function (button) {
          button.addEventListener("click", function () {
            var episode = findById(episodes, button.getAttribute("data-id"));
            openEpisodeEditorModal(episode);
          });
        });
        document.getElementById("add-episode").addEventListener("click", function () {
          openEpisodeEditorModal(null);
        });
      }
    });
  }

  function readEpisodeModalDraft(modal, base) {
    var source = base || {};
    var transcript = modal.querySelector("#episode-transcript");

    return {
      id: source.id || "",
      programaId: modal.querySelector("#episode-program").value,
      numero: modal.querySelector("#episode-number").value,
      titulo: modal.querySelector("#episode-title").value,
      autor: modal.querySelector("#episode-author").value,
      fecha: modal.querySelector("#episode-date").value,
      duracion: modal.querySelector("#episode-duration").value,
      imagen: modal.querySelector("#episode-image").value,
      audio: modal.querySelector("#episode-audio").value,
      resumen: modal.querySelector("#episode-summary").value,
      transcripcion: transcript ? transcript.value : "",
      visible: modal.querySelector("#episode-visible").checked
    };
  }

  function openEpisodeEditorModal(episode) {
    var episodes = window.EditorialCmsSite.getEpisodesForAdmin();
    var programs = window.EditorialCmsSite.getProgramsForAdmin();
    var isNew = !episode || !episode.id;
    var selected = episode || {
      id: "",
      programaId: programs[0] ? programs[0].id : "",
      numero: "",
      titulo: "",
      autor: "",
      fecha: "",
      duracion: "",
      imagen: "",
      audio: "",
      resumen: "",
      transcripcion: [],
      visible: true
    };

    var html =
      '<div class="admin-modal-head">' +
      '<div><span class="admin-kicker">Biblioteca</span><h3>' + (isNew ? "Nuevo episodio" : "Editar episodio") + '</h3><p>' + (isNew ? "Completa los datos para publicar un nuevo episodio." : "Revisa el episodio, ajusta sus campos o elimínalo si es necesario.") + '</p></div>' +
      '</div>' +
      '<form id="episode-modal-form" class="admin-form-stack" novalidate>' +
      '<label class="admin-section-toggle"><span>Visible en el sitio</span><input id="episode-visible" type="checkbox"' + (selected.visible !== false ? ' checked' : '') + '></label>' +
      '<div class="admin-field"><label for="episode-program">Programa</label><select id="episode-program" class="form-control">' + programs.map(function (program) {
        return '<option value="' + escapeHtml(program.id) + '"' + (selected.programaId === program.id ? ' selected' : '') + '>' + escapeHtml(program.nombre) + '</option>';
      }).join("") + '</select></div>' +
      '<div class="admin-field"><label for="episode-number">Numero</label><input id="episode-number" class="form-control" value="' + escapeHtml(selected.numero) + '"></div>' +
      '<div class="admin-field"><label for="episode-title">Titulo</label><input id="episode-title" class="form-control" value="' + escapeHtml(selected.titulo) + '" required></div>' +
      '<div class="admin-field"><label for="episode-author">Autor</label><input id="episode-author" class="form-control" value="' + escapeHtml(selected.autor) + '"></div>' +
      '<div class="admin-field"><label for="episode-date">Fecha</label><input id="episode-date" class="form-control" value="' + escapeHtml(selected.fecha) + '" placeholder="2026-04-01 o 01 Abril 2026"></div>' +
      '<div class="admin-field"><label for="episode-duration">Duracion</label><input id="episode-duration" class="form-control" value="' + escapeHtml(selected.duracion) + '"></div>' +
      '<div class="admin-field"><label for="episode-image">Imagen</label><input id="episode-image" class="form-control" value="' + escapeHtml(selected.imagen) + '"></div>' +
      '<div class="admin-field"><label for="episode-audio">Archivo o URL de audio</label><input id="episode-audio" class="form-control" value="' + escapeHtml(selected.audio) + '"></div>' +
      '<div class="admin-field"><label for="episode-summary">Resumen</label><textarea id="episode-summary" class="form-control admin-textarea-sm">' + escapeHtml(selected.resumen) + '</textarea></div>' +
      '<div class="admin-field"><label for="episode-transcript">Transcripcion</label><textarea id="episode-transcript" class="form-control admin-code-textarea" placeholder="Una linea por intervencion. Formato: Locutor 1: texto">' + escapeHtml(window.EditorialCmsSite.serializeTranscript(selected.transcripcion)) + '</textarea></div>' +
      '<div class="admin-actions admin-modal-actions">' +
      '<button type="button" class="btn btn-outline-dark" data-admin-modal-close>Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">' + (isNew ? "Crear episodio" : "Guardar cambios") + '</button>' +
      (isNew ? "" : '<button id="episode-delete" type="button" class="btn btn-outline-dark">Eliminar</button>') +
      '</div>' +
      '<p id="episode-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form>';

    var modal = openAdminModal(html, "admin-modal-episode", isNew ? "Nuevo episodio" : "Editar episodio");
    if (!modal) return;

    var form = modal.querySelector("#episode-modal-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var feedback = modal.querySelector("#episode-feedback");
      var saved = window.EditorialCmsSite.saveEpisode(readEpisodeModalDraft(modal, selected));
      if (feedback) {
        feedback.textContent = isNew ? "Episodio creado. Actualizando la tabla..." : "Episodio actualizado. Actualizando la tabla...";
      }
      closeAdminModal();
      renderEpisodes(saved.id);
    });

    var deleteButton = modal.querySelector("#episode-delete");
    if (deleteButton) {
      deleteButton.addEventListener("click", function () {
        if (!window.confirm("Se eliminara este episodio del sitio. Continuar?")) return;
        window.EditorialCmsSite.deleteEpisode(selected.id);
        closeAdminModal();
        renderEpisodes("");
      });
    }
  }

  function renderColumns(selectedId) {
    var columns = window.EditorialCmsSite.getColumnsForAdmin();
    var selected = findById(columns, selectedId) || null;
    var columnRowsHtml = columns.length ? columns.map(function (column) {
      return '<button type="button" class="admin-column-row' + (selected && String(selected.id) === String(column.id) ? ' is-editing' : '') + '" data-id="' + escapeHtml(column.id) + '">' +
        '<div class="admin-column-main"><strong>' + escapeHtml(column.titulo) + '</strong></div>' +
        '<div class="admin-column-cell">' + escapeHtml(column.autor || "Autor/a") + '</div>' +
        '<div class="admin-column-cell">' + escapeHtml(column.fecha || "Sin fecha") + '</div>' +
        '<div><span class="admin-column-status' + (column.estado === "borrador" ? ' is-borrador' : '') + '">' + escapeHtml(column.estado || "borrador") + '</span></div>' +
        '<div class="admin-column-cell">Abrir</div>' +
        '</button>';
    }).join("") : '<div class="admin-empty-state">No hay columnas creadas todavia. Usa <strong>Nueva columna</strong> para crear la primera.</div>';

    renderEntityEditor({
      kicker: "Contenido",
      title: "Columnas",
      subtitle: "Administra piezas editoriales, borradores y columnas publicadas desde una sola biblioteca.",
      html:
        '<section class="admin-library-layout">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Columnas</h3></div><button id="add-column" type="button" class="btn btn-primary">Nueva columna</button></div>' +
        '<div class="admin-library-meta"><span>' + columns.length + ' columnas</span><span>Haz clic en una fila para ver, editar o borrar</span></div>' +
        '<div class="admin-table-head admin-column-table-head">' +
        '<span>Titulo</span><span>Autor</span><span>Fecha</span><span>Estado</span><span></span>' +
        '</div>' +
        '<div class="admin-column-list" id="column-list">' + columnRowsHtml + '</div>' +
        '</div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#column-list .admin-column-row"), function (button) {
          button.addEventListener("click", function () {
            var column = findById(columns, button.getAttribute("data-id"));
            openColumnEditModal(column);
          });
        });
        document.getElementById("add-column").addEventListener("click", function () {
          openColumnCreateModal();
        });
      }
    });
  }

  function readPublicationModalDraft(modal, base) {
    var source = base || {};

    return {
      id: source.id || "",
      titulo: modal.querySelector("#publication-title").value,
      tipo: modal.querySelector("#publication-type").value,
      fecha: modal.querySelector("#publication-date").value,
      paginas: modal.querySelector("#publication-pages").value,
      imagen: modal.querySelector("#publication-image").value,
      resumen: modal.querySelector("#publication-summary").value,
      enlace: modal.querySelector("#publication-link").value,
      visible: modal.querySelector("#publication-visible").checked
    };
  }

  function openPublicationEditorModal(publication) {
    var isNew = !publication || !publication.id;
    var selected = publication || {
      id: "",
      titulo: "",
      tipo: "",
      fecha: "",
      paginas: "",
      imagen: "",
      resumen: "",
      enlace: "",
      visible: true
    };

    var html =
      '<div class="admin-modal-head">' +
      '<div><span class="admin-kicker">Biblioteca</span><h3>' + (isNew ? "Nueva publicacion" : "Editar publicacion") + '</h3><p>' + (isNew ? "Completa los datos para agregar una publicacion nueva." : "Revisa la publicacion, ajusta sus campos o eliminela si hace falta.") + '</p></div>' +
      '</div>' +
      '<form id="publication-modal-form" class="admin-form-stack" novalidate>' +
      '<label class="admin-section-toggle"><span>Visible en el sitio</span><input id="publication-visible" type="checkbox"' + (selected.visible !== false ? ' checked' : '') + '></label>' +
      '<div class="admin-field"><label for="publication-title">Titulo</label><input id="publication-title" class="form-control" value="' + escapeHtml(selected.titulo) + '" required></div>' +
      '<div class="admin-field"><label for="publication-type">Tipo</label><input id="publication-type" class="form-control" value="' + escapeHtml(selected.tipo) + '"></div>' +
      '<div class="admin-field"><label for="publication-date">Fecha</label><input id="publication-date" class="form-control" value="' + escapeHtml(selected.fecha) + '"></div>' +
      '<div class="admin-field"><label for="publication-pages">Paginas</label><input id="publication-pages" class="form-control" value="' + escapeHtml(selected.paginas) + '"></div>' +
      '<div class="admin-field"><label for="publication-image">Imagen</label><input id="publication-image" class="form-control" value="' + escapeHtml(selected.imagen) + '"></div>' +
      '<div class="admin-field"><label for="publication-link">Enlace del documento</label><input id="publication-link" class="form-control" value="' + escapeHtml(selected.enlace) + '"></div>' +
      '<div class="admin-field"><label for="publication-summary">Resumen</label><textarea id="publication-summary" class="form-control admin-textarea-sm">' + escapeHtml(selected.resumen) + '</textarea></div>' +
      '<div class="admin-actions admin-modal-actions">' +
      '<button type="button" class="btn btn-outline-dark" data-admin-modal-close>Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">' + (isNew ? "Crear publicacion" : "Guardar cambios") + '</button>' +
      (isNew ? "" : '<button id="delete-publication" type="button" class="btn btn-outline-dark">Eliminar</button>') +
      '</div>' +
      '<p id="publication-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form>';

    var modal = openAdminModal(html, "admin-modal-publication", isNew ? "Nueva publicacion" : "Editar publicacion");
    if (!modal) return;

    var form = modal.querySelector("#publication-modal-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var feedback = modal.querySelector("#publication-feedback");
      var saved = window.EditorialCmsSite.savePublication(readPublicationModalDraft(modal, selected));
      if (feedback) {
        feedback.textContent = isNew ? "Publicacion creada. Actualizando la tabla..." : "Publicacion actualizada. Actualizando la tabla...";
      }
      closeAdminModal();
      renderPublications(saved.id);
    });

    var deleteButton = modal.querySelector("#delete-publication");
    if (deleteButton) {
      deleteButton.addEventListener("click", function () {
        if (!window.confirm("Se eliminara esta publicacion del sitio. Continuar?")) return;
        window.EditorialCmsSite.deletePublication(selected.id);
        closeAdminModal();
        renderPublications("");
      });
    }
  }

  function renderPublications(selectedId) {
    var publications = window.EditorialCmsSite.getPublicationsForAdmin();
    var selected = findById(publications, selectedId) || null;
    var rowsHtml = publications.length ? publications.map(function (publication) {
      var statusLabel = publication.visible === false ? "Oculta" : "Visible";
      return '<button type="button" class="admin-column-row' + (selected && String(selected.id) === String(publication.id) ? ' is-editing' : '') + '" data-id="' + escapeHtml(publication.id) + '">' +
        '<div class="admin-column-main"><strong>' + escapeHtml(publication.titulo || "Sin titulo") + '</strong></div>' +
        '<div class="admin-column-cell">' + escapeHtml(publication.tipo || "Sin tipo") + '</div>' +
        '<div class="admin-column-cell">' + escapeHtml(publication.fecha || "Sin fecha") + '</div>' +
        '<div><span class="admin-column-status' + (publication.visible === false ? ' is-borrador' : '') + '">' + escapeHtml(statusLabel) + '</span></div>' +
        '<div class="admin-column-cell">Abrir</div>' +
        '</button>';
    }).join("") : '<div class="admin-empty-state">No hay publicaciones creadas todavia. Usa <strong>Nueva publicacion</strong> para crear la primera.</div>';

    renderEntityEditor({
      kicker: "Contenido",
      title: "Publicaciones",
      subtitle: "Carga y gestiona documentos desde una biblioteca unica. Cada fila abre un popup para editar sus datos, portada y enlace.",
      html:
        '<section class="admin-library-layout">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Publicaciones</h3></div><button id="add-publication" type="button" class="btn btn-primary">Nueva publicacion</button></div>' +
        '<div class="admin-library-meta"><span>' + publications.length + ' publicaciones</span><span>Haz clic en una fila para abrir el popup</span></div>' +
        '<div class="admin-table-head admin-column-table-head">' +
        '<span>Titulo</span><span>Tipo</span><span>Fecha</span><span>Estado</span><span></span>' +
        '</div>' +
        '<div class="admin-column-list" id="publication-list">' + rowsHtml + '</div>' +
        '</div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#publication-list .admin-column-row"), function (button) {
          button.addEventListener("click", function () {
            var publication = findById(publications, button.getAttribute("data-id"));
            openPublicationEditorModal(publication);
          });
        });
        var addButton = document.getElementById("add-publication");
        if (addButton) {
          addButton.addEventListener("click", function () {
            openPublicationEditorModal(null);
          });
        }
      }
    });
  }

  function bindDashboard() {
    if (!document.getElementById("admin-main-content") || !window.EditorialCmsSite) return;

    var sidebar = document.getElementById("admin-cms-nav");

    if (sidebar && !sidebar.getAttribute("data-admin-nav-bound")) {
      sidebar.setAttribute("data-admin-nav-bound", "true");
      sidebar.addEventListener("click", function (event) {
        var link = event.target.closest("a.admin-sidebar-link");
        if (!link) return;
        var href = link.getAttribute("href") || "";
        if (!/^admin-columnas\.html(\?|$)/.test(href)) return;
        event.preventDefault();

        var routeUrl = new URL(href, window.location.href);
        routeAdmin(routeUrl.searchParams.get("view") || "dashboard", routeUrl.searchParams.get("id") || "");
      });
    }

    window.addEventListener("popstate", function () {
      var route = parseAdminRoute();
      renderDashboardRoute(route.view, route.id);
    });

    var initialRoute = parseAdminRoute();
    renderDashboardRoute(initialRoute.view, initialRoute.id);

    document.getElementById("admin-logout").addEventListener("click", function () {
      clearDevSession();
      fetch(LOGOUT_ENDPOINT, { method: "POST", credentials: "include" })
        .catch(function () {
          return null;
        })
        .finally(function () {
          window.location.href = "admin-login.html";
        });
    });
  }

  requireSession();
  bindLogin();
  bindDashboard();
})();
