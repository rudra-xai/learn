// Talks to the database (Supabase RPC) and remembers who is learning on this device.
(function () {
  "use strict";
  var cfg = window.RX_API || {};
  // ?api=local points the page at the local test server (learn-admin: npm run local-api)
  try {
    var qs = new URLSearchParams(location.search).get("api");
    if (qs === "local") sessionStorage.setItem("rx.api", "local");
    if (qs === "live") sessionStorage.removeItem("rx.api");
    if (sessionStorage.getItem("rx.api") === "local") cfg = { url: "http://localhost:54321", key: "local" };
  } catch (e) { /* storage unavailable */ }

  function call(fn, args) {
    return fetch(cfg.url.replace(/\/$/, "") + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: cfg.key, Authorization: "Bearer " + cfg.key },
      body: JSON.stringify(args || {})
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (body) {
        if (!r.ok) throw new Error((body && body.message) || "The server didn’t respond. Please try again.");
        return body;
      });
    }, function () { throw new Error("Can’t reach the server. Check your connection and try again."); });
  }

  function load() { try { return JSON.parse(localStorage.getItem("rx.me")); } catch (e) { return null; } }
  function save(me) { try { localStorage.setItem("rx.me", JSON.stringify(me)); } catch (e) { /* ignore */ } }
  function forget() { try { localStorage.removeItem("rx.me"); } catch (e) { /* ignore */ } }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // Modal asking for name, work email and firm code. Resolves with the identity.
  function identify(reason) {
    return new Promise(function (resolve, reject) {
      var me = load() || {};
      var wrap = document.createElement("div");
      wrap.className = "modal-back";
      wrap.innerHTML =
        '<form class="modal" role="dialog" aria-modal="true" aria-labelledby="id-title" novalidate>' +
          '<span class="mono kicker">Before you start</span>' +
          '<h2 id="id-title">Who’s taking this?</h2>' +
          '<p class="muted">' + esc(reason || "Your progress and results are recorded against your name and firm.") + "</p>" +
          '<label>Full name<input name="name" autocomplete="name" required value="' + esc(me.name || "") + '"></label>' +
          '<label>Work email<input name="email" type="email" autocomplete="email" required value="' + esc(me.email || "") + '"></label>' +
          '<label>Firm code<input name="code" autocomplete="off" required placeholder="From your AI Governance Lead" style="text-transform:uppercase"></label>' +
          '<p class="form-err" role="alert"></p>' +
          '<div class="modal-actions"><button type="button" class="btn" data-cancel>Cancel</button><button class="btn primary">Continue</button></div>' +
        "</form>";
      document.body.appendChild(wrap);
      var form = wrap.querySelector("form"), err = wrap.querySelector(".form-err");
      form.querySelector(me.name ? "[name=code]" : "[name=name]").focus();
      wrap.querySelector("[data-cancel]").onclick = function () { wrap.remove(); reject(new Error("cancelled")); };
      form.onsubmit = function (e) {
        e.preventDefault();
        var btn = form.querySelector(".primary");
        btn.disabled = true; err.textContent = "";
        call("rx_identify", { p_code: form.code.value, p_email: form.email.value, p_name: form.name.value }).then(function (r) {
          var who = { person: r.person, name: r.name, email: r.email, firm: r.firm.name, insured: r.firm.insured };
          save(who); wrap.remove(); resolve(who);
        }, function (e2) { err.textContent = e2.message; btn.disabled = false; });
      };
    });
  }

  window.RX = {
    enabled: !!cfg.url,
    call: call,
    me: load,
    forget: forget,
    identify: identify,
    // Use the remembered person if the server still knows them; otherwise ask again.
    ensure: function (reason) {
      var m = load();
      if (!m) return identify(reason);
      return call("rx_progress", { p_person: m.person }).then(function () { return m; }, function (e) {
        if (/Unknown person/.test(e.message)) { forget(); return identify(reason); }
        throw e;
      });
    }
  };
})();
