(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Role data. Every card explains fit ("why this fits you") and gives
     honest cons ("things to consider") instead of a bare match percent,
     per the design spec. Scripted content — no model behind it yet.
     ------------------------------------------------------------------ */
  var ROLES = {
    "prod-ops": {
      name: "Product Operations Manager", fit: "Strong potential fit", level: "strong",
      why: [
        "You said you enjoy organizing and analyzing — this role is built around both.",
        "Your lab/clinic coordination experience maps directly to process work."
      ],
      consider: ["Some familiarity with tools like Jira and SQL will help early on."],
      chips: ["Coding: Low", "People: High", "Entry: Medium"]
    },
    "tpm": {
      name: "Technical Program Manager", fit: "Strong potential fit", level: "strong",
      why: [
        "Heavy people-interaction, which matches what you told us you enjoy.",
        "Rewards the coordination and documentation skills from your background."
      ],
      consider: ["Entry bar is a bit higher — expect to learn technical vocabulary fast."],
      chips: ["Coding: Low–Medium", "People: Very High", "Entry: Medium–High"]
    },
    "platform": {
      name: "Platform Engineer", fit: "Strong potential fit", level: "strong",
      why: ["Strong demand and compensation if you end up enjoying hands-on building."],
      consider: [
        "High coding intensity — you mentioned little interest in programming so far.",
        "Longer runway before you’d feel job-ready (6–12 months)."
      ],
      chips: ["Coding: High", "People: Medium", "Entry: High"]
    },
    "analyst": {
      name: "Business Analyst", fit: "Medium potential fit", level: "medium",
      why: [
        "Analyzing information is one of the things you said you enjoy most.",
        "Research and documentation from lab work carry over well."
      ],
      consider: ["Less hands-on people coordination than Product Operations."],
      chips: ["Coding: Low", "People: Medium", "Entry: Medium"]
    },
    "csm": {
      name: "Customer Success Manager", fit: "Medium potential fit", level: "medium",
      why: [
        "Working with people is at the center of the role.",
        "Clinic experience means you already handle people who need help."
      ],
      consider: ["Less analytical depth day to day, and quota-style targets are common."],
      chips: ["Coding: None", "People: Very High", "Entry: Low"]
    },
    "ux": {
      name: "UX Researcher", fit: "Lower potential fit", level: "lower",
      why: ["Your research background is a genuine head start."],
      consider: [
        "Portfolio-driven hiring — you’d need to build case studies first.",
        "Fewer entry-level openings than the other roles here."
      ],
      chips: ["Coding: Low", "People: High", "Entry: High"]
    }
  };

  var state = {
    primary: "prod-ops",
    exploring: ["tpm", "platform"],   // ordered; excludes primary
    more: ["analyst", "csm", "ux"]    // everything not currently compared
  };

  var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle><circle cx="12" cy="12" r="0.7" fill="currentColor"></circle></svg>';

  var grid = document.getElementById("cmpGrid");
  var moreGrid = document.getElementById("moreGrid");

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function points(list, kind, mark) {
    return list.map(function (t) {
      return '<div class="role-point role-point--' + kind + '"><i>' + mark + '</i><span>' + esc(t) + '</span></div>';
    }).join("");
  }

  function buildCard(id, mode, index) {
    var r = ROLES[id];
    var isPrimary = mode === "primary";
    var card = el("article", "role-card" + (isPrimary ? " is-primary" : ""));
    card.dataset.role = id;
    if (!reduceMotion) card.style.animationDelay = (index * 0.07) + "s";

    var tag = "";
    if (mode === "primary") tag = '<span class="role-tag role-tag--primary">PRIMARY</span>';
    else if (mode === "exploring") tag = '<span class="role-tag role-tag--exploring">EXPLORING</span>';

    var actions;
    if (isPrimary) {
      actions = '<button type="button" class="role-btn role-btn--primary" disabled>Primary path</button>';
    } else if (mode === "exploring") {
      actions =
        '<button type="button" class="role-btn" data-act="primary">Set as primary</button>' +
        '<button type="button" class="role-link" data-act="remove">Not for me</button>';
    } else {
      actions = '<button type="button" class="role-btn" data-act="add">Add to compare</button>';
    }

    card.innerHTML =
      '<div class="role-head"><span class="role-icon">' + ICON + '</span><span class="role-name">' + esc(r.name) + '</span></div>' +
      '<div class="role-fitrow"><span class="role-fit is-' + r.level + '">' + r.fit + '</span>' + tag + '</div>' +
      '<div class="role-section"><div class="role-section-label">WHY THIS FITS YOU</div>' + points(r.why, "why", "✓") + '</div>' +
      '<div class="role-section"><div class="role-section-label">THINGS TO CONSIDER</div>' + points(r.consider, "consider", "!") + '</div>' +
      '<div class="role-chips">' + r.chips.map(function (c) { return '<span class="role-chip">' + esc(c) + '</span>'; }).join("") + '</div>' +
      '<div class="role-actions">' + actions + '</div>';
    return card;
  }

  function render() {
    grid.innerHTML = "";
    grid.appendChild(buildCard(state.primary, "primary", 0));
    state.exploring.forEach(function (id, i) { grid.appendChild(buildCard(id, "exploring", i + 1)); });

    moreGrid.innerHTML = "";
    if (!state.more.length) {
      moreGrid.appendChild(el("p", "cmp-more-empty", "Every role we found is already in your comparison."));
    }
    state.more.forEach(function (id, i) { moreGrid.appendChild(buildCard(id, "more", i)); });

    document.getElementById("summaryPrimary").textContent = ROLES[state.primary].name;
    document.getElementById("summaryExploring").textContent =
      state.exploring.length ? state.exploring.map(function (id) { return ROLES[id].name; }).join(" · ") : "Nothing yet";
  }

  function remove(list, id) {
    var i = list.indexOf(id);
    if (i > -1) list.splice(i, 1);
  }

  /* Exploration should not feel like commitment: swapping primary never
     drops the old one — it just becomes an "exploring" role. */
  function onAction(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var id = btn.closest(".role-card").dataset.role;
    var act = btn.dataset.act;

    if (act === "primary") {
      remove(state.exploring, id);
      state.exploring.unshift(state.primary);
      state.primary = id;
      window.SomosToast && window.SomosToast("Primary path updated", ROLES[id].name + " is now your primary path. Nothing else was reset.");
    } else if (act === "remove") {
      remove(state.exploring, id);
      state.more.unshift(id);
    } else if (act === "add") {
      remove(state.more, id);
      state.exploring.push(id);
    }
    render();
  }

  grid.addEventListener("click", onAction);
  moreGrid.addEventListener("click", onAction);

  /* ------------------------------------------------------------------
     Collapsibles
     ------------------------------------------------------------------ */
  function wireToggle(btnId, bodyId) {
    var btn = document.getElementById(btnId);
    var body = document.getElementById(bodyId);
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      body.hidden = open;
    });
  }
  wireToggle("moreToggle", "moreBody");
  wireToggle("fbToggle", "fbBody");

  /* ------------------------------------------------------------------
     "Think we got you wrong?" — scripted replies. The AI either
     explains why a result still holds or offers to adjust, never just
     silently reshuffles.
     ------------------------------------------------------------------ */
  var fbLog = document.getElementById("fbLog");
  var fbInput = document.getElementById("fbInput");
  var fbSend = document.getElementById("fbSend");
  var busy = false;

  function reply(text) {
    var t = text.toLowerCase();
    if (/cod|program|engineer|technical|math/.test(t)) {
      return "Fair concern. “Coding: Low” on Product Operations means occasional light scripting or spreadsheet formulas — not building software. Platform Engineer really is code-heavy, so if that’s a dealbreaker I’d keep it as “exploring” rather than primary, or drop it with “Not for me” and I’ll lean toward the lower-coding roles under “See more results.”";
    }
    if (/people|talk|social|customer|introvert/.test(t)) {
      return "Thanks — that changes the picture. Roles like Business Analyst weigh analysis more than constant people-contact. Open “See more results” and add it to compare if you’d like to see it next to your current picks.";
    }
    if (/pay|salary|money|stab/.test(t)) {
      return "Good to know. Compensation varies a lot by company, so I won’t pretend to a number here — but Platform Engineer and Technical Program Manager tend to sit higher than Product Operations early on, with a longer runway to get there.";
    }
    return "Got it — thanks for pushing back. Nothing here is locked in: you can swap your primary path, drop any role with “Not for me,” or add others from “See more results.” Tell me a bit more about what feels off and I’ll explain the reasoning or adjust.";
  }

  function addMsg(kind, text) {
    var m = el("div", "cmp-fb-msg cmp-fb-msg--" + kind);
    m.textContent = text;
    fbLog.appendChild(m);
  }

  function sendFb() {
    var text = fbInput.value.trim();
    if (!text || busy) return;
    busy = true;
    fbSend.disabled = true;
    addMsg("user", text);
    fbInput.value = "";
    setTimeout(function () {
      addMsg("ai", reply(text));
      busy = false;
      fbSend.disabled = false;
    }, reduceMotion ? 50 : 700);
  }
  fbSend.addEventListener("click", sendFb);
  fbInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); sendFb(); }
  });

  render();
})();
