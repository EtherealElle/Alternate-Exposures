/* Alternate Exposures — site scripts (no dependencies) */
(function () {
  "use strict";

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
     Gallery data
     The gallery is edited in Pages CMS, which saves it to data/gallery.json
     (a list of { image, title, category, video, featured }).
     ------------------------------------------------------------------ */
  var CATEGORY_LABELS = {
    musicvideo: "Music video",
    artist: "Artist visuals",
    merch: "Merch",
    lookbook: "Lookbook",
    live: "Live"
  };

  // Paths are saved as "/images/gallery/x.jpg". Strip the leading slash so
  // they resolve correctly when the site lives in a subfolder (GitHub Pages).
  function mediaPath(path) {
    return String(path || "").replace(/^\/+/, "");
  }

  // Turn a normal YouTube / Vimeo link into an embeddable player URL.
  function embedUrl(link) {
    if (!link) return "";
    var m;
    if ((m = link.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/))) {
      return "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0";
    }
    if ((m = link.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      return "https://player.vimeo.com/video/" + m[1] + "?autoplay=1";
    }
    return "";
  }

  var galleryData = null;
  function loadGallery() {
    if (!galleryData) {
      galleryData = fetch("data/gallery.json", { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
          return (Array.isArray(data) ? data : []).filter(function (d) { return d && d.image; });
        })
        .catch(function () { return []; });
    }
    return galleryData;
  }

  /* ------------------------------------------------------------------
     Gallery page
     ------------------------------------------------------------------ */
  var galleryEl = document.querySelector("[data-gallery]");
  if (galleryEl) {
    loadGallery().then(function (entries) {
      entries.forEach(function (entry) {
        var label = CATEGORY_LABELS[entry.category] || "";
        var btn = document.createElement("button");
        btn.className = "g-item";
        btn.dataset.category = entry.category || "";
        btn.dataset.title = entry.title || "";
        var video = embedUrl(entry.video);
        if (video) btn.dataset.video = video;

        var frame = document.createElement("span");
        frame.className = "g-frame";
        var img = document.createElement("img");
        img.src = mediaPath(entry.image);
        img.alt = entry.title || label;
        img.loading = "lazy";
        img.decoding = "async";
        frame.appendChild(img);

        var cap = document.createElement("span");
        cap.className = "cap";
        var em = document.createElement("em");
        em.textContent = entry.title || "";
        var tag = document.createElement("span");
        tag.className = "eyebrow";
        tag.textContent = label;
        cap.appendChild(em);
        cap.appendChild(tag);

        btn.appendChild(frame);
        btn.appendChild(cap);
        galleryEl.appendChild(btn);
      });

      var empty = document.querySelector("[data-gallery-empty]");
      if (empty) empty.hidden = entries.length > 0;
      initGallery(Array.prototype.slice.call(galleryEl.querySelectorAll(".g-item")));
    });
  }

  function initGallery(items) {
    var filterBtns = document.querySelectorAll(".filter-btn");
    var countEl = document.querySelector("[data-count]");

    function applyFilter(filter) {
      var shown = 0;
      items.forEach(function (item) {
        var match = filter === "all" || item.dataset.category === filter;
        item.hidden = !match;
        if (match) shown++;
      });
      filterBtns.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter));
      });
      if (countEl) countEl.textContent = shown;
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.dataset.filter);
        history.replaceState(null, "", btn.dataset.filter === "all" ? location.pathname : "#" + btn.dataset.filter);
      });
    });
    // Deep links like gallery.html#merch
    var hash = location.hash.slice(1);
    var valid = Array.prototype.some.call(filterBtns, function (b) { return b.dataset.filter === hash; });
    applyFilter(hash && valid ? hash : "all");

    initLightbox(items);
  }

  /* ------------------------------------------------------------------
     Gallery: lightbox
     ------------------------------------------------------------------ */
  function initLightbox(items) {
    var lb = document.querySelector(".lightbox");
    if (!lb || !items.length) return;
    var stage = lb.querySelector("[data-lb-stage]");
    var titleEl = lb.querySelector("[data-lb-title]");
    var countLb = lb.querySelector("[data-lb-count]");
    var closeBtn = lb.querySelector("[data-lb-close]");
    var current = 0;
    var lastFocus = null;

    function visibleItems() {
      return items.filter(function (i) { return !i.hidden; });
    }

    function pad(n) { return String(n).padStart(2, "0"); }

    function render() {
      var list = visibleItems();
      var item = list[current];
      var thumb = item.querySelector("img");
      var media;
      if (item.dataset.video) {
        // Music videos / clips: play the YouTube or Vimeo embed, shaped like its thumbnail
        media = document.createElement("iframe");
        media.src = item.dataset.video;
        media.title = item.dataset.title;
        media.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        media.allowFullscreen = true;
        var setRatio = function () {
          media.style.setProperty("--ratio", thumb.naturalWidth ? thumb.naturalWidth + " / " + thumb.naturalHeight : "16 / 9");
        };
        setRatio();
        if (thumb && !thumb.naturalWidth) {
          // Thumbnail not loaded yet: reshape the player once it is
          thumb.loading = "eager";
          thumb.addEventListener("load", function () { setRatio(); fit(); }, { once: true });
        }
      } else {
        media = thumb.cloneNode(true);
        media.loading = "eager";
      }
      stage.innerHTML = "";
      stage.appendChild(media);
      fit();
      var label = item.querySelector(".cap .eyebrow");
      titleEl.textContent = item.dataset.title + (label && label.textContent ? " — " + label.textContent : "");
      countLb.textContent = pad(current + 1) + " / " + pad(list.length);
    }

    // Scale a video frame to fit the stage while keeping its aspect ratio
    function fit() {
      var media = stage.firstElementChild;
      if (!media || media.tagName === "IMG") return;
      var parts = (media.style.getPropertyValue("--ratio") || "16 / 9").split("/");
      var ratio = parseFloat(parts[0]) / parseFloat(parts[1]);
      var cs = getComputedStyle(stage);
      var w = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      var width = Math.min(w, h * ratio);
      media.style.width = width + "px";
      media.style.height = width / ratio + "px";
    }
    window.addEventListener("resize", function () { if (lb.classList.contains("open")) fit(); });

    function open(item) {
      current = visibleItems().indexOf(item);
      lastFocus = document.activeElement;
      lb.hidden = false;
      lb.classList.add("open");
      render();
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function close() {
      lb.classList.remove("open");
      lb.hidden = true;
      stage.innerHTML = ""; // stops any playing video
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    function step(dir) {
      var len = visibleItems().length;
      current = (current + dir + len) % len;
      render();
    }

    items.forEach(function (item) {
      item.addEventListener("click", function () { open(item); });
    });
    closeBtn.addEventListener("click", close);
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { step(-1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { step(1); });

    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        // keep focus inside the dialog
        var f = lb.querySelectorAll("button");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ------------------------------------------------------------------
     Home page: "Selected work" uses entries marked "Show on homepage",
     topped up with other entries in gallery order. With no entries yet,
     the placeholder tiles stay as they are.
     ------------------------------------------------------------------ */
  var slots = Array.prototype.slice.call(document.querySelectorAll("[data-work-slot]"));
  if (slots.length) {
    loadGallery().then(function (entries) {
      var featured = entries.filter(function (e) { return e.featured; });
      var rest = entries.filter(function (e) { return !e.featured; });
      var picks = featured.concat(rest).slice(0, slots.length);
      picks.forEach(function (entry, i) {
        var slot = slots[i];
        var ph = slot.querySelector(".ph");
        ph.style.backgroundImage = 'url("' + mediaPath(entry.image).replace(/"/g, "%22") + '")';
        ph.classList.add("has-img");
        ph.setAttribute("aria-label", entry.title || "");
        slot.href = "gallery.html" + (entry.category ? "#" + entry.category : "");
        slot.querySelector("figcaption em").textContent = entry.title || "";
        var tag = slot.querySelector("figcaption .eyebrow");
        tag.textContent = CATEGORY_LABELS[entry.category] || tag.textContent;
      });
    });
  }

  /* ------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------ */
  var form = document.getElementById("contact-form");
  if (form) {
    // Preselect the project from ?project=... (linked from the services menu)
    var params = new URLSearchParams(location.search);
    var project = params.get("project");
    var projectSelect = form.querySelector("#project");
    if (project && projectSelect.querySelector('option[value="' + project + '"]')) {
      projectSelect.value = project;
      var role = { musicvideo: "artist", artist: "artist", merch: "brand", lookbook: "brand" }[project];
      if (role) form.querySelector("#role").value = role;
    }

    function validateField(input) {
      var field = input.closest(".field");
      var ok = input.checkValidity() && (!input.required || input.value.trim() !== "");
      field.classList.toggle("invalid", !ok);
      return ok;
    }

    form.querySelectorAll("[required]").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      var required = Array.prototype.slice.call(form.querySelectorAll("[required]"));
      var results = required.map(validateField);
      var firstBad = required[results.indexOf(false)];
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
        return;
      }
      if (form.hasAttribute("data-demo")) {
        e.preventDefault();
        var status = form.querySelector(".form-status");
        var name = form.querySelector("#name").value.trim().split(" ")[0];
        status.innerHTML = "<b>✓ Received.</b> Thanks, " + name.replace(/[<>&]/g, "") +
          " — this is a preview, so nothing was sent yet. Once the form is connected, Bryson will reply by email.";
        status.classList.add("show");
        form.reset();
      }
    });
  }
})();
