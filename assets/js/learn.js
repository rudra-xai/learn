// Module flow: Watch (with checkpoints) -> Read (timed pages + question)
// -> Apply (timed task) -> Check (5 timed questions). Answers are marked by
// the server; this file never knows the right answers in advance.
(function () {
  "use strict";
  var U, RX = window.RX;
  var CHECKPOINT_S = 25, READING_Q_S = 45, QUIZ_S = 45, PAGE_MIN_S = 20;

  function $(s, r) { return (r || document).querySelector(s); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  // A countdown that drives a bar and calls done() once at zero.
  function timer(seconds, bar, label, done) {
    var end = Date.now() + seconds * 1000, fired = false;
    var h = setInterval(tick, 200);
    function tick() {
      var left = (end - Date.now()) / 1000;
      if (bar) bar.style.width = Math.max(0, 100 * left / seconds) + "%";
      if (label) label.textContent = fmt(left);
      if (left <= 10 && bar) bar.classList.add("low");
      if (left <= 0 && !fired) { fired = true; clearInterval(h); done(); }
    }
    tick();
    return { stop: function () { fired = true; clearInterval(h); }, elapsed: function () { return seconds - (end - Date.now()) / 1000; } };
  }

  // Telemetry for the attempt: leaving the page, copying.
  var tel = { hidden_count: 0, hidden_ms: 0, copy_attempts: 0, started: Date.now() };
  var hiddenAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { tel.hidden_count++; hiddenAt = Date.now(); }
    else if (hiddenAt) { tel.hidden_ms += Date.now() - hiddenAt; hiddenAt = 0; }
  });
  document.addEventListener("copy", function () { tel.copy_attempts++; });

  // A multiple-choice card. onAnswer(optionId|null, ms, confidence) is called once.
  function choiceCard(host, item, opts) {
    opts = opts || {};
    var who = RX.me() || {};
    var card = el(
      '<div class="qcard protect">' +
        '<div class="qhead"><span class="mono kicker">' + U.esc(opts.label || "") + '</span><span class="qtime mono"></span></div>' +
        '<div class="qbar"><i></i></div>' +
        '<p class="qtext"></p>' +
        '<div class="qopts" role="radiogroup"></div>' +
        (opts.confidence ? '<div class="qconf"><span class="dim">How sure are you?</span><div class="conf-row"></div></div>' : "") +
        '<div class="qfoot"><span class="dim small qnote">' + U.esc(opts.note || "") + '</span><button class="btn primary" disabled>Submit</button></div>' +
        '<div class="qwm" aria-hidden="true">' + U.esc((who.name || "") + " · " + (who.email || "")) + "</div>" +
      "</div>");
    $(".qtext", card).textContent = item.q;
    var chosen = null, conf = null, t0 = Date.now(), done = false;
    var list = $(".qopts", card);
    item.options.forEach(function (o) {
      var b = el('<button type="button" class="qopt" role="radio" aria-checked="false"></button>');
      b.textContent = o.text; b.dataset.id = o.id;
      b.onclick = function () {
        if (done) return;
        chosen = o.id;
        list.querySelectorAll(".qopt").forEach(function (x) { x.setAttribute("aria-checked", x === b); });
        ready();
      };
      list.appendChild(b);
    });
    if (opts.confidence) {
      [50, 60, 70, 80, 90, 100].forEach(function (c) {
        var b = el('<button type="button" class="chip" aria-pressed="false">' + c + "%</button>");
        b.onclick = function () { if (done) return; conf = c; card.querySelectorAll(".conf-row .chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); ready(); };
        $(".conf-row", card).appendChild(b);
      });
    }
    var submit = $(".qfoot .btn", card);
    function ready() { submit.disabled = !chosen || (opts.confidence && conf === null); }
    function finish(timedOut) {
      if (done) return; done = true; tm.stop();
      submit.disabled = true;
      card.classList.add("locked");
      if (timedOut) $(".qnote", card).textContent = "Time’s up.";
      opts.onAnswer(timedOut ? null : chosen, Date.now() - t0, conf, card);
    }
    submit.onclick = function () { finish(false); };
    host.innerHTML = ""; host.appendChild(card);
    var tm = timer(opts.seconds || 30, $(".qbar i", card), $(".qtime", card), function () { finish(true); });
    return card;
  }

  // Show server feedback on a choice card.
  function showFeedback(card, res) {
    card.querySelectorAll(".qopt").forEach(function (b) {
      if (b.dataset.id === res.key) b.classList.add("right");
      else if (b.getAttribute("aria-checked") === "true") b.classList.add("wrong");
    });
    var fb = el('<div class="feedback ' + (res.correct ? "ok" : "no") + '"><strong>' + (res.correct ? "Correct." : "Not quite.") + "</strong> </div>");
    fb.appendChild(document.createTextNode(res.explain || ""));
    card.appendChild(fb);
  }

  function start(m) {
    U = window.RXUI;
    var main = $("#main");
    var who = RX.me();
    main.innerHTML =
      '<div class="wrap">' +
        '<p class="crumb"><a href="index.html">All modules</a> / ' + U.esc(m.label) + "</p>" +
        '<div class="page-head"><div><span class="mono kicker">' + U.esc(m.label) + " · about " + (m.minutes + 8) + ' min</span><h1></h1><p class="muted"></p></div>' +
        '<div class="who-chip"></div></div>' +
        '<ol class="stepper" aria-label="Module steps">' +
          '<li data-step="watch"><span>1</span>Watch</li><li data-step="read"><span>2</span>Read</li>' +
          '<li data-step="apply"><span>3</span>Apply</li><li data-step="check"><span>4</span>Check</li>' +
        "</ol>" +
        '<div id="stage-host"></div>' +
      "</div>";
    $(".page-head h1", main).textContent = m.title;
    $(".page-head p", main).textContent = m.summary;
    renderWho();

    function renderWho() {
      var w = RX.me();
      $(".who-chip", main).innerHTML = w ? '<span>' + U.esc(w.name) + " · " + U.esc(w.firm) + '</span><button class="linkbtn" type="button">Not you?</button>' : "";
      var b = $(".who-chip button", main);
      if (b) b.onclick = function () { RX.forget(); location.reload(); };
    }
    function step(name) {
      var order = ["watch", "read", "apply", "check"], at = order.indexOf(name);
      main.querySelectorAll(".stepper li").forEach(function (li) {
        var i = order.indexOf(li.dataset.step);
        li.className = i < at ? "done" : i === at ? "on" : "";
      });
      window.scrollTo({ top: 0 });
    }
    var host = $("#stage-host", main);

    function fail(e) {
      host.innerHTML = '<div class="card-msg"><h2>Something went wrong</h2><p class="muted"></p><p><a class="btn" href="index.html">Back to modules</a></p></div>';
      $(".card-msg p", host).textContent = e.message;
    }

    RX.ensure("Modules unlock in order, and your results are recorded for your firm’s training records.")
      .then(function () { renderWho(); return RX.call("rx_module_start", { p_person: RX.me().person, p_module: m.id }); })
      .then(run, function (e) {
        if (e.message === "cancelled") { location.href = "index.html"; return; }
        if (/previous module/.test(e.message)) {
          host.innerHTML = '<div class="card-msg"><span class="mono kicker">Locked</span><h2>Finish the previous module first</h2><p class="muted">Modules unlock one at a time, in order.</p><p><a class="btn primary" href="index.html">See your modules</a></p></div>';
          return;
        }
        if (/Unknown person/.test(e.message)) { RX.forget(); location.reload(); return; }
        fail(e);
      });

    function run(A) {
      watch();

      // ---------------- 1. WATCH ----------------
      function watch() {
        step("watch");
        host.innerHTML =
          '<div class="stage protect">' +
            '<video id="v" controls controlslist="nodownload noremoteplayback noplaybackrate" disablepictureinpicture disableremoteplayback playsinline preload="metadata" poster="' + U.slideSrc(m.slides.deck, m.slides.from) + '" crossorigin="anonymous">' +
              '<track kind="captions" srclang="en" label="English" src="media/video/' + m.id + '/captions.vtt">' +
            "</video>" +
            '<div class="wm" aria-hidden="true">' + U.esc(RX.me().name) + " · View only</div>" +
            '<div class="cp-layer" hidden></div>' +
          "</div>" +
          '<div class="progress-line"><div class="bar"><i id="pbar"></i></div><span id="pstate"></span></div>' +
          '<p class="dim small">' + (A.replay ? "You’ve been through this module before, so you can skip around. The questions still appear." :
            "Watch the whole video. It pauses " + A.checkpoints.length + " times to ask about what was just said, with " + CHECKPOINT_S + " seconds to answer. Skipping ahead isn’t available the first time through.") + "</p>" +
          '<div class="step-actions"><button class="btn primary" id="to-read" disabled>Continue to reading</button></div>';

        var v = $("#v"), layer = $(".cp-layer"), pbar = $("#pbar"), pstate = $("#pstate"), next = $("#to-read");
        var src = "media/video/" + m.id + "/index.m3u8";
        if (window.Hls && window.Hls.isSupported()) { var hls = new window.Hls({ capLevelToPlayerSize: true }); hls.loadSource(src); hls.attachMedia(v); }
        else if (v.canPlayType("application/vnd.apple.mpegurl")) v.src = src;

        var furthest = 0, pending = A.checkpoints.slice(), asking = false, ended = false;
        function nextCp() { return pending[0]; }
        function paint() {
          if (!v.duration) return;
          pbar.style.width = Math.min(100, 100 * furthest / v.duration) + "%";
          var answered = A.checkpoints.length - pending.length;
          pstate.textContent = Math.round(100 * furthest / v.duration) + "% watched · " + answered + "/" + A.checkpoints.length + " questions";
          next.disabled = !(ended && !pending.length);
        }
        v.addEventListener("timeupdate", function () {
          var cp = nextCp();
          if (!v.seeking && v.currentTime > furthest && v.currentTime - furthest < 2) furthest = v.currentTime;
          if (cp && v.currentTime >= cp.at && !asking) ask(cp);
          paint();
        });
        v.addEventListener("seeking", function () {
          var cp = nextCp(), limit = A.replay ? Infinity : furthest + 1;
          if (cp && v.currentTime > cp.at + 0.5) limit = Math.min(limit, cp.at);   // never jump past an unanswered question
          // first time: back to the furthest point watched; replay: stop at the unanswered question
          if (v.currentTime > limit) v.currentTime = A.replay ? limit : Math.min(furthest, limit);
        });
        v.addEventListener("ratechange", function () { if (v.playbackRate > 1.25) v.playbackRate = 1.25; });
        v.addEventListener("play", function () { if (asking) v.pause(); });
        v.addEventListener("ended", function () { if (!pending.length) { ended = true; furthest = v.duration; paint(); } });

        function ask(cp) {
          asking = true; v.pause();
          if (document.fullscreenElement) document.exitFullscreen();
          layer.hidden = false;
          var idx = A.checkpoints.indexOf(cp) + 1;
          choiceCard(layer, cp, {
            label: "Checkpoint " + idx + " of " + A.checkpoints.length, seconds: CHECKPOINT_S,
            onAnswer: function (ans, ms, c, card) {
              RX.call("rx_answer", { p_attempt: A.attempt, p_item: cp.id, p_answer: ans, p_ms: ms }).then(function (res) {
                showFeedback(card, res);
                var go = el('<div class="step-actions"><button class="btn primary">Continue watching</button></div>');
                card.appendChild(go);
                $("button", go).focus();
                $("button", go).onclick = function () {
                  pending.shift(); asking = false; layer.hidden = true; layer.innerHTML = "";
                  if (v.ended || v.currentTime >= v.duration - 0.5) { ended = true; paint(); } else v.play();
                };
              }, fail);
            }
          });
        }
        next.onclick = read;
      }

      // ---------------- 2. READ ----------------
      function read() {
        step("read");
        var from = m.pages.from, to = m.pages.to, need = {};
        host.innerHTML =
          '<p class="notice">Read the handbook chapter for this module. Each page needs at least ' + PAGE_MIN_S + " seconds on screen; a question about a detail in these pages follows.</p>" +
          '<div class="read-track"><span id="read-state"></span><div class="bar"><i id="read-bar"></i></div></div>' +
          '<div class="pages protect" id="pages">' + U.pagesHtml(from, to) + "</div>" +
          '<div id="read-q"></div>';
        for (var n = from; n <= to; n++) need[n] = 0;
        var visible = {}, total = (to - from + 1) * PAGE_MIN_S;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { var p = +e.target.id.replace("page-", ""); visible[p] = e.intersectionRatio >= 0.35; });
        }, { threshold: [0, 0.35, 0.7] });
        host.querySelectorAll(".page").forEach(function (p) { io.observe(p); p.insertAdjacentHTML("beforeend", '<span class="page-tick" aria-hidden="true"></span>'); });
        var last = Date.now();
        var h = setInterval(function () {
          var dt = (Date.now() - last) / 1000; last = Date.now();
          if (document.hidden) return;
          var showing = Object.keys(visible).filter(function (k) { return visible[k]; });
          showing.forEach(function (k) { need[k] = Math.min(PAGE_MIN_S, need[k] + dt / showing.length); });
          var got = 0, all = true;
          Object.keys(need).forEach(function (k) {
            got += need[k];
            var full = need[k] >= PAGE_MIN_S; if (!full) all = false;
            var tick = document.querySelector("#page-" + k + " .page-tick"); if (tick) tick.classList.toggle("on", full);
          });
          $("#read-bar").style.width = (100 * got / total) + "%";
          $("#read-state").textContent = all ? "Reading complete" : "Keep reading: " + Object.keys(need).filter(function (k) { return need[k] >= PAGE_MIN_S; }).length + " of " + (to - from + 1) + " pages done";
          if (all) { clearInterval(h); io.disconnect(); question(); }
        }, 500);

        function question() {
          var q = $("#read-q");
          q.innerHTML = '<h2 class="step-title">One question on what you just read</h2><div></div>';
          q.scrollIntoView({ behavior: "smooth", block: "start" });
          choiceCard($("div", q), A.reading, {
            label: "Reading check", seconds: READING_Q_S, note: "You can scroll up to the pages.",
            onAnswer: function (ans, ms, c, card) {
              RX.call("rx_answer", { p_attempt: A.attempt, p_item: A.reading.id, p_answer: ans, p_ms: ms }).then(function (res) {
                showFeedback(card, res);
                var go = el('<div class="step-actions"><button class="btn primary">Continue to the task</button></div>');
                card.appendChild(go); $("button", go).onclick = apply;
              }, fail);
            }
          });
        }
      }

      // ---------------- 3. APPLY ----------------
      function apply() {
        step("apply");
        var T = A.task, answer, t0 = Date.now(), submitted = false;
        host.innerHTML =
          '<div class="task protect">' +
            '<div class="qhead"><span class="mono kicker">Task · ' + U.esc(T.title) + '</span><span class="qtime mono"></span></div>' +
            '<div class="qbar"><i></i></div>' +
            '<p class="task-brief"></p><div class="task-body"></div>' +
            '<div class="qfoot"><span class="dim small task-note"></span><button class="btn primary" id="task-submit">Submit</button></div>' +
          "</div>";
        $(".task-brief").textContent = T.brief;
        var body = $(".task-body"), note = $(".task-note");

        if (T.type === "sort") {
          answer = {};
          body.innerHTML = '<div class="sort-list"></div>';
          T.items.forEach(function (it) {
            var row = el('<div class="sort-row"><p></p><div class="sort-btns"></div></div>');
            $("p", row).textContent = it.text;
            T.buckets.forEach(function (b) {
              var btn = el('<button type="button" class="chip" aria-pressed="false"></button>');
              btn.textContent = b.text;
              btn.onclick = function () {
                if (submitted) return;
                answer[it.id] = b.id;
                row.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === btn); });
                row.classList.add("set"); count();
              };
              $(".sort-btns", row).appendChild(btn);
            });
            row.dataset.id = it.id;
            $(".sort-list").appendChild(row);
          });
          var count = function () { note.textContent = Object.keys(answer).length + " of " + T.items.length + " placed"; };
          count();
        } else if (T.type === "order") {
          var steps = T.steps.slice();
          var draw = function () {
            body.innerHTML = '<ol class="order-list"></ol>';
            steps.forEach(function (s, i) {
              var li = el('<li><span class="txt"></span><span class="order-btns"><button type="button" class="btn icon-btn" aria-label="Move up">↑</button><button type="button" class="btn icon-btn" aria-label="Move down">↓</button></span></li>');
              $(".txt", li).textContent = s.text;
              var ups = li.querySelectorAll("button");
              ups[0].disabled = i === 0; ups[1].disabled = i === steps.length - 1;
              ups[0].onclick = function () { if (submitted) return; steps.splice(i - 1, 0, steps.splice(i, 1)[0]); draw(); };
              ups[1].onclick = function () { if (submitted) return; steps.splice(i + 1, 0, steps.splice(i, 1)[0]); draw(); };
              li.dataset.id = s.id;
              $(".order-list").appendChild(li);
            });
          };
          draw();
          note.textContent = "Use the arrows to reorder.";
          answer = function () { return steps.map(function (s) { return s.id; }); };
        } else if (T.type === "hotspot") {
          var picked = [];
          body.innerHTML = '<div class="hot-doc"></div>';
          T.segments.forEach(function (s) {
            var span = el('<button type="button" class="seg" aria-pressed="false"></button>');
            span.textContent = s.text + " ";
            span.dataset.id = s.id;
            span.onclick = function () {
              if (submitted) return;
              var i = picked.indexOf(s.id);
              if (i > -1) picked.splice(i, 1); else picked.push(s.id);
              span.setAttribute("aria-pressed", i === -1);
              note.textContent = picked.length + " selected (find " + T.find + "). Wrong picks cost marks.";
            };
            $(".hot-doc").appendChild(span);
          });
          note.textContent = "0 selected (find " + T.find + "). Wrong picks cost marks.";
          answer = function () { return picked.slice(); };
        }

        var tm = timer(T.seconds, $(".task .qbar i"), $(".task .qtime"), function () { send(true); });
        $("#task-submit").onclick = function () { send(false); };

        function send(timedOut) {
          if (submitted) return; submitted = true; tm.stop();
          $("#task-submit").disabled = true;
          var payload = typeof answer === "function" ? answer() : answer;
          RX.call("rx_answer", { p_attempt: A.attempt, p_item: T.id, p_answer: payload, p_ms: Date.now() - t0 }).then(function (res) {
            // mark the right answers
            if (T.type === "sort") {
              host.querySelectorAll(".sort-row").forEach(function (row) {
                var right = res.key[row.dataset.id];
                row.querySelectorAll(".chip").forEach(function (c, i) {
                  var bid = T.buckets[i].id;
                  if (bid === right) c.classList.add("right");
                  else if (c.getAttribute("aria-pressed") === "true") c.classList.add("wrong");
                });
              });
            } else if (T.type === "order") {
              host.querySelectorAll(".order-list li").forEach(function (li, i) { li.classList.add(li.dataset.id === res.key[i] ? "right" : "wrong"); });
            } else {
              host.querySelectorAll(".seg").forEach(function (s) {
                var inKey = res.key.indexOf(s.dataset.id) > -1, chosen = s.getAttribute("aria-pressed") === "true";
                if (inKey) s.classList.add(chosen ? "right" : "missed"); else if (chosen) s.classList.add("wrong");
              });
            }
            var pct = Math.round(100 * res.score);
            var fb = el('<div class="feedback ' + (pct >= 60 ? "ok" : "no") + '"><strong>' + (timedOut ? "Time’s up. " : "") + "You scored " + pct + "%.</strong> </div>");
            fb.appendChild(document.createTextNode(res.explain || ""));
            $(".task").appendChild(fb);
            var go = el('<div class="step-actions"><button class="btn primary">Continue to the check</button></div>');
            $(".task").appendChild(go); $("button", go).onclick = check;
          }, fail);
        }
      }

      // ---------------- 4. CHECK ----------------
      function check() {
        step("check");
        host.innerHTML =
          '<div class="card-msg">' +
            '<span class="mono kicker">Final check</span><h2>' + A.quiz.length + " questions, " + QUIZ_S + " seconds each</h2>" +
            '<ul class="rules"><li>One question at a time, with no going back.</li><li>Say how sure you are for each answer.</li>' +
            "<li>You need " + Math.min(4, A.quiz.length) + " of " + A.quiz.length + " right, and 60% on the task, to pass.</li>" +
            "<li>Answer from what you’ve just learned. Leaving this page during the check is recorded.</li></ul>" +
            '<button class="btn primary" id="begin">Start the check</button>' +
          "</div>";
        $("#begin").onclick = function () { ask(0); };
        var qs = shuffle(A.quiz);
        function ask(i) {
          if (i >= qs.length) return finish();
          choiceCard(host, qs[i], {
            label: "Question " + (i + 1) + " of " + qs.length, seconds: QUIZ_S, confidence: true,
            onAnswer: function (ans, ms, conf) {
              RX.call("rx_answer", { p_attempt: A.attempt, p_item: qs[i].id, p_answer: ans, p_confidence: conf, p_ms: ms }).then(function () { ask(i + 1); }, fail);
            }
          });
        }
        function finish() {
          host.innerHTML = '<div class="card-msg"><p class="muted">Marking…</p></div>';
          tel.total_s = Math.round((Date.now() - tel.started) / 1000);
          RX.call("rx_module_finish", { p_attempt: A.attempt, p_telemetry: tel }).then(result, fail);
        }
      }

      function result(r) {
        var idx = U.modules.indexOf(m), nextM = U.modules[idx + 1];
        if (r.passed) {
          U.markPassed(m.id);
          main.querySelectorAll(".stepper li").forEach(function (li) { li.className = "done"; });
        }
        host.innerHTML =
          '<div class="card-msg result ' + (r.passed ? "pass" : "fail") + '">' +
            '<span class="mono kicker">' + (r.passed ? "Module complete" : "Not yet") + "</span>" +
            "<h2>" + (r.passed ? "You passed: " + r.score + "%" : r.too_fast ? "This attempt was too quick to count" : "You scored " + r.score + "%") + "</h2>" +
            "<p class=\"muted\">" + (r.passed ? "Your result has been recorded." :
              r.too_fast ? "The first time through, the module has to take at least as long as the video. Please go through it again." :
              "You got " + r.quiz_right + " of " + r.quiz_n + " questions and " + Math.round(r.task * 100) + "% on the task. Review the video and the handbook chapter, then try again. You’ll get different questions.") + "</p>" +
            '<ul class="review"></ul>' +
            '<div class="step-actions">' +
              (r.passed && nextM ? '<a class="btn primary" href="module.html?m=' + nextM.id + '">Next: ' + U.esc(nextM.label) + " →</a>" : "") +
              (!r.passed ? '<button class="btn primary" id="again">Try again</button>' : "") +
              '<a class="btn" href="index.html">All modules</a>' +
            "</div>" +
          "</div>";
        (r.review || []).forEach(function (x) {
          var li = el('<li class="' + (x.correct ? "ok" : "no") + '"><strong></strong><span></span></li>');
          $("strong", li).textContent = (x.correct ? "✓ " : "✗ ") + x.q;
          $("span", li).textContent = x.explain || (x.correct ? "" : "Review this point in the module.");
          $(".review", host).appendChild(li);
        });
        var again = $("#again");
        if (again) again.onclick = function () { location.reload(); };
      }
    }
  }

  window.RXLearn = { start: start };
})();
