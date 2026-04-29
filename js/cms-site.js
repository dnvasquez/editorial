(function () {
  var PAGE_STORAGE_KEY = "editorialCmsPages";
  var CONTENT_STORAGE_KEY = "editorialCmsPageContent";
  var STORAGE_KEYS = {
    programs: "editorialCmsProgramas",
    episodes: "editorialCmsEpisodios",
    columns: "editorialCmsColumnas",
    publications: "editorialCmsPublicaciones"
  };

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
    try {
      var raw = window.localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeArray(key, items) {
    window.localStorage.setItem(key, JSON.stringify(items));
    return items;
  }

  function readObject(key) {
    try {
      var raw = window.localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeObject(key, value) {
    var payload = value && typeof value === "object" ? value : {};
    window.localStorage.setItem(key, JSON.stringify(payload));
    return payload;
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

  function toParagraphArray(content) {
    if (Array.isArray(content)) return content;
    return String(content || "")
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(function (paragraph) { return paragraph.trim(); })
      .filter(Boolean);
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
  }

  function normalizeColumnForSite(column) {
    var contentArray = toParagraphArray(column.contenido);
    return {
      id: column.id,
      titulo: column.titulo || "Sin titulo",
      autor: column.autor || "Autor/a",
      fecha: formatDisplayDate(column.fecha),
      lectura: column.lectura || estimateReadingLabel(contentArray.join(" ")),
      imagen: column.imagen || "images/col01_img.jpg",
      banner: column.banner || column.imagen || "images/col01_img.jpg",
      resumen: column.resumen || "",
      contenido: contentArray,
      categoria: column.categoria || "Opinion",
      estado: column.estado || "publicada",
      visible: column.visible !== false
    };
  }

  function getColumnsForAdmin() {
    return mergeById(getBaseColumns().map(function (column) {
      return {
        id: column.id,
        titulo: column.titulo,
        autor: column.autor,
        fecha: normalizeDate(column.fecha),
        lectura: column.lectura,
        imagen: column.imagen,
        banner: column.banner || column.imagen,
        resumen: column.resumen,
        contenido: Array.isArray(column.contenido) ? column.contenido.join("\n\n") : (column.contenido || ""),
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
    if (typeof payload.visible !== "boolean") payload.visible = true;
    payload.banner = payload.banner || payload.imagen;
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
    return all[sectionId];
  }

  function buildParagraphMarkup(text) {
    return String(text || "")
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(function (paragraph) { return paragraph.trim(); })
      .filter(Boolean)
      .map(function (paragraph) { return "<p>" + paragraph + "</p>"; })
      .join("");
  }

  function renderSocialLinks(member, linkClass, iconClass) {
    var socialMap = [
      { key: "twitter", icon: "icon-twitter" },
      { key: "instagram", icon: "icon-instagram" },
      { key: "facebook", icon: "icon-facebook" },
      { key: "linkedin", icon: "icon-linkedin" }
    ];

    return socialMap
      .filter(function (item) { return member[item.key]; })
      .map(function (item) {
        return '<a href="' + member[item.key] + '" class="' + linkClass + '"><span class="' + item.icon + " " + iconClass + '"></span></a>';
      })
      .join("");
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
      aboutGrid.innerHTML = visibleMembers.map(function (member) {
        return '' +
          '<div class="' + getTeamMemberColumnClass(visibleMembers.length, false) + '" data-aos="fade-up">' +
          '<img src="' + (member.image || "images/person_1.jpg") + '" alt="' + (member.name || "Miembro del equipo") + '" class="cms-team-member-photo rounded-circle mb-3">' +
          '<h2 class="text-black font-weight-light mb-2">' + (member.name || "Sin nombre") + '</h2>' +
          '<div class="text-muted mb-3">' + (member.role || "") + '</div>' +
          '<p>' + (member.bio || "") + '</p>' +
          '<p>' + renderSocialLinks(member, "pl-0 pr-3", "") + '</p>' +
          '</div>';
      }).join("");
    }
    if (homeTeamGrid) {
      homeTeamGrid.className = "row justify-content-center";
      homeTeamGrid.innerHTML = visibleMembers.map(function (member) {
        return '' +
          '<div class="' + getTeamMemberColumnClass(visibleMembers.length, true) + '">' +
          '<div class="team-member">' +
          '<img src="' + (member.image || "images/person_1.jpg") + '" alt="' + (member.name || "Miembro del equipo") + '" class="img-fluid">' +
          '<div class="text">' +
          '<h2 class="mb-2 font-weight-light h4">' + (member.name || "Sin nombre") + '</h2>' +
          '<span class="d-block mb-2 text-white-opacity-05">' + (member.role || "") + '</span>' +
          '<p class="mb-4">' + (member.bio || "") + '</p>' +
          '<p>' + renderSocialLinks(member, "text-white p-2", "") + '</p>' +
          '</div></div></div>';
      }).join("");
    }
    if (manifestoImage) {
      manifestoImage.src = about.manifestoImage || "images/hero_bg_1.jpg";
    }
    if (manifestoLeft) {
      manifestoLeft.innerHTML = buildParagraphMarkup(about.manifestoLeft);
    }
    if (manifestoRight) {
      manifestoRight.innerHTML = buildParagraphMarkup(about.manifestoRight);
    }
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
      subscribeBanner.style.backgroundImage = "url(" + contact.subscribeImage + ")";
    }
  }

  function buildDefaultPages() {
    var pages = {};
    PAGE_DEFINITIONS.forEach(function (page) {
      pages[page.id] = {
        visible: true,
        heroTitle: "",
        heroSubtitle: "",
        heroImage: ""
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
    return all[pageId];
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
    renderContactContent(body);

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
      hero.style.backgroundImage = "url(" + config.heroImage + ")";
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
      var pageConfig = getPageConfig(pageId);
      toggleLinksByHref(body, hrefMap[pageId], !pageConfig || pageConfig.visible !== false);
    });
  }

  function applyHomepageSectionVisibility(body) {
    if (!body || body.getAttribute("data-cms-page") !== "index") return;

    var sectionMap = {
      programas: ["programas", "episodios"],
      columnas: ["columnas"],
      publicaciones: ["publicaciones"],
      about: ["equipo"]
    };

    Object.keys(sectionMap).forEach(function (pageId) {
      var pageConfig = getPageConfig(pageId);
      var visible = !pageConfig || pageConfig.visible !== false;
      sectionMap[pageId].forEach(function (sectionId) {
        setElementVisibility(body.querySelector('[data-cms-section="' + sectionId + '"]'), visible);
      });
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
    getPublications: getPublications,
    getPublicationsForAdmin: getPublicationsForAdmin,
    savePublication: savePublication,
    deletePublication: deletePublication,
    getPageContent: getPageContent,
    getPageContentSection: getPageContentSection,
    savePageContentSection: savePageContentSection,
    getPageConfigs: getPageConfigs,
    getPageConfig: getPageConfig,
    savePageConfig: savePageConfig,
    findPageDefinition: findPageDefinition,
    hydrateGlobals: hydrateGlobals,
    renderAboutContent: renderAboutContent,
    renderContactContent: renderContactContent,
    applyPageConfig: applyPageConfig
  };

  hydrateGlobals();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applyPageConfig(document);
    });
  } else {
    applyPageConfig(document);
  }
})();
