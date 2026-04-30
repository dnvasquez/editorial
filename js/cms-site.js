(function () {
  var PAGE_STORAGE_KEY = "editorialCmsPages";
  var CONTENT_STORAGE_KEY = "editorialCmsPageContent";
  var STORAGE_KEYS = {
    programs: "editorialCmsProgramas",
    episodes: "editorialCmsEpisodios",
    columns: "editorialCmsColumnas",
    publications: "editorialCmsPublicaciones",
    columnViews: "editorialCmsColumnViews"
  };
  var REMOTE_STATE_ENDPOINT = "/.netlify/functions/cms-state";
  var REMOTE_STATE_KEYS = [
    "editorialCmsProgramas",
    "editorialCmsEpisodios",
    "editorialCmsColumnas",
    "editorialCmsPublicaciones",
    "editorialCmsColumnViews",
    "editorialCmsPages",
    "editorialCmsPageContent",
    "editorialCmsSections",
    "editorialCmsSectionContent"
  ];
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

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
      if (isPlainObject(value)) return Object.keys(value).length > 0;
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

  function flushRemoteSync() {
    syncSnapshotToServer(readSnapshot());
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
    if (remoteState && typeof remoteState === "object" && hasSnapshotData(remoteState)) {
      applySnapshotToLocalStorage(remoteState);
      return;
    }

    var localState = readSnapshot();
    if (hasSnapshotData(localState)) {
      applySnapshotToLocalStorage(localState);
      syncSnapshotToServer(localState);
    }
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

  function getColumnistaById(columnistId) {
    if (!columnistId) return null;
    return getColumnistasForAdmin().find(function (item) {
      return String(item.id) === String(columnistId);
    }) || null;
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
    var contentArray = toParagraphArray(column.contenido);
    return {
      id: column.id,
      titulo: column.titulo || "Sin titulo",
      autor: resolveColumnAuthor(column),
      autorId: column.autorId || slugify(column.autor || ""),
      fecha: formatDisplayDate(column.fecha),
      lectura: column.lectura || estimateReadingLabel(contentArray.join(" ")),
      imagen: column.imagen || "images/col01_img.jpg",
      banner: column.banner || column.imagen || "images/col01_img.jpg",
      resumen: column.resumen || "",
      contenido: contentArray,
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
      return {
        id: column.id,
        titulo: column.titulo,
        autor: resolveColumnAuthor(column),
        autorId: autorId,
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
    payload.autorId = String(payload.autorId || slugify(payload.autor || ""));
    if (typeof payload.visible !== "boolean") payload.visible = true;
    if (!payload.imagen && payload.banner) {
      payload.imagen = payload.banner;
    }
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
    flushRemoteSync();
    queueRemoteSync();
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
    flushRemoteSync();
    queueRemoteSync();
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
      if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "blob:") {
        return parsed.href;
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
      name.textContent = item.name || "Sin nombre";

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
    flushRemoteSync();
    queueRemoteSync();
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
    renderGuestsContent(body);
    renderColumnistasContent(body);
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
    getColumnistasForAdmin: getColumnistasForAdmin,
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
