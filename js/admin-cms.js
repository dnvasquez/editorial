(function () {
  var AUTH_BASE = "/.netlify/functions";
  var LOGIN_ENDPOINT = AUTH_BASE + "/admin-login";
  var SESSION_ENDPOINT = AUTH_BASE + "/admin-session";
  var LOGOUT_ENDPOINT = AUTH_BASE + "/admin-logout";

  function requireSession() {
    if (!document.body.classList.contains("admin-dashboard-body")) return;
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
    html += createLink("admin-columnas.html?view=columnistas-content", "Columnistas", currentView === "columnistas-content");
    html += createLink("admin-columnas.html?view=invitados-content", "Invitados destacados", currentView === "invitados-content");
    html += createLink("admin-columnas.html?view=about-content", "Nosotros", currentView === "about-content");
    html += createLink("admin-columnas.html?view=contact-content", "Contacto", currentView === "contact-content");
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

    document.getElementById("admin-main-content").innerHTML =
      '<section class="admin-overview-grid">' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Paginas</span><strong>' + window.EditorialCmsSite.PAGE_DEFINITIONS.length + '</strong><p>' + hiddenPages.length + ' paginas ocultas desde el CMS.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Programas</span><strong>' + programs.length + '</strong><p>Incluye programas base y programas creados desde el panel.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Episodios</span><strong>' + episodes.length + '</strong><p>Cada episodio puede editar audio, imagen, resumen y transcripcion.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Columnas</span><strong>' + columns.length + '</strong><p>Administra columnas publicadas y borradores desde una biblioteca unica.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Publicaciones</span><strong>' + publications.length + '</strong><p>Gestiona documentos, portadas, resumenes y enlaces de lectura.</p></article>' +
      '<article class="admin-overview-card"><span class="admin-overview-label">Flujo</span><strong>Unificado</strong><p>El panel lateral ahora prioriza paginas y tipos de contenido por igual.</p></article>' +
      '</section>' +
      '<section class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Como usar</span><h3>Mapa rapido del CMS</h3></div></div>' +
      '<div class="admin-help-box">' +
      '<p>Usa la seccion <strong>Paginas</strong> para encender o apagar paginas completas del sitio y ajustar hero o contenido general.</p>' +
      '<p>Usa <strong>Programas</strong> y <strong>Episodios</strong> para construir el area de podcast completa, incluyendo audio, transcripciones, imagenes y metadatos.</p>' +
      '<p>Usa <strong>Columnas</strong> y <strong>Publicaciones</strong> para administrar piezas editoriales y documentos sin depender de ediciones manuales en HTML.</p>' +
      '</div>' +
      '</section>';
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
        '<div class="admin-field"><label for="page-hero-image">Imagen</label><input id="page-hero-image" class="form-control" value="' + escapeHtml(config.heroImage) + '" placeholder="images/hero_bg_1.jpg o URL completa"></div>';
    } else {
      pageFields =
        '<div class="admin-field"><label for="page-hero-title">Titulo</label><input id="page-hero-title" class="form-control" value="' + escapeHtml(config.heroTitle) + '" placeholder="Opcional"></div>' +
        '<div class="admin-field"><label for="page-hero-subtitle">Subtitulo</label><textarea id="page-hero-subtitle" class="form-control admin-textarea-sm" placeholder="Opcional">' + escapeHtml(config.heroSubtitle) + '</textarea></div>' +
        '<div class="admin-field"><label for="page-hero-image">Imagen</label><input id="page-hero-image" class="form-control" value="' + escapeHtml(config.heroImage) + '" placeholder="images/hero_bg_1.jpg o URL completa"></div>';
    }

    setHeader(
      "Pagina",
      page.label,
      "Gestiona la visibilidad completa de esta pagina y sus ajustes generales de hero o contenido principal."
    );

    document.getElementById("admin-main-content").innerHTML =
      '<section class="admin-card admin-editor-panel admin-editor-single">' +
      '<form id="admin-page-form" class="admin-form-stack" novalidate>' +
      '<label class="admin-section-toggle"><span>Pagina visible en el sitio</span><input id="page-visible" type="checkbox"' + (config.visible !== false ? ' checked' : '') + '></label>' +
      pageFields +
      featuredEpisodeField +
      '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar pagina</button><a href="' + page.file + '" target="_blank" rel="noopener" class="btn btn-outline-dark">Abrir pagina publica</a></div>' +
      '<p id="admin-page-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></section>';

    document.getElementById("admin-page-form").addEventListener("submit", function (event) {
      event.preventDefault();
      window.EditorialCmsSite.savePageConfig(page.id, {
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
      document.getElementById("admin-page-feedback").textContent = "Pagina guardada. Recarga la vista publica para ver los cambios.";
    });

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
    var form = document.getElementById("admin-columnistas-content-form");
    if (!form) return JSON.parse(JSON.stringify(fallbackContent));

    var draft = JSON.parse(JSON.stringify(fallbackContent));
    draft.title = document.getElementById("columnistas-title").value;

    var selectedIndex = Number(form.getAttribute("data-selected-columnista-index") || 0);
    if (draft.items[selectedIndex]) {
      var itemId = String(draft.items[selectedIndex].id || "");
      draft.items[selectedIndex] = {
        id: itemId || window.EditorialCmsSite.slugify(document.getElementById("columnistas-item-name").value) || ("columnista-" + Date.now()),
        name: document.getElementById("columnistas-item-name").value,
        role: document.getElementById("columnistas-item-role").value,
        bio: document.getElementById("columnistas-item-bio").value,
        image: document.getElementById("columnistas-item-image").value,
        twitter: document.getElementById("columnistas-item-twitter").value,
        instagram: document.getElementById("columnistas-item-instagram").value,
        facebook: document.getElementById("columnistas-item-facebook").value,
        linkedin: document.getElementById("columnistas-item-linkedin").value
      };
    }

    return draft;
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
      '<div class="admin-field"><label for="about-team-title">Titulo del equipo</label><input id="about-team-title" class="form-control" value="' + escapeHtml(content.teamTitle) + '"></div>' +
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
      '<div class="admin-field"><label for="guests-item-image">Imagen</label><input id="guests-item-image" class="form-control" value="' + escapeHtml(selectedGuest.image) + '" placeholder="URL de imagen o data:image/..."><input id="guests-item-image-file" type="file" class="form-control-file mt-2" accept="image/*"><small class="text-muted">Pega una URL o sube un archivo local.</small></div>' +
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

    bindImageUpload("guests-item-image-file", "guests-item-image", "guests-content-feedback", "La imagen");
  }

  function renderColumnistasContentEditor(selectedColumnistaIndex, contentOverride) {
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

    var selectedIndex = Math.max(0, Math.min(typeof selectedColumnistaIndex === "number" ? selectedColumnistaIndex : 0, items.length - 1));
    var selectedItem = items[selectedIndex] || getEmptyColumnist();

    setHeader(
      "Contenido",
      "Nuestros columnistas",
      "Edita las fichas visibles en la sección Columnistas de la página Columnas. Esta lista alimenta también el selector de autor en nuevas columnas."
    );

    document.getElementById("admin-main-content").innerHTML =
      '<section class="admin-card admin-editor-panel admin-editor-single">' +
      '<form id="admin-columnistas-content-form" class="admin-form-stack" data-selected-columnista-index="' + selectedIndex + '" novalidate>' +
      '<div class="admin-field"><label for="columnistas-title">Titulo de seccion</label><input id="columnistas-title" class="form-control" value="' + escapeHtml(content.title || "Nuestros Columnistas") + '"></div>' +
      '<section class="admin-card admin-library-card">' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Columnistas</span><h3>Fichas</h3></div><button id="columnistas-add-item" type="button" class="btn btn-primary">Agregar columnista</button></div>' +
      '<div class="admin-entity-list" id="columnistas-item-list">' + items.map(function (item, index) {
        return '<button type="button" class="admin-entity-row' + (index === selectedIndex ? ' is-active' : '') + '" data-index="' + index + '">' +
          '<strong>' + escapeHtml(item.name || ("Columnista " + (index + 1))) + '</strong>' +
          '<span>' + escapeHtml(item.role || "Sin especialidad") + '</span></button>';
      }).join("") + '</div>' +
      '<div class="admin-library-header"><div><span class="admin-kicker">Editor</span><h3>Ficha del columnista</h3></div>' + (items.length > 1 ? '<button id="columnistas-remove-item" type="button" class="btn btn-outline-dark">Quitar columnista</button>' : '') + '</div>' +
      '<div class="admin-form-stack">' +
      '<div class="admin-field"><label for="columnistas-item-name">Nombre</label><input id="columnistas-item-name" class="form-control" value="' + escapeHtml(selectedItem.name) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-role">Especialidad / Rol</label><input id="columnistas-item-role" class="form-control" value="' + escapeHtml(selectedItem.role) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-image">Imagen</label><input id="columnistas-item-image" class="form-control" value="' + escapeHtml(selectedItem.image) + '" placeholder="URL de imagen o data:image/..."><input id="columnistas-item-image-file" type="file" class="form-control-file mt-2" accept="image/*"><small class="text-muted">Pega una URL o sube un archivo local.</small></div>' +
      '<div class="admin-field"><label for="columnistas-item-bio">Biografia</label><textarea id="columnistas-item-bio" class="form-control admin-textarea-sm">' + escapeHtml(selectedItem.bio) + '</textarea></div>' +
      '<div class="admin-field"><label for="columnistas-item-twitter">Twitter / X</label><input id="columnistas-item-twitter" class="form-control" value="' + escapeHtml(selectedItem.twitter) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-instagram">Instagram</label><input id="columnistas-item-instagram" class="form-control" value="' + escapeHtml(selectedItem.instagram) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-facebook">Facebook</label><input id="columnistas-item-facebook" class="form-control" value="' + escapeHtml(selectedItem.facebook) + '"></div>' +
      '<div class="admin-field"><label for="columnistas-item-linkedin">LinkedIn</label><input id="columnistas-item-linkedin" class="form-control" value="' + escapeHtml(selectedItem.linkedin) + '"></div>' +
      '</div></section>' +
      '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar contenido</button><a href="columnas.html" target="_blank" rel="noopener" class="btn btn-outline-dark">Abrir pagina publica</a></div>' +
      '<p id="columnistas-content-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></section>';

    document.getElementById("admin-columnistas-content-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var next = readColumnistasContentDraft({
        title: content.title || "Nuestros Columnistas",
        items: items
      });
      window.EditorialCmsSite.savePageContentSection("columnistas", next);
      document.getElementById("columnistas-content-feedback").textContent = "Contenido guardado. La pagina Columnas reflejara estos cambios.";
    });

    Array.prototype.forEach.call(document.querySelectorAll("#columnistas-item-list .admin-entity-row"), function (button) {
      button.addEventListener("click", function () {
        var draft = readColumnistasContentDraft({
          title: content.title || "Nuestros Columnistas",
          items: items
        });
        renderColumnistasContentEditor(Number(button.getAttribute("data-index")), draft);
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
        renderColumnistasContentEditor(draft.items.length - 1, draft);
      });
    }

    var removeButton = document.getElementById("columnistas-remove-item");
    if (removeButton) {
      removeButton.addEventListener("click", function () {
        var draft = readColumnistasContentDraft({
          title: content.title || "Nuestros Columnistas",
          items: items
        });
        draft.items.splice(selectedIndex, 1);
        renderColumnistasContentEditor(Math.max(0, selectedIndex - 1), draft);
      });
    }

    bindImageUpload("columnistas-item-image-file", "columnistas-item-image", "columnistas-content-feedback", "La imagen");
  }

  function renderContactContentEditor() {
    var content = window.EditorialCmsSite.getPageContentSection("contact");

    setHeader(
      "Contenido",
      "Contacto",
      "Edita el formulario, la información de contacto y el bloque final de suscripción."
    );

    document.getElementById("admin-main-content").innerHTML =
      '<section class="admin-card admin-editor-panel admin-editor-single">' +
      '<form id="admin-contact-content-form" class="admin-form-stack" novalidate>' +
      '<section class="admin-card admin-library-card"><div class="admin-library-header"><div><span class="admin-kicker">Formulario</span><h3>Etiquetas</h3></div></div><div class="admin-form-stack">' +
      '<div class="admin-field"><label for="contact-first-name-label-input">Nombre</label><input id="contact-first-name-label-input" class="form-control" value="' + escapeHtml(content.firstNameLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-last-name-label-input">Apellido</label><input id="contact-last-name-label-input" class="form-control" value="' + escapeHtml(content.lastNameLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-email-label-input">Correo</label><input id="contact-email-label-input" class="form-control" value="' + escapeHtml(content.emailLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-subject-label-input">Asunto</label><input id="contact-subject-label-input" class="form-control" value="' + escapeHtml(content.subjectLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-message-label-input">Mensaje</label><input id="contact-message-label-input" class="form-control" value="' + escapeHtml(content.messageLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-send-label-input">Botón enviar</label><input id="contact-send-label-input" class="form-control" value="' + escapeHtml(content.sendLabel) + '"></div>' +
      '</div></section>' +
      '<section class="admin-card admin-library-card"><div class="admin-library-header"><div><span class="admin-kicker">Datos</span><h3>Información de contacto</h3></div></div><div class="admin-form-stack">' +
      '<div class="admin-field"><label for="contact-address-label-input">Etiqueta dirección</label><input id="contact-address-label-input" class="form-control" value="' + escapeHtml(content.addressLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-address-input">Dirección</label><input id="contact-address-input" class="form-control" value="' + escapeHtml(content.address) + '"></div>' +
      '<div class="admin-field"><label for="contact-phone-label-input">Etiqueta teléfono</label><input id="contact-phone-label-input" class="form-control" value="' + escapeHtml(content.phoneLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-phone-input">Teléfono</label><input id="contact-phone-input" class="form-control" value="' + escapeHtml(content.phone) + '"></div>' +
      '<div class="admin-field"><label for="contact-email-info-label-input">Etiqueta correo</label><input id="contact-email-info-label-input" class="form-control" value="' + escapeHtml(content.emailInfoLabel) + '"></div>' +
      '<div class="admin-field"><label for="contact-email-info-input">Correo</label><input id="contact-email-info-input" class="form-control" value="' + escapeHtml(content.emailInfo) + '"></div>' +
      '</div></section>' +
      '<section class="admin-card admin-library-card"><div class="admin-library-header"><div><span class="admin-kicker">Cierre</span><h3>Bloque final</h3></div></div><div class="admin-form-stack">' +
      '<div class="admin-field"><label for="contact-subscribe-title-input">Título</label><input id="contact-subscribe-title-input" class="form-control" value="' + escapeHtml(content.subscribeTitle) + '"></div>' +
      '<div class="admin-field"><label for="contact-subscribe-text-input">Texto</label><textarea id="contact-subscribe-text-input" class="form-control admin-textarea-sm">' + escapeHtml(content.subscribeText) + '</textarea></div>' +
      '<div class="admin-field"><label for="contact-subscribe-placeholder-input">Placeholder email</label><input id="contact-subscribe-placeholder-input" class="form-control" value="' + escapeHtml(content.subscribePlaceholder) + '"></div>' +
      '<div class="admin-field"><label for="contact-subscribe-button-input">Botón</label><input id="contact-subscribe-button-input" class="form-control" value="' + escapeHtml(content.subscribeButton) + '"></div>' +
      '<div class="admin-field"><label for="contact-subscribe-image-input">Imagen de fondo</label><input id="contact-subscribe-image-input" class="form-control" value="' + escapeHtml(content.subscribeImage) + '"></div>' +
      '</div></section>' +
      '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar contenido</button><a href="contact.html" target="_blank" rel="noopener" class="btn btn-outline-dark">Abrir página pública</a></div>' +
      '<p id="contact-content-feedback" class="admin-feedback" aria-live="polite"></p>' +
      '</form></section>';

    document.getElementById("admin-contact-content-form").addEventListener("submit", function (event) {
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
      document.getElementById("contact-content-feedback").textContent = "Contenido guardado. La página Contacto reflejará estos cambios.";
    });
  }

  function renderEntityEditor(options) {
    setHeader(options.kicker, options.title, options.subtitle);
    document.getElementById("admin-main-content").innerHTML = options.html;
    options.bind();
  }

  function renderPrograms(selectedId) {
    var programs = window.EditorialCmsSite.getProgramsForAdmin();
    var selected = findById(programs, selectedId) || {
      id: "",
      nombre: "",
      descripcion: "",
      imagen: "",
      frecuencia: "",
      visible: true
    };

    renderEntityEditor({
      kicker: "Contenido",
      title: "Programas",
      subtitle: "Gestiona programas completos. Desde aqui puedes crear nuevos, ocultarlos o editar su portada, frecuencia y descripcion.",
      html:
        '<section class="admin-library-layout admin-library-split">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Programas</h3></div><button id="add-program" type="button" class="btn btn-primary">Nuevo programa</button></div>' +
        '<div class="admin-entity-list" id="program-list">' + programs.map(function (program) {
          return '<button type="button" class="admin-entity-row' + (selected.id === program.id ? ' is-active' : '') + '" data-id="' + escapeHtml(program.id) + '">' +
            '<strong>' + escapeHtml(program.nombre) + '</strong><span>' + escapeHtml(program.frecuencia || "Sin frecuencia") + '</span></button>';
        }).join("") + '</div></div>' +
        '<div class="admin-card admin-editor-panel">' +
        '<form id="program-form" class="admin-form-stack" novalidate>' +
        '<input id="program-id" type="hidden" value="' + escapeHtml(selected.id) + '">' +
        '<label class="admin-section-toggle"><span>Visible en el sitio</span><input id="program-visible" type="checkbox"' + (selected.visible !== false ? ' checked' : '') + '></label>' +
        '<div class="admin-field"><label for="program-name">Nombre</label><input id="program-name" class="form-control" value="' + escapeHtml(selected.nombre) + '" required></div>' +
        '<div class="admin-field"><label for="program-frequency">Frecuencia</label><input id="program-frequency" class="form-control" value="' + escapeHtml(selected.frecuencia) + '"></div>' +
        '<div class="admin-field"><label for="program-image">Imagen</label><input id="program-image" class="form-control" value="' + escapeHtml(selected.imagen) + '"></div>' +
        '<div class="admin-field"><label for="program-description">Descripcion</label><textarea id="program-description" class="form-control admin-textarea-sm">' + escapeHtml(selected.descripcion) + '</textarea></div>' +
        '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar programa</button>' + (selected.id ? '<button id="delete-program" type="button" class="btn btn-outline-dark">Eliminar</button>' : '') + '</div>' +
        '<p id="program-feedback" class="admin-feedback" aria-live="polite"></p>' +
        '</form></div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#program-list .admin-entity-row"), function (button) {
          button.addEventListener("click", function () {
            window.location.href = "admin-columnas.html?view=program&id=" + encodeURIComponent(button.getAttribute("data-id"));
          });
        });
        document.getElementById("add-program").addEventListener("click", function () {
          window.location.href = "admin-columnas.html?view=program";
        });
        document.getElementById("program-form").addEventListener("submit", function (event) {
          event.preventDefault();
          var saved = window.EditorialCmsSite.saveProgram({
            id: document.getElementById("program-id").value,
            nombre: document.getElementById("program-name").value,
            frecuencia: document.getElementById("program-frequency").value,
            imagen: document.getElementById("program-image").value,
            descripcion: document.getElementById("program-description").value,
            visible: document.getElementById("program-visible").checked
          });
          window.location.href = "admin-columnas.html?view=program&id=" + encodeURIComponent(saved.id);
        });
        var deleteButton = document.getElementById("delete-program");
        if (deleteButton) {
          deleteButton.addEventListener("click", function () {
            if (!window.confirm("Se eliminara este programa del sitio. Continuar?")) return;
            window.EditorialCmsSite.deleteProgram(selected.id);
            window.location.href = "admin-columnas.html?view=programs";
          });
        }
      }
    });
  }

  function renderEpisodes(selectedId) {
    var episodes = window.EditorialCmsSite.getEpisodesForAdmin();
    var programs = window.EditorialCmsSite.getProgramsForAdmin();
    var selected = findById(episodes, selectedId) || {
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

    renderEntityEditor({
      kicker: "Contenido",
      title: "Episodios",
      subtitle: "Cada episodio puede editar programa asociado, audio, metadatos, resumen y transcripcion completa.",
      html:
        '<section class="admin-library-layout admin-library-split">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Episodios</h3></div><button id="add-episode" type="button" class="btn btn-primary">Nuevo episodio</button></div>' +
        '<div class="admin-entity-list" id="episode-list">' + episodes.map(function (episode) {
          var program = findById(programs, episode.programaId);
          return '<button type="button" class="admin-entity-row' + (selected.id === episode.id ? ' is-active' : '') + '" data-id="' + escapeHtml(episode.id) + '">' +
            '<strong>' + escapeHtml(episode.titulo) + '</strong><span>' + escapeHtml((program ? program.nombre + " / " : "") + (episode.fecha || "")) + '</span></button>';
        }).join("") + '</div></div>' +
        '<div class="admin-card admin-editor-panel">' +
        '<form id="episode-form" class="admin-form-stack" novalidate>' +
        '<input id="episode-id" type="hidden" value="' + escapeHtml(selected.id) + '">' +
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
        '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar episodio</button>' + (selected.id ? '<button id="delete-episode" type="button" class="btn btn-outline-dark">Eliminar</button>' : '') + '</div>' +
        '<p id="episode-feedback" class="admin-feedback" aria-live="polite"></p>' +
        '</form></div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#episode-list .admin-entity-row"), function (button) {
          button.addEventListener("click", function () {
            window.location.href = "admin-columnas.html?view=episode&id=" + encodeURIComponent(button.getAttribute("data-id"));
          });
        });
        document.getElementById("add-episode").addEventListener("click", function () {
          window.location.href = "admin-columnas.html?view=episode";
        });
        document.getElementById("episode-form").addEventListener("submit", function (event) {
          event.preventDefault();
          var saved = window.EditorialCmsSite.saveEpisode({
            id: document.getElementById("episode-id").value,
            programaId: document.getElementById("episode-program").value,
            numero: document.getElementById("episode-number").value,
            titulo: document.getElementById("episode-title").value,
            autor: document.getElementById("episode-author").value,
            fecha: document.getElementById("episode-date").value,
            duracion: document.getElementById("episode-duration").value,
            imagen: document.getElementById("episode-image").value,
            audio: document.getElementById("episode-audio").value,
            resumen: document.getElementById("episode-summary").value,
            transcripcion: document.getElementById("episode-transcript").value,
            visible: document.getElementById("episode-visible").checked
          });
          window.location.href = "admin-columnas.html?view=episode&id=" + encodeURIComponent(saved.id);
        });
        var deleteButton = document.getElementById("delete-episode");
        if (deleteButton) {
          deleteButton.addEventListener("click", function () {
            if (!window.confirm("Se eliminara este episodio del sitio. Continuar?")) return;
            window.EditorialCmsSite.deleteEpisode(selected.id);
            window.location.href = "admin-columnas.html?view=episodes";
          });
        }
      }
    });
  }

  function renderColumns(selectedId) {
    var columns = window.EditorialCmsSite.getColumnsForAdmin();
    var selected = findById(columns, selectedId) || {
      id: "",
      titulo: "",
      autor: "",
      autorId: "",
      fecha: "",
      categoria: "Opinion",
      resumen: "",
      contenido: "",
      imagen: "",
      banner: "",
      estado: "borrador",
      visible: true
    };

    renderEntityEditor({
      kicker: "Contenido",
      title: "Columnas",
      subtitle: "Administra piezas editoriales, borradores y columnas publicadas desde una sola biblioteca.",
      html:
        '<section class="admin-library-layout admin-library-split">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Columnas</h3></div><button id="add-column" type="button" class="btn btn-primary">Nueva columna</button></div>' +
        '<div class="admin-entity-list" id="column-list">' + columns.map(function (column) {
          return '<button type="button" class="admin-entity-row' + (selected.id === column.id ? ' is-active' : '') + '" data-id="' + escapeHtml(column.id) + '">' +
            '<strong>' + escapeHtml(column.titulo) + '</strong><span>' + escapeHtml((column.autor || "") + " / " + (column.estado || "")) + '</span></button>';
        }).join("") + '</div></div>' +
        '<div class="admin-card admin-editor-panel">' +
        '<form id="column-form" class="admin-form-stack" novalidate>' +
        '<input id="column-id" type="hidden" value="' + escapeHtml(selected.id) + '">' +
        '<label class="admin-section-toggle"><span>Visible en el sitio</span><input id="column-visible" type="checkbox"' + (selected.visible !== false ? ' checked' : '') + '></label>' +
        '<div class="admin-field"><label for="column-title">Titulo</label><input id="column-title" class="form-control" value="' + escapeHtml(selected.titulo) + '" required></div>' +
        '<div class="admin-field"><label for="column-author">Autor</label><select id="column-author" class="form-control">' + buildColumnAuthorOptions(selected) + '</select></div>' +
        '<div class="admin-field"><label for="column-date">Fecha</label><input id="column-date" class="form-control" value="' + escapeHtml(selected.fecha) + '" placeholder="2026-04-01"></div>' +
        '<div class="admin-field"><label for="column-category">Categoria</label><select id="column-category" class="form-control"><option value="Analisis"' + (selected.categoria === "Analisis" ? ' selected' : '') + '>Analisis</option><option value="Opinion"' + (selected.categoria === "Opinion" ? ' selected' : '') + '>Opinion</option><option value="Entrevista"' + (selected.categoria === "Entrevista" ? ' selected' : '') + '>Entrevista</option><option value="Territorio"' + (selected.categoria === "Territorio" ? ' selected' : '') + '>Territorio</option><option value="Politica publica"' + (selected.categoria === "Politica publica" ? ' selected' : '') + '>Politica publica</option></select></div>' +
        '<div class="admin-field"><label for="column-status">Estado</label><select id="column-status" class="form-control"><option value="borrador"' + (selected.estado === "borrador" ? ' selected' : '') + '>Borrador</option><option value="publicada"' + (selected.estado === "publicada" ? ' selected' : '') + '>Publicada</option></select></div>' +
        '<div class="admin-field"><label for="column-image">Imagen</label><input id="column-image" class="form-control" value="' + escapeHtml(selected.imagen) + '" placeholder="URL de imagen o data:image/..."><input id="column-image-file" type="file" class="form-control-file mt-2" accept="image/*"><small class="text-muted">Pega una URL o sube un archivo local.</small></div>' +
        '<div class="admin-field"><label for="column-banner">Banner</label><input id="column-banner" class="form-control" value="' + escapeHtml(selected.banner || selected.imagen) + '" placeholder="URL de imagen o data:image/..."><input id="column-banner-file" type="file" class="form-control-file mt-2" accept="image/*"><small class="text-muted">Pega una URL o sube un archivo local.</small></div>' +
        '<div class="admin-field"><label for="column-summary">Resumen</label><textarea id="column-summary" class="form-control admin-textarea-sm">' + escapeHtml(selected.resumen) + '</textarea></div>' +
        '<div class="admin-field"><label for="column-content">Contenido</label><textarea id="column-content" class="form-control admin-code-textarea">' + escapeHtml(selected.contenido) + '</textarea></div>' +
        '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar columna</button>' + (selected.id ? '<button id="delete-column" type="button" class="btn btn-outline-dark">Eliminar</button>' : '') + '</div>' +
        '<p id="column-feedback" class="admin-feedback" aria-live="polite"></p>' +
        '</form></div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#column-list .admin-entity-row"), function (button) {
          button.addEventListener("click", function () {
            window.location.href = "admin-columnas.html?view=column&id=" + encodeURIComponent(button.getAttribute("data-id"));
          });
        });
        document.getElementById("add-column").addEventListener("click", function () {
          window.location.href = "admin-columnas.html?view=column";
        });
        bindImageUpload("column-image-file", "column-image", "column-feedback", "La imagen");
        bindImageUpload("column-banner-file", "column-banner", "column-feedback", "El banner");
        document.getElementById("column-form").addEventListener("submit", function (event) {
          event.preventDefault();
          var authorSelect = document.getElementById("column-author");
          var authorOption = authorSelect && authorSelect.selectedOptions ? authorSelect.selectedOptions[0] : null;
          var saved = window.EditorialCmsSite.saveColumn({
            id: document.getElementById("column-id").value,
            titulo: document.getElementById("column-title").value,
            autorId: authorSelect ? authorSelect.value : "",
            autor: authorOption ? authorOption.textContent.replace(/\s*-\s*.*$/, "") : "",
            fecha: document.getElementById("column-date").value,
            categoria: document.getElementById("column-category").value,
            estado: document.getElementById("column-status").value,
            imagen: document.getElementById("column-image").value,
            banner: document.getElementById("column-banner").value,
            resumen: document.getElementById("column-summary").value,
            contenido: document.getElementById("column-content").value,
            visible: document.getElementById("column-visible").checked
          });
          var redirectUrl = "admin-columnas.html?view=column&id=" + encodeURIComponent(saved.id);
          var feedback = document.getElementById("column-feedback");
          if (feedback) {
            feedback.textContent = "Columna guardada. Actualizando la vista...";
          }
          window.setTimeout(function () {
            window.location.href = redirectUrl;
          }, 250);
        });
        var deleteButton = document.getElementById("delete-column");
        if (deleteButton) {
          deleteButton.addEventListener("click", function () {
            if (!window.confirm("Se eliminara esta columna del sitio. Continuar?")) return;
            window.EditorialCmsSite.deleteColumn(selected.id);
            window.location.href = "admin-columnas.html?view=columns";
          });
        }
      }
    });
  }

  function renderPublications(selectedId) {
    var publications = window.EditorialCmsSite.getPublicationsForAdmin();
    var selected = findById(publications, selectedId) || {
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

    renderEntityEditor({
      kicker: "Contenido",
      title: "Publicaciones",
      subtitle: "Carga y gestiona documentos, portadas y enlaces de lectura para la biblioteca editorial.",
      html:
        '<section class="admin-library-layout admin-library-split">' +
        '<div class="admin-card admin-library-card">' +
        '<div class="admin-library-header"><div><span class="admin-kicker">Biblioteca</span><h3>Publicaciones</h3></div><button id="add-publication" type="button" class="btn btn-primary">Nueva publicacion</button></div>' +
        '<div class="admin-entity-list" id="publication-list">' + publications.map(function (publication) {
          return '<button type="button" class="admin-entity-row' + (selected.id === publication.id ? ' is-active' : '') + '" data-id="' + escapeHtml(publication.id) + '">' +
            '<strong>' + escapeHtml(publication.titulo) + '</strong><span>' + escapeHtml(publication.fecha || "") + '</span></button>';
        }).join("") + '</div></div>' +
        '<div class="admin-card admin-editor-panel">' +
        '<form id="publication-form" class="admin-form-stack" novalidate>' +
        '<input id="publication-id" type="hidden" value="' + escapeHtml(selected.id) + '">' +
        '<label class="admin-section-toggle"><span>Visible en el sitio</span><input id="publication-visible" type="checkbox"' + (selected.visible !== false ? ' checked' : '') + '></label>' +
        '<div class="admin-field"><label for="publication-title">Titulo</label><input id="publication-title" class="form-control" value="' + escapeHtml(selected.titulo) + '" required></div>' +
        '<div class="admin-field"><label for="publication-type">Tipo</label><input id="publication-type" class="form-control" value="' + escapeHtml(selected.tipo) + '"></div>' +
        '<div class="admin-field"><label for="publication-date">Fecha</label><input id="publication-date" class="form-control" value="' + escapeHtml(selected.fecha) + '"></div>' +
        '<div class="admin-field"><label for="publication-pages">Paginas</label><input id="publication-pages" class="form-control" value="' + escapeHtml(selected.paginas) + '"></div>' +
        '<div class="admin-field"><label for="publication-image">Imagen</label><input id="publication-image" class="form-control" value="' + escapeHtml(selected.imagen) + '"></div>' +
        '<div class="admin-field"><label for="publication-link">Enlace del documento</label><input id="publication-link" class="form-control" value="' + escapeHtml(selected.enlace) + '"></div>' +
        '<div class="admin-field"><label for="publication-summary">Resumen</label><textarea id="publication-summary" class="form-control admin-textarea-sm">' + escapeHtml(selected.resumen) + '</textarea></div>' +
        '<div class="admin-actions"><button type="submit" class="btn btn-primary">Guardar publicacion</button>' + (selected.id ? '<button id="delete-publication" type="button" class="btn btn-outline-dark">Eliminar</button>' : '') + '</div>' +
        '<p id="publication-feedback" class="admin-feedback" aria-live="polite"></p>' +
        '</form></div></section>',
      bind: function () {
        Array.prototype.forEach.call(document.querySelectorAll("#publication-list .admin-entity-row"), function (button) {
          button.addEventListener("click", function () {
            window.location.href = "admin-columnas.html?view=publication&id=" + encodeURIComponent(button.getAttribute("data-id"));
          });
        });
        document.getElementById("add-publication").addEventListener("click", function () {
          window.location.href = "admin-columnas.html?view=publication";
        });
        document.getElementById("publication-form").addEventListener("submit", function (event) {
          event.preventDefault();
          var saved = window.EditorialCmsSite.savePublication({
            id: document.getElementById("publication-id").value,
            titulo: document.getElementById("publication-title").value,
            tipo: document.getElementById("publication-type").value,
            fecha: document.getElementById("publication-date").value,
            paginas: document.getElementById("publication-pages").value,
            imagen: document.getElementById("publication-image").value,
            resumen: document.getElementById("publication-summary").value,
            enlace: document.getElementById("publication-link").value,
            visible: document.getElementById("publication-visible").checked
          });
          window.location.href = "admin-columnas.html?view=publication&id=" + encodeURIComponent(saved.id);
        });
        var deleteButton = document.getElementById("delete-publication");
        if (deleteButton) {
          deleteButton.addEventListener("click", function () {
            if (!window.confirm("Se eliminara esta publicacion del sitio. Continuar?")) return;
            window.EditorialCmsSite.deletePublication(selected.id);
            window.location.href = "admin-columnas.html?view=publications";
          });
        }
      }
    });
  }

  function bindDashboard() {
    if (!document.getElementById("admin-main-content") || !window.EditorialCmsSite) return;

    var params = new URLSearchParams(window.location.search);
    var view = params.get("view") || "dashboard";
    var id = params.get("id") || "";
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

    document.getElementById("admin-logout").addEventListener("click", function () {
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
