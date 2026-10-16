(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var S = window.SomosState;

  /* ------------------------------------------------------------------
     Role data. Every card explains fit ("why this fits you") and gives
     honest cons ("things to consider") instead of a bare match percent,
     per the design spec. The reasoning is assembled from what THIS
     person said in Discovery — still scripted (no model behind it yet),
     but it never claims something they didn't tell us.
     ------------------------------------------------------------------ */
  function enjoyLine(p, words, tail, fallback) {
    for (var i = 0; i < p.enjoys.length; i++) {
      for (var j = 0; j < words.length; j++) {
        if (p.enjoys[i].indexOf(words[j]) > -1) return "You said you enjoy " + p.enjoys[i] + " — " + tail + ".";
      }
    }
    return fallback;
  }
  function bgLine(p, tail) {
    return p.bg
      ? "Your background in " + p.bg + " " + tail + "."
      : "Your past work experience " + tail + ".";
  }
  function codingNote(p) {
    var c = (S.data.discovery.answers.coding || [])[0];
    if (c === "Never tried it" || c === "A little curious") return "High coding intensity — you told us you’re “" + c.toLowerCase() + "” on code so far.";
    return "High coding intensity — expect to build real software, not just use tools.";
  }

  var ROLES = {
    "prod-ops": {
      name: "Product Operations Manager", fit: "Strong potential fit", level: "strong",
      why: function (p) { return [
        enjoyLine(p, ["organiz", "analyz"], "this role is built around exactly that", "Built around organizing work and analyzing information, with little or no coding."),
        bgLine(p, "maps directly to process work")
      ]; },
      consider: function () { return ["Some familiarity with tools like Jira and SQL will help early on."]; },
      chips: ["Coding: Low", "People: High", "Entry: Medium"]
    },
    "tpm": {
      name: "Technical Program Manager", fit: "Strong potential fit", level: "strong",
      why: function (p) { return [
        enjoyLine(p, ["people"], "heavy people-interaction is the job", "Heavy people-interaction and cross-team coordination at the center of the work."),
        bgLine(p, "rewards the coordination and documentation skills you’ve already built")
      ]; },
      consider: function () { return ["Entry bar is a bit higher — expect to learn technical vocabulary fast."]; },
      chips: ["Coding: Low–Medium", "People: Very High", "Entry: Medium–High"]
    },
    "platform": {
      name: "Platform Engineer", fit: "Strong potential fit", level: "strong",
      why: function () { return ["Strong demand and compensation if you end up enjoying hands-on building."]; },
      consider: function (p) { return [codingNote(p), "Longer runway before you’d feel job-ready (6–12 months)."]; },
      chips: ["Coding: High", "People: Medium", "Entry: High"]
    },
    "analyst": {
      name: "Business Analyst", fit: "Medium potential fit", level: "medium",
      why: function (p) { return [
        enjoyLine(p, ["analyz"], "it’s the core of the role", "Analyzing information is the core of the role."),
        "Research and documentation habits carry over well."
      ]; },
      consider: function () { return ["Less hands-on people coordination than Product Operations."]; },
      chips: ["Coding: Low", "People: Medium", "Entry: Medium"]
    },
    "csm": {
      name: "Customer Success Manager", fit: "Medium potential fit", level: "medium",
      why: function (p) { return [
        enjoyLine(p, ["people"], "it’s at the center of the role", "Working with people is at the center of the role."),
        bgLine(p, "suggests you already know how to help people who are stuck")
      ]; },
      consider: function () { return ["Less analytical depth day to day, and quota-style targets are common."]; },
      chips: ["Coding: None", "People: Very High", "Entry: Low"]
    },
    "ux": {
      name: "UX Researcher", fit: "Lower potential fit", level: "lower",
      why: function (p) { return [
        enjoyLine(p, ["research"], "research is the heart of this role", "A genuine head start if you enjoy research and digging into how people behave.")
      ]; },
      consider: function () { return [
        "Portfolio-driven hiring — you’d need to build case studies first.",
        "Fewer entry-level openings than the other roles here."
      ]; },
      chips: ["Coding: Low", "People: High", "Entry: High"]
    }
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
    var p = S.persona();
    var st = S.data.compare;
    var isPrimary = mode === "primary";
    var card = el("article", "role-card" + (isPrimary ? " is-primary" : ""));
    card.dataset.role = id;
    if (isPrimary) card.id = "goal";
    if (!reduceMotion) card.style.animationDelay = (index * 0.07) + "s";

    var tag = "";
    if (mode === "primary") tag = '<span class="role-tag role-tag--primary">' + (st.goalConfirmed ? "YOUR GOAL" : "PRIMARY") + '</span>';
    else if (mode === "exploring") tag = '<span class="role-tag role-tag--exploring">EXPLORING</span>';

    var actions;
    if (isPrimary) {
      actions = st.goalConfirmed
        ? '<button type="button" class="role-btn role-btn--primary" disabled>✓ Your goal</button>'
        : '<button type="button" class="role-btn role-btn--primary" data-act="goal">Make this my goal</button>' +
          '<span class="role-hint">You can change it any time.</span>';
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
      '<div class="role-section"><div class="role-section-label">WHY THIS FITS YOU</div>' + points(r.why(p), "why", "✓") + '</div>' +
      '<div class="role-section"><div class="role-section-label">THINGS TO CONSIDER</div>' + points(r.consider(p), "consider", "!") + '</div>' +
      '<div class="role-chips">' + r.chips.map(function (c) { return '<span class="role-chip">' + esc(c) + '</span>'; }).join("") + '</div>' +
      '<div class="role-actions">' + actions + '</div>';
    return card;
  }

  function renderSub() {
    var p = S.persona();
    var sub = document.getElementById("cmpSub");
    if (p.enjoys.length) {
      var two = p.enjoys.slice(0, 2).map(function (e) { return "<strong>" + esc(e) + "</strong>"; });
      sub.innerHTML = "Based on what you told us: you enjoy " + two.join(" and ") + ". You don&rsquo;t have to pick just one yet.";
    } else {
      sub.innerHTML = "These are general starting points. <a href=\"ai-discovery.html\" style=\"color:var(--teal);font-weight:600\">Answer AI Discovery</a> and the reasoning below will be about you, not a generic profile.";
    }
  }

  function render() {
    var state = S.data.compare;
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
    renderSub();
  }

  function remove(list, id) {
    var i = list.indexOf(id);
    if (i > -1) list.splice(i, 1);
  }

  /* Exploration should not feel like commitment: swapping primary never
     drops the old one — it just becomes an "exploring" role. Only
     "Make this my goal" commits, and even that can be changed later. */
  function onAction(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var id = btn.closest(".role-card").dataset.role;
    var act = btn.dataset.act;

    S.update(function (d) {
      var c = d.compare;
      if (act === "goal") {
        c.goalConfirmed = true;
      } else if (act === "primary") {
        remove(c.exploring, id);
        c.exploring.unshift(c.primary);
        c.primary = id;
        c.decisions++;
      } else if (act === "remove") {
        remove(c.exploring, id);
        c.more.unshift(id);
        c.decisions++;
      } else if (act === "add") {
        remove(c.more, id);
        c.exploring.push(id);
        c.decisions++;
      }
    });
    if (act === "primary" && window.SomosToast) {
      window.SomosToast("Primary path updated", ROLES[id].name + " is now your primary path. Nothing else was reset.");
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
