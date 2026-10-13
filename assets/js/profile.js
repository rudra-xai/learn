// AI Working Style Profile. Collects answers and behaviour; the server scores it.
// Participants don't see a score (so the key can't be learned by retaking).
(function () {
  "use strict";
  var P = window.RX_PROFILE, RX = window.RX, U = window.RXUI;
  var main = document.getElementById("main");
  function $(s, r) { return (r || document).querySelector(s); }
  function el(h) { var t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; }
  function esc(s) { return U.esc(s); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  var A = { ctx: { tools: [] }, sjt: {}, pairs: {}, tray: { outcome: {}, opened_source: false, asked_ai: false, logged_near_miss: false, events: [] }, facts: {}, habits: {} };
  var T = { hidden_count: 0, hidden_ms: 0, sections: {}, sjt_s: {} }, started = 0, hiddenAt = 0, profileId = null, secStart = 0;
  document.addEventListener("visibilitychange", function () {
    if (!started) return;
    if (document.hidden) { T.hidden_count++; hiddenAt = Date.now(); } else if (hiddenAt) { T.hidden_ms += Date.now() - hiddenAt; hiddenAt = 0; }
  });

  if (!RX.enabled) {
    main.innerHTML = '<div class="wrap empty"><h1>Not available yet</h1><p class="muted">This profile will open once the portal is connected.</p><p style="margin-top:22px"><a class="btn primary" href="index.html">Back to the portal</a></p></div>';
    return;
  }

  function frame(sectionIdx, inner) {
    var dots = P.sections.map(function (s, i) { return '<span class="' + (i <= sectionIdx ? "on" : "") + '"></span>'; }).join("");
    main.innerHTML =
      '<div class="wrap narrow">' +
        '<div class="prof-head"><span class="mono kicker">' + esc(P.title) + "</span>" +
        (sectionIdx >= 0 ? '<div class="steplabel"><span>' + esc(P.sections[sectionIdx]) + "</span><span>Section " + (sectionIdx + 1) + " of " + P.sections.length + '</span></div><div class="dots">' + dots + "</div>" : "") +
        "</div>" + inner + "</div>";
    window.scrollTo({ top: 0 });
  }
  function enterSection(i) {
    if (secStart) T.sections[P.sections[i - 1] || "start"] = Math.round((Date.now() - secStart) / 1000);
    secStart = Date.now();
  }

  // ---------------- intro ----------------
  function intro() {
    frame(-1,
      "<h1 class=\"prof-title\">" + esc(P.title) + "</h1>" +
      '<p class="lead-p">About ' + P.minutes + " minutes. Practical questions and a short exercise about how you work with AI tools day to day. Answer as you really work, not as you think you should.</p>" +
      '<ol class="prof-plan">' + P.sections.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
      '<div class="notice-box"><strong>How your answers are used</strong><p></p></div>' +
      '<label class="consent"><input type="checkbox" id="agree"> <span>I understand how my answers are used and agree to take part.</span></label>' +
      '<p class="form-err" id="err" role="alert"></p>' +
      '<div class="step-actions"><button class="btn primary" id="go" disabled>Start</button><a class="btn" href="index.html">Not now</a></div>');
    $(".notice-box p").textContent = P.notice;
    $("#agree").onchange = function () { $("#go").disabled = !this.checked; };
    $("#go").onclick = function () {
      var btn = this; btn.disabled = true;
      RX.ensure("Your responses are recorded against your name and firm.")
        .then(function (me) { return RX.call("rx_profile_start", { p_person: me.person }); })
        .then(function (r) { profileId = r.profile; started = Date.now(); context(); },
              function (e) { btn.disabled = false; if (e.message !== "cancelled") $("#err").textContent = e.message; });
    };
  }

  // ---------------- 1. about your work ----------------
  function context() {
    enterSection(0);
    var c = P.ctx;
    frame(0,
      '<div class="form-grid">' +
        '<label>Your role<select id="role"><option value="">Choose…</option>' + c.roles.map(function (r) { return "<option>" + esc(r) + "</option>"; }).join("") + "</select></label>" +
        '<label>Main practice area<select id="practice"><option value="">Choose…</option>' + c.practice.map(function (r) { return "<option>" + esc(r) + "</option>"; }).join("") + "</select></label>" +
      "</div>" +
      '<fieldset><legend>How often do you use AI tools for work?</legend><div class="radio-list">' +
        c.freq.map(function (f) { return '<label class="opt-line"><input type="radio" name="freq" value="' + f[0] + '"> ' + esc(f[1]) + "</label>"; }).join("") + "</div></fieldset>" +
      '<fieldset><legend>Which kinds of AI tool do you use? Tick all that apply.</legend><div class="radio-list">' +
        c.tools.map(function (t) { return '<label class="opt-line"><input type="checkbox" name="tools" value="' + t[0] + '"> ' + esc(t[1]) + "</label>"; }).join("") + "</div></fieldset>" +
      '<p class="form-err" id="err"></p><div class="step-actions"><button class="btn primary" id="next">Continue</button></div>');
    $("#next").onclick = function () {
      var f = document.querySelector("[name=freq]:checked");
      A.ctx = { role: $("#role").value, practice: $("#practice").value, freq: f && f.value,
                tools: Array.prototype.map.call(document.querySelectorAll("[name=tools]:checked"), function (x) { return x.value; }) };
      if (!A.ctx.role || !A.ctx.practice || !A.ctx.freq) { $("#err").textContent = "Please answer each question."; return; }
      scenarios();
    };
  }

  // ---------------- 2. scenarios (one at a time) ----------------
  function scenarios() {
    enterSection(1);
    var list = shuffle(P.sjt), i = 0;
    show();
    function show() {
      if (i >= list.length) return tray();
      var s = list[i], t0 = Date.now(), pick = null;
      frame(1,
        '<p class="dim small">Scenario ' + (i + 1) + " of " + list.length + "</p>" +
        '<div class="qcard protect"><p class="qtext"></p><p class="dim small">Pick what you would actually do.</p><div class="qopts" role="radiogroup"></div>' +
        '<div class="qfoot"><span></span><button class="btn primary" disabled>Next</button></div></div>');
      $(".qtext").textContent = s.q;
      shuffle(Object.keys(s.o)).forEach(function (k) {
        var b = el('<button type="button" class="qopt" role="radio" aria-checked="false"></button>');
        b.textContent = s.o[k];
        b.onclick = function () { pick = k; document.querySelectorAll(".qopt").forEach(function (x) { x.setAttribute("aria-checked", x === b); }); $(".qfoot .btn").disabled = false; };
        $(".qopts").appendChild(b);
      });
      $(".qfoot .btn").onclick = function () { A.sjt[s.id] = pick; T.sjt_s[s.id] = Math.round((Date.now() - t0) / 100) / 10; i++; show(); };
    }
  }

  // ---------------- 3. in-tray simulation ----------------
  function tray() {
    enterSection(2);
    var TR = P.tray, t0 = Date.now(), done = {}, current = null, over = false;
    frame(2,
      '<div class="tray-intro"><p></p><div class="tray-clock"><span class="mono" id="clock"></span><div class="qbar"><i id="clockbar"></i></div></div></div>' +
      '<div class="tray">' +
        '<nav class="inbox" aria-label="Inbox">' + TR.items.map(function (it) {
          return '<button type="button" class="mail" data-id="' + it.id + '"><span class="from"></span><span class="subj"></span><span class="mstate mono">New</span></button>';
        }).join("") + "</nav>" +
        '<section class="mailview" aria-live="polite"><p class="dim">Open an item from the inbox.</p></section>' +
      "</div>" +
      '<div class="step-actions"><button class="btn primary" id="tray-done" disabled>Finish this section</button></div>');
    $(".tray-intro p").textContent = TR.intro;
    TR.items.forEach(function (it) {
      var b = document.querySelector('.mail[data-id="' + it.id + '"]');
      $(".from", b).textContent = it.from; $(".subj", b).textContent = it.subject;
      b.onclick = function () { open(it); };
    });
    function log(item, action) { A.tray.events.push({ t: Math.round((Date.now() - t0) / 100) / 10, item: item, action: action }); }

    var end = t0 + TR.seconds * 1000;
    var h = setInterval(function () {
      var left = (end - Date.now()) / 1000;
      $("#clock").textContent = fmt(left) + " left";
      $("#clockbar").style.width = Math.max(0, 100 * left / TR.seconds) + "%";
      if (left <= 60) $("#clockbar").classList.add("low");
      if (left <= 0) { clearInterval(h); finish(true); }
    }, 250);

    function open(it) {
      if (over) return;
      current = it.id;
      log(it.id, "open");
      document.querySelectorAll(".mail").forEach(function (m) { m.classList.toggle("on", m.dataset.id === it.id); });
      var v = $(".mailview");
      v.innerHTML =
        '<div class="mail-head"><strong></strong><span class="dim"></span></div><p class="mail-body"></p>' +
        (it.ai ? '<div class="ai-box"><span class="mono kicker">Firm Assistant draft</span><p></p></div>' : "") +
        (it.status ? '<div class="status-box"><p class="s-firm"></p><p class="s-quick"></p></div>' : "") +
        (it.tools ? '<div class="tool-row"></div><div class="tool-out" aria-live="polite"></div>' : "") +
        '<fieldset class="mail-choices"><legend>What do you do?</legend></fieldset>' +
        (it.also ? '<label class="opt-line also"><input type="checkbox" id="also"> <span></span></label>' : "") +
        '<div class="step-actions"><button class="btn primary" id="handled" disabled>Done with this item</button></div>';
      $(".mail-head strong", v).textContent = it.subject; $(".mail-head span", v).textContent = "From: " + it.from;
      $(".mail-body", v).textContent = it.body;
      if (it.ai) $(".ai-box p", v).textContent = it.ai;
      if (it.status) { $(".s-firm", v).textContent = it.status.firm; $(".s-quick", v).textContent = it.status.quick; }
      if (it.also) $(".also span", v).textContent = it.also;
      if (it.tools) {
        Object.keys(it.tools).forEach(function (k) {
          var tool = it.tools[k];
          var b = el('<button type="button" class="btn"></button>'); b.textContent = tool.label;
          b.onclick = function () {
            if (done[it.id]) return;
            b.disabled = true; log(it.id, k);
            if (k === "source") A.tray.opened_source = true;
            if (k === "ask") A.tray.asked_ai = true;
            var out = el('<div class="tool-result"><span class="dim">Working…</span></div>');
            $(".tool-out", v).appendChild(out);
            setTimeout(function () { out.textContent = tool.result; }, tool.wait * 1000);
          };
          $(".tool-row", v).appendChild(b);
        });
      }
      var pick = A.tray.outcome[it.id] || null;
      shuffle(Object.keys(it.choices)).forEach(function (k) {
        var l = el('<label class="opt-line"><input type="radio" name="ch"> <span></span></label>');
        $("span", l).textContent = it.choices[k];
        var inp = $("input", l); inp.value = k; inp.checked = pick === k; inp.disabled = !!done[it.id];
        inp.onchange = function () { pick = k; $("#handled").disabled = false; };
        $(".mail-choices", v).appendChild(l);
      });
      var hb = $("#handled");
      if (done[it.id]) { hb.textContent = "Handled"; hb.disabled = true; if ($("#also")) { $("#also").checked = A.tray.logged_near_miss; $("#also").disabled = true; } return; }
      hb.onclick = function () {
        A.tray.outcome[it.id] = pick; done[it.id] = true; log(it.id, "decide:" + pick);
        if (it.also) A.tray.logged_near_miss = $("#also").checked;
        var m = document.querySelector('.mail[data-id="' + it.id + '"]');
        m.classList.add("handled"); $(".mstate", m).textContent = "Handled";
        var nextIt = TR.items.filter(function (x) { return !done[x.id]; })[0];
        if (nextIt) open(nextIt); else { $(".mailview").innerHTML = '<p class="dim">All three items handled.</p>'; }
        $("#tray-done").disabled = Object.keys(done).length < TR.items.length;
      };
    }
    $("#tray-done").onclick = function () { finish(false); };
    function finish(timedOut) {
      if (over) return; over = true; clearInterval(h);
      A.tray.seconds = Math.round((Date.now() - t0) / 1000);
      A.tray.timed_out = timedOut;
      if (timedOut) {
        frame(2, '<div class="card-msg"><h2>Time’s up</h2><p class="muted">Items you didn’t get to are recorded as not handled. That’s fine; carry on.</p><div class="step-actions"><button class="btn primary" id="next">Continue</button></div></div>');
        $("#next").onclick = pairs;
      } else pairs();
    }
  }

  // ---------------- 4. working preferences (forced choice) ----------------
  function pairs() {
    enterSection(3);
    var list = shuffle(P.pairs), i = 0;
    show();
    function show() {
      if (i >= list.length) return facts();
      var p = list[i], sides = shuffle(["a", "b"]);
      frame(3,
        '<p class="dim small">' + (i + 1) + " of " + list.length + '</p><h2 class="step-title">Which is more like you?</h2>' +
        '<p class="dim">Both can be true. Pick the one that fits you better.</p><div class="pair"></div>');
      sides.forEach(function (k) {
        var b = el('<button type="button" class="pair-btn"></button>'); b.textContent = p[k];
        b.onclick = function () { A.pairs[p.id] = k; i++; show(); };
        $(".pair").appendChild(b);
      });
    }
  }

  // ---------------- 5. quick facts with confidence ----------------
  function facts() {
    enterSection(4);
    var list = shuffle(P.facts), i = 0;
    show();
    function show() {
      if (i >= list.length) return habits();
      var f = list[i], v = null, c = null;
      frame(4,
        '<p class="dim small">' + (i + 1) + " of " + list.length + '</p>' +
        '<div class="qcard protect"><p class="qtext"></p>' +
          '<div class="tf"><button type="button" class="qopt" data-v="true">True</button><button type="button" class="qopt" data-v="false">False</button></div>' +
          '<div class="qconf"><span class="dim">How sure are you?</span><div class="conf-row"></div></div>' +
          '<div class="qfoot"><span></span><button class="btn primary" disabled>Next</button></div></div>');
      $(".qtext").textContent = f.s;
      var next = $(".qfoot .btn");
      document.querySelectorAll(".tf .qopt").forEach(function (b) {
        b.onclick = function () { v = b.dataset.v === "true"; document.querySelectorAll(".tf .qopt").forEach(function (x) { x.setAttribute("aria-checked", x === b); }); next.disabled = c === null; };
      });
      P.confidence.forEach(function (n) {
        var b = el('<button type="button" class="chip" aria-pressed="false">' + n + "%</button>");
        b.onclick = function () { c = n; document.querySelectorAll(".conf-row .chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); next.disabled = v === null; };
        $(".conf-row").appendChild(b);
      });
      next.onclick = function () { A.facts[f.id] = { v: v, c: c }; i++; show(); };
    }
  }

  // ---------------- 6. habits ----------------
  function habits() {
    enterSection(5);
    frame(5,
      '<p class="dim">How often is each of these true for you?</p><div class="likert-list"></div>' +
      '<p class="form-err" id="err"></p><div class="step-actions"><button class="btn primary" id="submit">Submit</button></div>');
    P.habits.forEach(function (h) {
      var row = el('<fieldset class="likert-row"><legend></legend><div class="likert"></div></fieldset>');
      $("legend", row).textContent = h.s;
      P.scales[h.scale].forEach(function (lab, n) {
        var l = el('<label><input type="radio" name="' + h.id + '" value="' + (n + 1) + '"><span></span></label>');
        $("span", l).textContent = lab;
        $(".likert", row).appendChild(l);
      });
      $(".likert-list").appendChild(row);
    });
    $("#submit").onclick = function () {
      var miss = P.habits.filter(function (h) { return !document.querySelector("[name=" + h.id + "]:checked"); });
      if (miss.length) { $("#err").textContent = "Please answer every statement."; return; }
      P.habits.forEach(function (h) { A.habits[h.id] = +document.querySelector("[name=" + h.id + "]:checked").value; });
      enterSection(6);
      T.total_s = Math.round((Date.now() - started) / 1000);
      var btn = this; btn.disabled = true; btn.textContent = "Sending…";
      RX.call("rx_profile_submit", { p_profile: profileId, p_answers: A, p_telemetry: T }).then(thanks, function (e) {
        btn.disabled = false; btn.textContent = "Submit"; $("#err").textContent = e.message;
      });
    };
  }

  function thanks() {
    frame(-1,
      '<div class="card-msg"><span class="mono kicker">Done</span><h2>Thank you</h2>' +
      '<p class="muted">Your responses have been recorded. Your firm’s AI Governance Lead will receive feedback, and Rudra-X AI uses it to tailor your training.</p>' +
      '<div class="step-actions"><a class="btn primary" href="index.html">Back to the portal</a></div></div>');
  }

  intro();
})();
