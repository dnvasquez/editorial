(function () {
  var COMMENTS_ENDPOINT = "/.netlify/functions/content-comments";

  function createNode(tagName, className, textContent) {
    var node = document.createElement(tagName);
    if (className) node.className = className;
    if (textContent !== undefined && textContent !== null) {
      node.textContent = textContent;
    }
    return node;
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";

    try {
      return date.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }) + " " + date.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return date.toLocaleString();
    }
  }

  function requestComments(type, id) {
    var url = COMMENTS_ENDPOINT + "?type=" + encodeURIComponent(type) + "&id=" + encodeURIComponent(id);
    return window.fetch(url, {
      headers: {
        Accept: "application/json"
      }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to load comments.");
      }
      return response.json();
    }).then(function (payload) {
      return Array.isArray(payload.comments) ? payload.comments : [];
    });
  }

  function submitComment(type, id, payload) {
    return window.fetch(COMMENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        type: type,
        id: id,
        name: payload.name,
        message: payload.message,
        pageUrl: payload.pageUrl,
        pageTitle: payload.pageTitle
      })
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to save comment.");
      }
      return response.json();
    });
  }

  function buildShareUrl(type, shareUrl, shareText, networks, previewUrl) {
    var targetUrl = shareUrl;
    var previewTarget = previewUrl || shareUrl;
    try {
      targetUrl = new URL(targetUrl, shareUrl).toString();
      previewTarget = new URL(previewTarget, shareUrl).toString();
    } catch (error) {
      targetUrl = shareUrl;
      previewTarget = previewUrl || shareUrl;
    }
    var encodedUrl = encodeURIComponent(targetUrl);
    var encodedPreviewUrl = encodeURIComponent(previewTarget);
    var encodedText = encodeURIComponent(shareText + " " + targetUrl);

    if (type === "whatsapp") {
      return "https://wa.me/?text=" + encodedText;
    }
    if (type === "x") {
      return "https://twitter.com/intent/tweet?text=" + encodedText;
    }
    if (type === "facebook") {
      return "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;
    }
    if (type === "linkedin") {
      return "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedPreviewUrl;
    }
    if (type === "native" || type === "copy") {
      return targetUrl;
    }

    return networks;
  }

  function renderShareButtons(wrapper, options) {
    var shareUrl = options.shareUrl || window.location.href.split("#")[0];
    var shareText = options.shareText || options.title || document.title;
    var previewUrl = options.previewUrl || shareUrl;

    var shareGrid = createNode("div", "content-share-grid");

    var items = [
      { label: "WhatsApp", icon: "icon-whatsapp", type: "whatsapp", tone: "content-share-button--whatsapp" },
      { label: "X", icon: "icon-twitter", type: "x", tone: "content-share-button--x" },
      { label: "Facebook", icon: "icon-facebook", type: "facebook", tone: "content-share-button--facebook" },
      { label: "LinkedIn", icon: "icon-linkedin", type: "linkedin", tone: "content-share-button--linkedin" }
    ];

    items.forEach(function (item) {
      var link = createNode("a", "content-share-button " + item.tone);
      link.href = buildShareUrl(item.type, shareUrl, shareText, "", previewUrl);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", item.label);
      link.setAttribute("title", item.label);

      var icon = createNode("span", item.icon);
      link.appendChild(icon);
      shareGrid.appendChild(link);
    });

    wrapper.appendChild(shareGrid);
  }

  function renderComments(listNode, comments) {
    listNode.textContent = "";

    if (!comments || comments.length === 0) {
      listNode.appendChild(createNode("p", "comment-empty", "Aun no hay comentarios. Se la primera persona en abrir la conversacion."));
      return;
    }

    comments.forEach(function (comment) {
      var item = createNode("article", "comment-item");

      var meta = createNode("div", "comment-meta");
      meta.appendChild(createNode("strong", "comment-author", comment.name || "Visitante"));
      meta.appendChild(createNode("span", "comment-date", formatDate(comment.createdAt)));

      var text = createNode("p", "comment-text", comment.message || "");

      item.appendChild(meta);
      item.appendChild(text);
      listNode.appendChild(item);
    });
  }

  function mountEngagement(options) {
    var mount = document.getElementById(options.mountId);
    if (!mount) return;

    var type = options.type;
    var id = options.id;
    if (!type || !id) return;

    mount.textContent = "";
    mount.className = "content-engagement";

    var card = createNode("div", "content-engagement-card");
    var intro = createNode("div", "content-engagement-intro");
    intro.appendChild(createNode("span", "content-engagement-kicker", options.kicker || "Participa"));
    intro.appendChild(createNode("h3", "content-engagement-title", options.title || "Comparte y deja tu comentario"));
    intro.appendChild(createNode("p", "content-engagement-description", options.description || "Ayudanos a amplificar el debate y cuentanos que te parecio esta publicacion."));
    card.appendChild(intro);

    var shareSection = createNode("section", "content-engagement-section content-engagement-share");
    renderShareButtons(shareSection, options);
    card.appendChild(shareSection);

    var commentsSection = createNode("section", "content-engagement-section");
    var headerRow = createNode("div", "comment-section-header");
    headerRow.appendChild(createNode("h4", "content-engagement-section-title", "Comentarios"));
    var countBadge = createNode("span", "comment-count", "0");
    headerRow.appendChild(countBadge);
    commentsSection.appendChild(headerRow);

    var form = createNode("form", "comment-form");
    var nameLabel = createNode("label", "comment-field-label", "Nombre");
    nameLabel.htmlFor = options.mountId + "-name";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = options.mountId + "-name";
    nameInput.name = "name";
    nameInput.className = "form-control";
    nameInput.placeholder = "Tu nombre";
    nameInput.maxLength = 80;
    nameInput.required = true;

    var commentLabel = createNode("label", "comment-field-label", "Tu comentario");
    commentLabel.htmlFor = options.mountId + "-message";
    var commentInput = document.createElement("textarea");
    commentInput.id = options.mountId + "-message";
    commentInput.name = "message";
    commentInput.className = "form-control";
    commentInput.rows = 4;
    commentInput.placeholder = "Escribe tu opinion";
    commentInput.maxLength = 1000;
    commentInput.required = true;

    var submitRow = createNode("div", "comment-form-actions");
    var submitButton = createNode("button", "btn btn-primary py-2 px-4", "Publicar comentario");
    submitButton.type = "submit";
    submitRow.appendChild(submitButton);

    var status = createNode("p", "comment-status");
    var list = createNode("div", "comment-list");

    form.appendChild(nameLabel);
    form.appendChild(nameInput);
    form.appendChild(commentLabel);
    form.appendChild(commentInput);
    form.appendChild(submitRow);

    commentsSection.appendChild(form);
    commentsSection.appendChild(status);
    commentsSection.appendChild(list);
    card.appendChild(commentsSection);
    mount.appendChild(card);

    function setStatus(message, tone) {
      status.textContent = message || "";
      status.className = tone ? "comment-status " + tone : "comment-status";
    }

    function refreshComments() {
      setStatus("Cargando comentarios...", "is-loading");
      requestComments(type, id).then(function (comments) {
        countBadge.textContent = String(comments.length);
        renderComments(list, comments);
        setStatus("", "");
      }).catch(function () {
        countBadge.textContent = "0";
        renderComments(list, []);
        setStatus("No pudimos cargar los comentarios desde el servidor.", "is-warning");
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = String(nameInput.value || "").trim();
      var message = String(commentInput.value || "").trim();
      if (!name || !message) {
        setStatus("Completa tu nombre y tu comentario para publicar.", "is-error");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Publicando...";
      setStatus("", "");

      submitComment(type, id, {
        name: name,
        message: message,
        pageUrl: options.shareUrl || window.location.href.split("#")[0],
        pageTitle: options.title || document.title
      }).then(function (payload) {
        if (payload && Array.isArray(payload.comments)) {
          countBadge.textContent = String(payload.comments.length);
          renderComments(list, payload.comments);
        } else {
          refreshComments();
        }
        form.reset();
        nameInput.value = name;
        commentInput.value = "";
        setStatus("Comentario publicado.", "is-success");
      }).catch(function () {
        form.reset();
        nameInput.value = name;
        commentInput.value = "";
        setStatus("No pudimos publicar el comentario en el servidor.", "is-error");
      }).finally(function () {
        submitButton.disabled = false;
        submitButton.textContent = "Publicar comentario";
      });
    });

    refreshComments();
  }

  window.EditorialContentInteractions = {
    mountEngagement: mountEngagement
  };
})();
