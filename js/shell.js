/* ==========================================================================
   Shared shell. Builds, on every page, from the one engine in state.js:
     - the progress card      ([data-prog-slot], top-right of the header)
     - the journey rail       (mini-map; replaces the old pill switcher)
     - the mode chip + menu   (example journey vs live demo, restart)
     - the start screen       (Map only, first visit of a tab session)
   ========================================================================== */
(function () {
  "use strict";

  var S = window.SomosState;
  if (!S) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  /* ------------------------------------------------------------------
     What each page is, in journey terms
     ------------------------------------------------------------------ */
  var NODES = [
    { key: "ai-discovery", label: "AI Discovery",       href: "ai-discovery.html",    pages: ["ai-discovery.html"] },
    { key: "compare",      label: "Explore & Compare",  href: "compare-careers.html", pages: ["compare-careers.html"] },
    { key: "goal",         label: "Choose your goal",   href: "compare-careers.html#goal", pages: [] },
    { key: "journey",      label: "My Career Journey",  href: "career-journey.html",  pages: ["career-journey.html"] },
    { key: "roadmap",      label: "Living Roadmap",     href: "living-roadmap.html",  pages: ["living-roadmap.html"], pctKey: "journey" },
    { key: "prepare",      label: "Prepare",            href: "prepare.html",         pages: ["prepare.html"] },
    { key: "practice",     label: "Practice",           href: "practice.html",        pages: ["practice.html"] },
    { key: "apply",        label: "Apply",              href: "apply.html",           pages: ["apply.html"] }
  ];
  var STEP_NAME = {
    "ai-discovery": "AI Discovery", "compare": "Compare", "goal": "Goal", "journey": "My Career Journey",
    "prepare": "Prepare", "practice": "Practice", "apply": "Apply"
  };

  function stepDetail(key) {
    switch (key) {
      case "ai-discovery": return S.answeredCount() + " of 5 questions answered";
      case "compare": return Math.min(S.data.compare.decisions, 2) + " of 2 decisions made";
      case "goal": return S.data.compare.goalConfirmed ? S.roleName() : "Not chosen yet";
      case "journey":
        var total = S.ITEMS.length, done = S.ITEMS.filter(function (i) { return S.data.items[i.id]; }).length;
        return done + " of " + total + " items done";
      case "prepare": return Math.round(S.pct("prepare") / 25) + " of 4 actions done";
      case "practice": return Math.round(S.pct("practice") / 20) + " of 5 steps done";
      case "apply": return Math.round(S.pct("apply") / 33.34) + " of 3 steps done";
    }
    return "";
  }

  /* Tween a number readout toward its new value. */
  function tween(el, to) {
    var from = Number(el.getAttribute("data-v"));
    if (isNaN(from)) from = 0;
    el.setAttribute("data-v", to);
    if (reduceMotion || from === to) { el.textContent = to + "%"; return; }
    var start = null, dur = 900;
    function tick(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      var e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      el.textContent = Math.round(from + (to - from) * e) + "%";
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     Progress card
     ------------------------------------------------------------------ */
  var C = 2 * Math.PI * 34;
  var slots = document.querySelectorAll("[data-prog-slot]");

  slots.forEach(function (slot) {
    var key = slot.getAttribute("data-stage");
    slot.classList.add("prog");
    slot.setAttribute("role", "group");
    slot.setAttribute("aria-label", "Your progress");
    slot.innerHTML =
      '<div class="prog-ring">' +
        '<svg width="76" height="76" viewBox="0 0 80 80" aria-hidden="true">' +
          '<circle cx="40" cy="40" r="34" fill="none" stroke="var(--card-2)" stroke-width="7"></circle>' +
          '<circle cx="40" cy="40" r="34" fill="none" stroke="var(--teal)" stroke-width="7" stroke-linecap="round" transform="rotate(-90 40 40)" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" data-ring></circle>' +
        '</svg><span class="prog-ring-val" data-ov>0%</span>' +
      '</div>' +
      '<div class="prog-body">' +
        '<div class="prog-label">Overall program</div>' +
        '<div class="prog-step"><span>' + STEP_NAME[key] + '</span><strong data-st>0%</strong></div>' +
        '<div class="prog-bar" aria-hidden="true"><i data-bar></i></div>' +
        '<div class="prog-sub" data-sub></div>' +
      '</div>';
  });

  function renderSlots() {
    var overall = S.overall;
    slots.forEach(function (slot) {
      var key = slot.getAttribute("data-stage");
      var step = S.pct(key);
      tween(slot.querySelector("[data-ov]"), overall);
      tween(slot.querySelector("[data-st]"), step);
      slot.querySelector("[data-ring]").style.strokeDashoffset = String(C * (1 - overall / 100));
      slot.querySelector("[data-bar]").style.width = step + "%";
      slot.querySelector("[data-sub]").textContent = stepDetail(key);
      slot.setAttribute("aria-label", "Overall program " + overall + " percent. " + STEP_NAME[key] + " " + step + " percent.");
    });
  }

  /* ------------------------------------------------------------------
     Journey rail (mini-map)
     ------------------------------------------------------------------ */
  var rail = null;
  var RC = 2 * Math.PI * 11;

  function currentKey() {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].pages.indexOf(file) > -1) return NODES[i].key;
    return null;
  }

  function buildRail() {
    if (file === "index.html" || file === "") return; // the Map is the full-size version of this
    var here = currentKey();
    rail = document.createElement("nav");
    rail.className = "rail";
    rail.setAttribute("aria-label", "Journey map");

    var items = '<li class="rail-node rail-map"><a href="index.html" aria-label="Back to the journey map">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8"></path><path d="M5 10v10h14V10"></path></svg>' +
      '<span class="rail-tip"><b>Journey map</b></span></a></li>';

    NODES.forEach(function (n) {
      var isHere = n.key === here || (here === "compare" && n.key === "goal" && false);
      items +=
        '<li class="rail-node' + (isHere ? " is-here" : "") + '" data-key="' + n.key + '">' +
          '<a href="' + n.href + '"' + (isHere ? ' aria-current="page"' : "") + '>' +
            '<svg class="rail-ring" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">' +
              '<circle class="rn-track" cx="15" cy="15" r="11" stroke-width="3"></circle>' +
              '<circle class="rn-fill" cx="15" cy="15" r="11" stroke-width="3" transform="rotate(-90 15 15)" stroke-dasharray="' + RC + '" stroke-dashoffset="' + RC + '"></circle>' +
              '<circle class="rn-core" cx="15" cy="15" r="7.5"></circle>' +
              '<path class="rn-check" d="M11.5 15.2l2.4 2.4 4.6-4.9"></path>' +
            '</svg>' +
            '<span class="rail-tip"><b>' + n.label + '</b><em data-tip></em></span>' +
          '</a>' +
        '</li>';
    });
    rail.innerHTML = '<ul class="rail-list">' + items + '</ul>';

    var nav = document.querySelector(".topnav");
    var oldSwitcher = document.querySelector(".switcher");
    if (oldSwitcher) oldSwitcher.remove();
    nav.parentNode.insertBefore(rail, nav.nextSibling);
  }

  function renderRail() {
    if (!rail) return;
    rail.querySelectorAll("[data-key]").forEach(function (li) {
      var n = NODES.filter(function (x) { return x.key === li.getAttribute("data-key"); })[0];
      var p = S.pct(n.pctKey || n.key);
      li.classList.toggle("is-done", p === 100);
      li.querySelector(".rn-fill").style.strokeDashoffset = String(RC * (1 - p / 100));
      li.querySelector("[data-tip]").textContent = p + "%";
      li.querySelector("a").setAttribute("aria-label", n.label + ", " + p + " percent complete");
    });
  }

  /* ------------------------------------------------------------------
     Mode chip + menu
     ------------------------------------------------------------------ */
  var cta = document.querySelector(".nav-cta");
  var chip, menu;

  function buildChip() {
    if (!cta) return;
    cta.innerHTML = "";
    chip = document.createElement("button");
    chip.type = "button";
    chip.className = "mode-chip";
    chip.setAttribute("aria-haspopup", "true");
    chip.setAttribute("aria-expanded", "false");
    cta.appendChild(chip);

    menu = document.createElement("div");
    menu.className = "mode-menu";
    menu.hidden = true;
    cta.appendChild(menu);

    chip.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      chip.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target)) { menu.hidden = true; chip.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { menu.hidden = true; chip.setAttribute("aria-expanded", "false"); chip.focus(); }
    });
    renderChip();
  }

  function goHome() { window.location.href = "index.html"; }

  function renderChip() {
    if (!chip) return;
    var demo = S.mode === "demo";
    chip.setAttribute("data-mode", S.mode);
    chip.innerHTML = '<i></i>' + (demo ? "Live demo" : "Example · Alex") +
      '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';

    menu.innerHTML = demo
      ? '<h3>You’re in the live demo</h3><p>Everything you do here moves the numbers. Progress lasts until you close this tab.</p>' +
        '<button type="button" data-act="restart" class="is-danger">Restart from 0%<small>Clears everything you’ve done in this run</small></button>' +
        '<button type="button" data-act="example">View the example journey<small>Alex Rivera, partway through, pre-filled</small></button>'
      : '<h3>You’re viewing an example</h3><p>Alex Rivera, partway through the program. Everything is pre-filled so you can see the journey with some history. Nothing here is yours.</p>' +
        '<button type="button" data-act="demo">Try it yourself<small>Starts at 0% — every action moves the numbers</small></button>' +
        '<button type="button" data-act="reset-example" class="is-danger">Reset the example<small>Undo anything you changed in this view</small></button>';

    menu.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.getAttribute("data-act");
        if (act === "restart" || act === "reset-example") {
          if (!b.classList.contains("is-armed")) {
            b.classList.add("is-armed");
            b.firstChild.textContent = "Click again to confirm";
            setTimeout(function () { renderChip(); menu.hidden = false; }, 3500);
            return;
          }
          S.restart(); goHome(); return;
        }
        S.start(act === "demo" ? "demo" : "example");
        goHome();
      });
    });
  }

  /* ------------------------------------------------------------------
     Start screen — the Map, first time in this tab session
     ------------------------------------------------------------------ */
  function maybePicker() {
    if (file !== "index.html" || S.chosen) return;

    var ov = document.createElement("div");
    ov.className = "picker";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-labelledby", "pickerTitle");
    ov.innerHTML =
      '<div class="picker-box">' +
        '<div class="picker-eyebrow">CONCEPT · CAREER JOURNEY</div>' +
        '<h2 id="pickerTitle">How would you like to explore this?</h2>' +
        '<p class="picker-lead">Same screens either way. One shows what a journey looks like with some history; the other lets you walk it from the very beginning.</p>' +
        '<div class="picker-grid">' +
          '<button type="button" class="picker-card picker-card--example" data-pick="example">' +
            '<span class="picker-tag">EXAMPLE</span>' +
            '<span class="picker-title">See an example journey</span>' +
            '<span class="picker-desc">Alex Rivera, a career changer partway through. Discovery is answered, a goal is set, a couple of courses are done. Poke around freely.</span>' +
            '<span class="picker-meta">Starts at 38% · pre-filled</span>' +
          '</button>' +
          '<button type="button" class="picker-card picker-card--primary" data-pick="demo">' +
            '<span class="picker-tag">LIVE DEMO</span>' +
            '<span class="picker-title">Try it yourself</span>' +
            '<span class="picker-desc">Start from zero. Answer Discovery, pick a path, check things off — every real action moves the numbers, and your resume is built from your own answers.</span>' +
            '<span class="picker-meta">Starts at 0% · about 5 minutes</span>' +
          '</button>' +
        '</div>' +
        '<p class="picker-foot">You can switch any time from the chip at the top right. Progress lasts until you close the tab.</p>' +
      '</div>';
    document.body.appendChild(ov);
    var buttons = ov.querySelectorAll("[data-pick]");
    buttons[1].focus();

    function choose(mode) {
      S.start(mode);
      window.location.reload();
    }
    buttons.forEach(function (b) { b.addEventListener("click", function () { choose(b.getAttribute("data-pick")); }); });
    ov.addEventListener("keydown", function (e) {
      if (e.key === "Escape") choose("example");
      if (e.key === "Tab") { // keep focus inside the dialog
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  buildRail();
  buildChip();
  renderSlots();
  renderRail();
  maybePicker();

  document.addEventListener("somos:change", function () {
    renderSlots();
    renderRail();
  });
})();
