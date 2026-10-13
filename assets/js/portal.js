(function () {
  "use strict";
  var C = window.RX_COURSE, B = window.RX_BUILD || { insured: false, counts: {} };
  var page = document.body.dataset.page;
  var params = new URLSearchParams(location.search);

  // ---------- helpers ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return String(n).padStart(3, "0"); }
  function slideSrc(deck, n) { return "media/slides/" + deck + "/s-" + pad(n) + ".jpg"; }
  function pageSrc(n) { return "media/handbook/p-" + pad(n) + ".jpg"; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  var I = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/></svg>',
    slides: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  var modules = C.modules.filter(function (m) { return !m.insured || B.insured; });
  var decks = C.decks.filter(function (d) { return !d.insured || B.insured; });
  function findModule(id) { return modules.filter(function (m) { return m.id === id; })[0]; }

  // ---------- progress (this browser only; no accounts yet) ----------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("rx." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("rx." + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  function progress() { return store.get("progress", {}); }
  function saveProgress(id, pct) {
    var p = progress(), cur = p[id] || { pct: 0, done: false };
    cur.pct = Math.max(cur.pct, Math.round(pct));
    if (cur.pct >= 90) cur.done = true;
    p[id] = cur; store.set("progress", p);
    return cur;
  }

  // ---------- shell ----------
  function shell() {
    var nav = [
      ["index.html", "Modules", "home"],
      ["handbook.html", "Handbook", "handbook"],
      ["slides.html", "Slides", "slides"]
    ].map(function (n) { return '<a href="' + n[0] + '"' + (page === n[2] || (page === "module" && n[2] === "home") ? ' class="on"' : "") + ">" + n[1] + "</a>"; }).join("");
    $("#top").innerHTML =
      '<div class="wrap">' +
        '<a class="brand" href="index.html"><img src="assets/img/rudra-x-ai-logo.png" alt="Rudra-X AI" width="190" height="33"><span class="tag mono">Learning portal</span></a>' +
        '<button class="menu-btn" aria-label="Menu" aria-expanded="false">' + I.menu + "</button>" +
        '<nav class="nav" id="nav">' + nav +
          '<a class="btn primary" href="' + C.deskReference.file + '" download>' + I.download + "Desk reference</a>" +
        "</nav>" +
      "</div>";
    $("#foot").innerHTML =
      '<div class="wrap"><span>© ' + new Date().getFullYear() + " Rudra-X AI · Confidential training material · Not legal advice</span>" +
      '<a href="https://rudra-xai.github.io/">rudra-xai.github.io</a></div>';
    var btn = $(".menu-btn");
    btn.addEventListener("click", function () { var o = $("#nav").classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
  }

  // ---------- deterrents (screenshots can't be blocked by any website) ----------
  function protect() {
    document.addEventListener("contextmenu", function (e) { if (e.target.closest(".protect")) e.preventDefault(); });
    ["dragstart", "selectstart", "copy"].forEach(function (ev) {
      document.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest(".protect")) e.preventDefault(); });
    });
    document.addEventListener("keydown", function (e) {
      var k = (e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p" || k === "u")) e.preventDefault();
    });
  }

  // ---------- slide viewer ----------
  function slideViewer(el, opt) {
    var cur = Math.min(Math.max(opt.start || opt.from, opt.from), opt.to);
    var strip = "";
    for (var n = opt.from; n <= opt.to; n++) {
      strip += '<button type="button" data-n="' + n + '" aria-label="Slide ' + (n - opt.from + 1) + '"><img loading="lazy" draggable="false" src="' + slideSrc(opt.deck, n) + '" alt=""></button>';
    }
    el.innerHTML =
      '<div class="viewer protect">' +
        '<div class="slide-frame"><img draggable="false" alt=""><div class="shield"></div></div>' +
        '<div class="viewer-bar">' +
          '<button class="btn icon-btn" data-go="-1" aria-label="Previous slide">' + I.left + "</button>" +
          '<span class="count"></span>' +
          '<button class="btn icon-btn" data-go="1" aria-label="Next slide">' + I.right + "</button>" +
          '<span class="grow"></span>' + (opt.extra || "") +
          '<button class="btn icon-btn" data-full aria-label="Full screen">' + I.full + "</button>" +
        "</div>" +
        '<div class="strip">' + strip + "</div>" +
      "</div>";
    var viewer = $(".viewer", el), img = $(".slide-frame img", el), count = $(".count", el);
    function show(n) {
      cur = Math.min(Math.max(n, opt.from), opt.to);
      img.src = slideSrc(opt.deck, cur);
      img.alt = "Slide " + (cur - opt.from + 1);
      count.textContent = (cur - opt.from + 1) + " / " + (opt.to - opt.from + 1);
      $('[data-go="-1"]', el).disabled = cur === opt.from;
      $('[data-go="1"]', el).disabled = cur === opt.to;
      var strip = $(".strip", el);
      strip.querySelectorAll("button").forEach(function (b) {
        var on = +b.dataset.n === cur; b.setAttribute("aria-current", on);
        // scroll only the thumbnail strip, never the page
        if (on) strip.scrollLeft = b.offsetLeft - strip.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2;
      });
      if (cur < opt.to) new Image().src = slideSrc(opt.deck, cur + 1);
      if (opt.onChange) opt.onChange(cur);
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.go) show(cur + +b.dataset.go);
      else if (b.dataset.n) show(+b.dataset.n);
      else if ("full" in b.dataset) {
        if (document.fullscreenElement) document.exitFullscreen(); else if (viewer.requestFullscreen) viewer.requestFullscreen();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (!el.offsetParent && !document.fullscreenElement) return;
      if (/input|select|textarea/i.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { show(cur + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { show(cur - 1); e.preventDefault(); }
    });
    show(cur);
    return { show: show };
  }

  // ---------- document pages ----------
  function pagesHtml(from, to) {
    var h = "";
    for (var n = from; n <= to; n++) {
      h += '<div class="page" id="page-' + n + '"><img loading="' + (n - from < 2 ? "eager" : "lazy") + '" draggable="false" src="' + pageSrc(n) + '" alt="Page ' + n + '"><div class="shield"></div></div>';
    }
    return h;
  }
  function zoomControls(target) {
    var w = 860;
    return function (e) {
      var b = e.target.closest("[data-zoom]"); if (!b) return;
      w = Math.max(480, Math.min(1240, w + 120 * +b.dataset.zoom));
      target.style.setProperty("--docw", w + "px");
    };
  }
  var NOTICE = '<p class="notice">' + I.lock + "<span>View-only course material. Please don’t copy, photograph or share it outside your firm.</span></p>";

  // ---------- pages ----------
  function home() {
    var prog = progress();
    var done = modules.filter(function (m) { return prog[m.id] && prog[m.id].done; }).length;
    var pct = modules.length ? Math.round(100 * done / modules.length) : 0;
    $("#ring").style.setProperty("--p", pct);
    $("#ring").innerHTML = "<div><span><strong>" + done + "/" + modules.length + "</strong><small>modules<br>watched</small></span></div>";

    var track = store.get("track", "all");
    var chips = [["all", "All modules"]].concat(C.tracks.map(function (t) { return [t.id, t.name]; }));
    $("#tracks").innerHTML = '<span class="label mono">Your role</span>' + chips.map(function (c) {
      return '<button class="chip" data-track="' + c[0] + '" aria-pressed="' + (c[0] === track) + '">' + esc(c[1]) + "</button>";
    }).join("");

    $("#modules").innerHTML = modules.map(function (m) {
      var p = prog[m.id] || {};
      var state = p.done ? '<span class="state done">' + I.check + "Watched</span>"
        : p.pct ? '<span class="state">' + p.pct + "% watched</span>" : '<span class="state">Not started</span>';
      return '<a class="module" data-id="' + m.id + '" href="module.html?m=' + m.id + '">' +
        '<div class="thumb"><img loading="lazy" src="' + slideSrc(m.slides.deck, m.slides.from) + '" alt=""><span class="play">' + I.play + "</span></div>" +
        '<div class="body"><div class="meta"><span class="mono kicker">' + esc(m.label) + '</span><span class="pill mono">' + m.minutes + " min</span>" +
        (m.insured ? '<span class="pill gold mono">Insured</span>' : "") + "</div>" +
        "<h3>" + esc(m.title) + "</h3><p>" + esc(m.summary) + "</p>" + state + "</div></a>";
    }).join("");

    function applyTrack(id) {
      var t = C.tracks.filter(function (x) { return x.id === id; })[0];
      document.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.track === id); });
      document.querySelectorAll(".module").forEach(function (el) {
        var keep = !t || t.modules.indexOf(el.dataset.id) > -1 || el.dataset.id === "m00";
        el.classList.toggle("faded", !keep);
      });
      $("#track-note").textContent = t ? t.who + " · " + t.modules.length + " modules recommended. Others stay available." : "";
      store.set("track", id);
    }
    $("#tracks").addEventListener("click", function (e) { var c = e.target.closest(".chip"); if (c) applyTrack(c.dataset.track); });
    applyTrack(track);

    $("#resources").innerHTML =
      '<div class="res"><span class="ico">' + I.book + "</span><h3>" + esc(C.handbook.title) + '</h3><p>' + esc(C.handbook.note) + ". Read online, view only.</p>" +
        '<span class="tagline mono">' + (B.counts.handbook || "") + ' pages · view only</span><div class="actions"><a class="btn" href="handbook.html">Read handbook</a></div></div>' +
      '<div class="res"><span class="ico">' + I.slides + "</span><h3>Slide decks</h3><p>The full lecture slides, " + (decks.length > 1 ? "in the Market and Insured editions" : "Market Edition") + ".</p>" +
        '<span class="tagline mono">View only</span><div class="actions">' + decks.map(function (d) {
          return '<a class="btn" href="slides.html?deck=' + d.id + '">' + esc(d.name) + "</a>";
        }).join("") + "</div></div>" +
      '<div class="res"><span class="ico">' + I.download + "</span><h3>" + esc(C.deskReference.title) + "</h3><p>" + esc(C.deskReference.note) + "</p>" +
        '<span class="tagline mono">PDF · ' + C.deskReference.size + '</span><div class="actions"><a class="btn primary" href="' + C.deskReference.file + '" download>' + I.download + "Download PDF</a></div></div>" +
      (window.RX && window.RX.enabled ?
        '<div class="res"><span class="ico">' + I.compass + "</span><h3>" + esc(window.RX_PROFILE.title) + "</h3><p>A short set of practical situations about how you work with AI tools. Takes about " + window.RX_PROFILE.minutes + " minutes; there are no right or wrong answers to look up.</p>" +
        '<span class="tagline mono">About ' + window.RX_PROFILE.minutes + ' min · once</span><div class="actions"><a class="btn" href="profile.html">Start the profile</a></div></div>' : "");

    if (window.RX && window.RX.enabled) serverProgress(applyTrack);
  }

  // With the database on: who's learning, which modules are passed or still locked.
  function serverProgress() {
    var me = window.RX.me();
    var bar = $("#who-bar");
    if (!me) {
      bar.innerHTML = '<span class="dim">Modules unlock in order and end with a short check. </span><button class="linkbtn" id="who-in">Tell us who you are to start</button>';
      $("#who-in").onclick = function () { window.RX.identify().then(function () { location.reload(); }, function () {}); };
      return;
    }
    bar.innerHTML = '<span>' + esc(me.name) + " · " + esc(me.firm) + '</span><button class="linkbtn" id="who-out">Not you?</button>';
    $("#who-out").onclick = function () { window.RX.forget(); location.reload(); };
    window.RX.call("rx_progress", { p_person: me.person }).then(function (p) {
      var passed = p.passed || {}, open = true, done = 0;
      modules.forEach(function (m) {
        var card = document.querySelector('.module[data-id="' + m.id + '"]'); if (!card) return;
        var st = card.querySelector(".state");
        if (passed[m.id]) { done++; st.className = "state done"; st.innerHTML = I.check + "Passed · " + Math.round(passed[m.id].score) + "%"; saveProgress(m.id, 100); }
        else if (open) { st.className = "state next"; st.textContent = "Up next"; open = false; }
        else { st.className = "state"; st.innerHTML = I.lock + "Locked"; card.classList.add("locked"); }
      });
      var pct = modules.length ? Math.round(100 * done / modules.length) : 0;
      $("#ring").style.setProperty("--p", pct);
      $("#ring").innerHTML = "<div><span><strong>" + done + "/" + modules.length + "</strong><small>modules<br>passed</small></span></div>";
      if (p.profile && p.profile.at) {
        var b = document.querySelector('a[href="profile.html"]'); if (b) { b.textContent = "Completed"; b.removeAttribute("href"); b.classList.add("done-btn"); }
      }
    }, function (e) {
      if (/Unknown person/.test(e.message)) { window.RX.forget(); location.reload(); }
    });
  }

  function moduleView() {
    var m = findModule(params.get("m"));
    var main = $("#main");
    if (!m) {
      main.innerHTML = '<div class="wrap empty"><h1>Module not found</h1><p class="muted">It may have been moved or isn’t available yet.</p><p style="margin-top:22px"><a class="btn primary" href="index.html">All modules</a></p></div>';
      return;
    }
    document.title = m.label + ": " + m.title + " · Rudra-X AI Learning";
    if (window.RX && window.RX.enabled && window.RXLearn && m.pages) return window.RXLearn.start(m);
    var idx = modules.indexOf(m), prev = modules[idx - 1], next = modules[idx + 1];
    var p = progress()[m.id] || { pct: 0 };
    main.innerHTML =
      '<div class="wrap">' +
        '<p class="crumb"><a href="index.html">All modules</a> / ' + esc(m.label) + "</p>" +
        '<div class="page-head"><div><span class="mono kicker">' + esc(m.label) + " · " + m.minutes + " min" + (m.insured ? " · Insured edition" : "") + "</span>" +
          "<h1>" + esc(m.title) + '</h1><p class="muted">' + esc(m.summary) + "</p></div></div>" +
        '<div class="stage protect">' +
          '<video id="v" controls controlslist="nodownload noremoteplayback" disablepictureinpicture disableremoteplayback playsinline preload="metadata" poster="' + slideSrc(m.slides.deck, m.slides.from) + '" crossorigin="anonymous">' +
            '<track kind="captions" srclang="en" label="English" src="media/video/' + m.id + '/captions.vtt">' +
          "</video>" +
          '<div class="wm" aria-hidden="true">Rudra-X AI · View only</div>' +
        "</div>" +
        '<div class="progress-line"><div class="bar"><i id="pbar" style="width:' + p.pct + '%"></i></div><span id="pstate">' + (p.done ? '<span class="done">Watched</span>' : p.pct ? p.pct + "% watched" : "Not started") + "</span></div>" +
        '<div class="tabs" role="tablist">' +
          '<button class="tab" role="tab" aria-selected="true" data-tab="slides">Slides</button>' +
          (m.pages ? '<button class="tab" role="tab" aria-selected="false" data-tab="reading">Handbook chapter</button>' : "") +
        "</div>" +
        '<div id="tab-slides"></div>' +
        (m.pages ? '<div id="tab-reading" hidden>' + NOTICE + '<div class="zoom" style="margin-bottom:16px"><button class="btn icon-btn" data-zoom="-1" aria-label="Smaller">−</button><button class="btn icon-btn" data-zoom="1" aria-label="Larger">+</button><a class="btn" href="handbook.html#page-' + m.pages.from + '">Open full handbook</a></div><div class="pages protect" id="pages">' + pagesHtml(m.pages.from, m.pages.to) + "</div></div>" : "") +
        '<nav class="pager">' +
          (prev ? '<a href="module.html?m=' + prev.id + '"><small class="mono">← Previous</small><span>' + esc(prev.title) + "</span></a>" : "<span></span>") +
          (next ? '<a class="next" href="module.html?m=' + next.id + '"><small class="mono">Next →</small><span>' + esc(next.title) + "</span></a>" : "") +
        "</nav>" +
      "</div>";

    slideViewer($("#tab-slides"), { deck: m.slides.deck, from: m.slides.from, to: m.slides.to });
    $(".tabs").addEventListener("click", function (e) {
      var t = e.target.closest(".tab"); if (!t) return;
      document.querySelectorAll(".tab").forEach(function (x) { x.setAttribute("aria-selected", x === t); });
      $("#tab-slides").hidden = t.dataset.tab !== "slides";
      if ($("#tab-reading")) $("#tab-reading").hidden = t.dataset.tab !== "reading";
    });
    if (m.pages) $("#tab-reading").addEventListener("click", zoomControls($("#pages")));

    // Video: streamed in short chunks (no single file to save)
    var v = $("#v"), src = "media/video/" + m.id + "/index.m3u8";
    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({ capLevelToPlayerSize: true });
      hls.loadSource(src); hls.attachMedia(v);
    } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
    }
    var pbar = $("#pbar"), pstate = $("#pstate");
    v.addEventListener("timeupdate", function () {
      if (!v.duration) return;
      var cur = saveProgress(m.id, 100 * v.currentTime / v.duration);
      pbar.style.width = cur.pct + "%";
      pstate.innerHTML = cur.done ? '<span class="done">Watched</span>' : cur.pct + "% watched";
    });
    v.addEventListener("ended", function () { saveProgress(m.id, 100); pbar.style.width = "100%"; pstate.innerHTML = '<span class="done">Watched</span>'; });

    var wm = $(".wm");
    setInterval(function () { wm.style.left = (4 + Math.random() * 60) + "%"; wm.style.top = (6 + Math.random() * 70) + "%"; }, 8000);
  }

  function handbook() {
    var total = B.counts.handbook || 39;
    $("#toc").innerHTML = '<h3 class="mono">Contents</h3>' + C.handbook.chapters.map(function (c) {
      return '<a href="#page-' + c.page + '">' + esc(c.label) + "</a>";
    }).join("");
    $("#pages").innerHTML = pagesHtml(1, total);
    $("#reader-tools").addEventListener("click", zoomControls($("#pages")));
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView(); }, 50); }
  }

  function slides() {
    var deck = decks.filter(function (d) { return d.id === params.get("deck"); })[0] || decks[0];
    var total = B.counts[deck.id] || 1;
    $("#deck-name").textContent = deck.name;
    $("#deck-note").textContent = deck.note + " · " + total + " slides";
    $("#deck-tabs").innerHTML = decks.length > 1 ? decks.map(function (d) {
      return '<a class="chip" aria-pressed="' + (d === deck) + '" href="slides.html?deck=' + d.id + '">' + esc(d.name) + "</a>";
    }).join("") : "";
    var jump = "";
    var parts = modules.filter(function (m) { return m.slides.deck === deck.id; });
    if (parts.length > 1) {
      jump = '<select aria-label="Jump to module">' + parts.map(function (m) { return '<option value="' + m.slides.from + '">' + esc(m.label + ": " + m.title) + "</option>"; }).join("") + "</select>";
    }
    var start = parseInt(params.get("s"), 10) || 1;
    var ctl = slideViewer($("#deck"), {
      deck: deck.id, from: 1, to: total, start: start, extra: jump,
      onChange: function (n) {
        history.replaceState(null, "", "slides.html?deck=" + deck.id + "&s=" + n);
        var sel = $("#deck select");
        if (sel) { var best = parts.filter(function (m) { return m.slides.from <= n; }).pop(); if (best) sel.value = best.slides.from; }
      }
    });
    var sel = $("#deck select");
    if (sel) sel.addEventListener("change", function () { ctl.show(+sel.value); });
  }

  window.RXUI = {
    esc: esc, slideSrc: slideSrc, pageSrc: pageSrc, pagesHtml: pagesHtml, modules: modules, icons: I,
    markPassed: function (id) { saveProgress(id, 100); }
  };

  shell();
  protect();
  if (page === "home") home();
  else if (page === "module") moduleView();
  else if (page === "handbook") handbook();
  else if (page === "slides") slides();
})();
