/* Alternate Exposures — site scripts (no dependencies) */
(function () {
  "use strict";

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
     Gallery: filtering
     ------------------------------------------------------------------ */
  var items = Array.prototype.slice.call(document.querySelectorAll(".g-item"));
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

  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.dataset.filter);
        history.replaceState(null, "", btn.dataset.filter === "all" ? location.pathname : "#" + btn.dataset.filter);
      });
    });
    // Deep links like gallery.html#portrait
    var hash = location.hash.slice(1);
    var valid = Array.prototype.some.call(filterBtns, function (b) { return b.dataset.filter === hash; });
    if (hash && valid) applyFilter(hash);
  }

  /* ------------------------------------------------------------------
     Gallery: lightbox
     ------------------------------------------------------------------ */
  var lb = document.querySelector(".lightbox");
  if (lb && items.length) {
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
      var thumb = item.querySelector(".ph, img");
      var media;
      if (item.dataset.video) {
        // Music videos / clips: play the YouTube or Vimeo embed
        media = document.createElement("iframe");
        media.src = item.dataset.video;
        media.title = item.dataset.title;
        media.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        media.allowFullscreen = true;
        media.style.setProperty("--ratio", thumb.style.getPropertyValue("--ratio") || "16 / 9");
      } else {
        media = thumb.cloneNode(true);
      }
      stage.innerHTML = "";
      stage.appendChild(media);
      fit();
      var label = item.querySelector(".cap .eyebrow");
      titleEl.textContent = item.dataset.title + (label ? " — " + label.textContent : "");
      countLb.textContent = pad(current + 1) + " / " + pad(list.length);
    }

    // Scale the frame to fit the stage while keeping its aspect ratio
    function fit() {
      var media = stage.firstElementChild;
      if (!media || media.tagName === "IMG") return;
      var parts = (media.style.getPropertyValue("--ratio") || "3 / 2").split("/");
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
