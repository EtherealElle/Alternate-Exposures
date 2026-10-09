/* Alternate Exposures — site scripts (no dependencies) */
(function () {
  "use strict";

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
     Motion
     Scroll reveals, the condensing masthead, photo fade-ins and the
     scroll cue. All of it is skipped when the visitor prefers reduced
     motion — the CSS holds everything in its finished state.
     ------------------------------------------------------------------ */
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Elements that rise into view as you scroll. Picked by selector so new
  // markup is covered without touching the HTML.
  var REVEAL_SELECTORS = [
    ".letter > *",
    ".section-head",
    ".spread .fig",
    ".rates-intro",
    ".rate",
    ".process li",
    ".closing .container > *",
    ".cover-index div",
    ".page-head > *",
    ".filters",
    ".project",
    ".details li",
    ".contact .fig",
    ".form > *",
    ".faq details",
    ".gallery-empty > *",
    ".footer-cols > div",
    ".footer-base"
  ];

  function initReveals() {
    var nodes = [];
    REVEAL_SELECTORS.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
        // Skip anything invisible by design, e.g. the form's hidden spam trap
        if (el.matches('input, [aria-hidden="true"], [hidden]')) return;
        if (nodes.indexOf(el) === -1) nodes.push(el);
      });
    });
    if (!nodes.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    nodes.forEach(function (el) { el.setAttribute("data-reveal", ""); });

    var observer = new IntersectionObserver(function (entries) {
      // Stagger items that come into view together, so rows arrive in sequence
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (entry, i) {
        var el = entry.target;
        el.style.transitionDelay = Math.min(i, 5) * 70 + "ms";
        el.classList.add("is-visible");
        observer.unobserve(el);
      });
    }, { rootMargin: "0px", threshold: 0.01 });

    nodes.forEach(function (el) {
      // Anything already on screen at load reveals immediately
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.92) {
        el.classList.add("is-visible");
      } else {
        observer.observe(el);
      }
    });

    // Failsafe: never leave something hidden that is sitting on screen.
    // A fast flick-scroll can skip past the observer between frames, so this
    // also runs on scroll — content being invisible is far worse than a
    // missed animation.
    var remaining = nodes.slice();
    var sweep = function () {
      if (!remaining.length) return;
      remaining = remaining.filter(function (el) {
        if (el.classList.contains("is-visible")) return false;
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) {
          el.classList.add("is-visible");
          observer.unobserve(el);
          return false;
        }
        return true;
      });
    };
    var queued = false;
    var queueSweep = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; sweep(); });
    };
    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("resize", queueSweep, { passive: true });
    window.addEventListener("load", sweep);
    // A background tab stops firing scroll/frame callbacks, so catch up when
    // the visitor comes back to it
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) sweep();
    });
    // Belt and braces: a short polling pass covers environments where scroll
    // and frame callbacks are suppressed, so nothing can stay invisible.
    var ticks = 0;
    var timer = setInterval(function () {
      sweep();
      if (++ticks > 12 || !remaining.length) clearInterval(timer);
    }, 1500);
    setTimeout(sweep, 400);
  }
  initReveals();

  // Re-run for content built later (projects, gallery tiles)
  window.revealNewContent = initReveals;

  /* --- Masthead condenses after a little scrolling --- */
  var masthead = document.querySelector(".masthead");
  if (masthead) {
    var lastKnown = -1;
    var onScroll = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (lastKnown === -1 || Math.abs(y - lastKnown) > 4) {
        masthead.classList.toggle("is-scrolled", y > 40);
        lastKnown = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* --- Photos fade in once decoded --- */
  function fadeInImages(root) {
    var imgs = (root || document).querySelectorAll(".g-frame img, .project-cover img");
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.classList.contains("is-loaded")) return;
      if (img.complete && img.naturalWidth) {
        img.classList.add("is-loaded");
      } else {
        img.addEventListener("load", function () { img.classList.add("is-loaded"); }, { once: true });
        img.addEventListener("error", function () { img.classList.add("is-loaded"); }, { once: true });
      }
    });
  }
  fadeInImages();
  window.fadeInImages = fadeInImages;

  /* --- Scroll cue in the hero --- */
  var hero = document.querySelector(".hero");
  if (hero && !prefersReducedMotion) {
    var cue = document.createElement("span");
    cue.className = "scroll-cue eyebrow";
    cue.setAttribute("aria-hidden", "true");
    cue.textContent = "Scroll";
    hero.appendChild(cue);
    window.addEventListener("scroll", function () {
      cue.classList.toggle("is-gone", (window.pageYOffset || 0) > 60);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Hero background video (silent, looping)
     The source is attached here rather than in the HTML so we can pick the
     right file for the screen, and skip it entirely for visitors on Data
     Saver or who prefer reduced motion — they see the poster frame instead.
     ------------------------------------------------------------------ */
  var heroVideo = document.querySelector("[data-hero-video]");
  if (heroVideo) {
    var conn = navigator.connection || {};
    var saveData = conn.saveData === true;
    var slowNetwork = /^(slow-)?2g$/.test(conn.effectiveType || "");
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!saveData && !slowNetwork && !reducedMotion) {
      // Widest reliable measure: the window may not be laid out yet this early,
      // so fall back to the screen size before deciding this is a phone.
      var viewportWidth = Math.max(
        window.innerWidth || 0,
        document.documentElement.clientWidth || 0,
        (window.screen && window.screen.width) || 0
      );
      var narrow = viewportWidth <= 800;
      heroVideo.src = narrow ? heroVideo.dataset.srcNarrow : heroVideo.dataset.srcWide;
      heroVideo.muted = true; // belt and braces: iOS only autoplays muted video
      heroVideo.setAttribute("muted", "");
      heroVideo.autoplay = true;
      heroVideo.preload = "auto";
      heroVideo.load();
      var tryPlay = function () {
        var p = heroVideo.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
      };
      tryPlay();
      heroVideo.addEventListener("canplay", tryPlay, { once: true });

      // Stop decoding once the hero is scrolled past; resume when it's back
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) tryPlay();
            else heroVideo.pause();
          });
        }, { threshold: 0.05 }).observe(heroVideo);
      }
    }
  }

  /* ------------------------------------------------------------------
     Project data
     Projects are edited in Pages CMS, which saves them to
     data/projects.json: a list of
     { name, client, category, date, cover, description, videos[], photos[], featured }
     ------------------------------------------------------------------ */
  var CATEGORY_LABELS = {
    musicvideo: "Music video",
    artist: "Artist visuals",
    merch: "Merch drop",
    lookbook: "Lookbook",
    live: "Live show"
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

  // "Lil Example — 'Song Title'" -> "lil-example-song-title", used for #links
  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/['’"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  var projectData = null;
  function loadProjects() {
    if (!projectData) {
      projectData = fetch("data/projects.json", { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
          return (Array.isArray(data) ? data : [])
            .filter(function (p) { return p && p.name && p.cover; })
            .map(function (p) {
              p.slug = slugify(p.name);
              p.photos = [].concat(p.photos || []).filter(Boolean);
              p.videos = [].concat(p.videos || []).filter(Boolean);
              return p;
            });
        })
        .catch(function () { return []; });
    }
    return projectData;
  }

  /* ------------------------------------------------------------------
     Gallery page: a list of projects, each expanding in place
     ------------------------------------------------------------------ */
  var projectsEl = document.querySelector("[data-projects]");
  if (projectsEl) {
    loadProjects().then(function (projects) {
      projects.forEach(function (project, index) {
        projectsEl.appendChild(buildProject(project, index));
      });
      var empty = document.querySelector("[data-gallery-empty]");
      if (empty) empty.hidden = projects.length > 0;
      initProjects(Array.prototype.slice.call(projectsEl.querySelectorAll(".project")));
      if (window.revealNewContent) window.revealNewContent();
      if (window.fadeInImages) window.fadeInImages(projectsEl);
      initLightbox(Array.prototype.slice.call(projectsEl.querySelectorAll(".g-item")));
      openFromHash();
    });
  }

  function mediaTile(opts) {
    // One photo or video inside a project; shared shape with the lightbox
    var btn = document.createElement("button");
    btn.className = "g-item";
    btn.type = "button";
    btn.dataset.title = opts.title;
    if (opts.video) btn.dataset.video = opts.video;

    var frame = document.createElement("span");
    frame.className = "g-frame";
    var img = document.createElement("img");
    img.src = opts.image;
    img.alt = opts.alt;
    img.loading = "lazy";
    img.decoding = "async";
    frame.appendChild(img);
    btn.appendChild(frame);
    return btn;
  }

  function buildProject(project, index) {
    var label = CATEGORY_LABELS[project.category] || "";
    var panelId = "project-" + project.slug;

    var article = document.createElement("article");
    article.className = "project";
    article.id = project.slug;
    article.dataset.category = project.category || "";

    // --- Header: cover + name, the whole thing is the toggle
    var head = document.createElement("button");
    head.className = "project-head";
    head.type = "button";
    head.setAttribute("aria-expanded", "false");
    head.setAttribute("aria-controls", panelId);

    var cover = document.createElement("span");
    cover.className = "project-cover";
    var coverImg = document.createElement("img");
    coverImg.src = mediaPath(project.cover);
    coverImg.alt = "";
    coverImg.loading = index < 4 ? "eager" : "lazy";
    coverImg.decoding = "async";
    cover.appendChild(coverImg);

    var meta = document.createElement("span");
    meta.className = "project-meta";
    var kicker = document.createElement("span");
    kicker.className = "eyebrow";
    kicker.textContent = [label, project.date].filter(Boolean).join(" · ");
    var title = document.createElement("span");
    title.className = "project-name";
    title.textContent = project.name;
    meta.appendChild(kicker);
    meta.appendChild(title);
    if (project.client) {
      var client = document.createElement("span");
      client.className = "project-client";
      client.textContent = project.client;
      meta.appendChild(client);
    }

    var counts = [];
    if (project.photos.length) counts.push(project.photos.length + (project.photos.length === 1 ? " photo" : " photos"));
    if (project.videos.length) counts.push(project.videos.length + (project.videos.length === 1 ? " video" : " videos"));
    var toggle = document.createElement("span");
    toggle.className = "project-toggle eyebrow";
    toggle.innerHTML = "<span data-toggle-text>View project</span> <span aria-hidden=\"true\">+</span>";
    if (counts.length) {
      var countEl = document.createElement("span");
      countEl.className = "project-count eyebrow";
      countEl.textContent = counts.join(" · ");
      meta.appendChild(countEl);
    }

    head.appendChild(cover);
    head.appendChild(meta);
    head.appendChild(toggle);

    // --- Panel: description + media
    var panel = document.createElement("div");
    panel.className = "project-panel";
    panel.id = panelId;
    panel.hidden = true;

    if (project.description) {
      var desc = document.createElement("div");
      desc.className = "project-desc";
      String(project.description).split(/\n{2,}/).forEach(function (para) {
        if (!para.trim()) return;
        var p = document.createElement("p");
        p.textContent = para.trim();
        desc.appendChild(p);
      });
      panel.appendChild(desc);
    }

    var grid = document.createElement("div");
    grid.className = "project-media";

    project.videos.forEach(function (link, i) {
      var embed = embedUrl(link);
      if (!embed) return;
      grid.appendChild(mediaTile({
        title: project.name + (project.videos.length > 1 ? " — video " + (i + 1) : ""),
        video: embed,
        image: mediaPath(project.cover),
        alt: "Play video: " + project.name
      }));
    });

    project.photos.forEach(function (photo, i) {
      grid.appendChild(mediaTile({
        title: project.name + " — " + (i + 1) + " of " + project.photos.length,
        image: mediaPath(photo),
        alt: project.name + ", photograph " + (i + 1)
      }));
    });

    panel.appendChild(grid);

    var permalink = document.createElement("a");
    permalink.className = "link project-link";
    permalink.href = "#" + project.slug;
    permalink.textContent = "Link to this project";
    panel.appendChild(permalink);

    article.appendChild(head);
    article.appendChild(panel);
    return article;
  }

  function setExpanded(article, open) {
    var head = article.querySelector(".project-head");
    var panel = article.querySelector(".project-panel");
    head.setAttribute("aria-expanded", String(open));
    article.classList.toggle("open", open);

    // The height animation is decoration only: every path below leaves the
    // panel in the right state even if the animation never runs (a
    // background tab freezes the animation clock), so content can't get
    // stuck collapsed or stuck open.
    var canAnimate = !prefersReducedMotion && panel.animate && !document.hidden;

    if (open) {
      var wasHidden = panel.hidden;
      panel.hidden = false;
      if (window.fadeInImages) window.fadeInImages(panel);
      if (canAnimate && wasHidden) {
        var openAnim = panel.animate(
          [{ height: 0, opacity: 0 }, { height: panel.scrollHeight + "px", opacity: 1 }],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        // If it stalls, drop the animation so the panel sits at its natural height
        setTimeout(function () {
          if (openAnim.playState !== "finished") openAnim.cancel();
        }, 700);
      }
    } else if (canAnimate && !panel.hidden) {
      var closeAnim = panel.animate(
        [{ height: panel.scrollHeight + "px", opacity: 1 }, { height: 0, opacity: 0 }],
        { duration: 300, easing: "cubic-bezier(0.4, 0, 1, 1)" }
      );
      var finishClose = function () {
        if (!article.classList.contains("open")) panel.hidden = true;
      };
      closeAnim.onfinish = finishClose;
      setTimeout(function () { closeAnim.cancel(); finishClose(); }, 500);
    } else {
      panel.hidden = !open;
    }
    var text = head.querySelector("[data-toggle-text]");
    if (text) text.textContent = open ? "Close" : "View project";
    var sign = head.querySelector(".project-toggle span[aria-hidden]");
    if (sign) sign.textContent = open ? "−" : "+";
  }

  function initProjects(articles) {
    var filterBtns = document.querySelectorAll(".filter-btn");
    var countEl = document.querySelector("[data-count]");

    articles.forEach(function (article) {
      article.querySelector(".project-head").addEventListener("click", function () {
        var open = article.classList.contains("open");
        setExpanded(article, !open);
        if (!open) history.replaceState(null, "", "#" + article.id);
      });
    });

    function applyFilter(filter) {
      var shown = 0;
      articles.forEach(function (article) {
        var match = filter === "all" || article.dataset.category === filter;
        article.hidden = !match;
        if (!match) setExpanded(article, false);
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

    var hash = location.hash.slice(1);
    var isCategory = Array.prototype.some.call(filterBtns, function (b) { return b.dataset.filter === hash; });
    applyFilter(hash && isCategory ? hash : "all");
  }

  // gallery.html#project-slug opens that project directly (shareable link)
  function openFromHash() {
    var hash = location.hash.slice(1);
    if (!hash) return;
    var article = document.getElementById(hash);
    if (!article || !article.classList.contains("project")) return;
    setExpanded(article, true);
    article.scrollIntoView({ block: "start" });
  }
  window.addEventListener("hashchange", openFromHash);

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
      return items.filter(function (i) {
        var panel = i.closest(".project-panel");
        return !i.hidden && !(panel && panel.hidden);
      });
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
     Home page: "Selected work" uses projects marked "Show on homepage",
     topped up with the newest other projects. With no projects yet, the
     placeholder tiles stay as they are.
     ------------------------------------------------------------------ */
  var slots = Array.prototype.slice.call(document.querySelectorAll("[data-work-slot]"));
  if (slots.length) {
    loadProjects().then(function (projects) {
      var featured = projects.filter(function (p) { return p.featured; });
      var rest = projects.filter(function (p) { return !p.featured; });
      var picks = featured.concat(rest).slice(0, slots.length);
      picks.forEach(function (project, i) {
        var slot = slots[i];
        var ph = slot.querySelector(".ph");
        ph.style.backgroundImage = 'url("' + mediaPath(project.cover).replace(/"/g, "%22") + '")';
        ph.classList.add("has-img");
        ph.setAttribute("aria-label", project.name || "");
        slot.href = "gallery.html#" + project.slug;
        slot.querySelector("figcaption em").textContent = project.name || "";
        var tag = slot.querySelector("figcaption .eyebrow");
        tag.textContent = CATEGORY_LABELS[project.category] || tag.textContent;
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

    var validateField = function (input) {
      var field = input.closest(".field");
      var ok = input.checkValidity() && (!input.required || input.value.trim() !== "");
      field.classList.toggle("invalid", !ok);
      return ok;
    };

    form.querySelectorAll("[required]").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("invalid")) validateField(input);
      });
    });

    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector("button[type=submit]");

    function showStatus(html) {
      status.innerHTML = html;
      status.classList.add("show");
      status.scrollIntoView({ block: "nearest" });
    }

    var FALLBACK = "Please email <a href=\"mailto:alternateexposures@gmail.com\">alternateexposures@gmail.com</a>" +
      " or call/text <a href=\"tel:+14049902752\">404-990-2752</a> instead — you'll get a reply within 24 hours.";

    form.addEventListener("submit", function (e) {
      var required = Array.prototype.slice.call(form.querySelectorAll("[required]"));
      var results = required.map(validateField);
      var firstBad = required[results.indexOf(false)];
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
        return;
      }
      if (!window.fetch || !form.action) return; // let the browser post it normally

      // Send in the background so the visitor stays on the page
      e.preventDefault();
      submitBtn.disabled = true;
      var original = submitBtn.textContent;
      submitBtn.textContent = "Sending…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (res.ok) {
          var name = form.querySelector("#name").value.trim().split(" ")[0];
          form.reset();
          showStatus("<b>Got it" + (name ? ", " + name.replace(/[<>&]/g, "") : "") + ".</b> " +
            "Your message is on its way to Bryson — expect a reply within 24 hours.");
        } else {
          showStatus("<b>That didn't go through.</b> " + FALLBACK);
        }
      }).catch(function () {
        showStatus("<b>That didn't go through.</b> " + FALLBACK);
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      });
    });
  }
})();
