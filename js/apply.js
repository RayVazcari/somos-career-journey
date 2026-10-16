(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var S = window.SomosState;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  var roleName = S.persona().role;
  document.getElementById("applySub").textContent =
    "Start applying for " + roleName + " roles today — with a resume that actually sounds like you.";
  document.getElementById("boardsLabel").textContent = "CURATED BOARDS FOR " + roleName.toUpperCase();

  /* ---------------- job boards ----------------
     Search links use each site's own public search URL for the
     target role. Opens in a new tab — leaving this page doesn't
     count as having applied; opening a board only counts as having
     started your search. */
  var ROLE = encodeURIComponent(roleName);
  var BOARDS = [
    { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/search/?keywords=" + ROLE, bg: "rgba(34,226,160,0.12)", fg: "#22E2A0",
      icon: '<path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05C19.6 8 21 10.15 21 14.05V23h-4v-8.1c0-1.93-.03-4.4-2.68-4.4-2.68 0-3.1 2.1-3.1 4.27V23h-4V8z"></path>', fill: true },
    { name: "Indeed", url: "https://www.indeed.com/jobs?q=" + ROLE, bg: "rgba(34,226,160,0.12)", fg: "#22E2A0",
      icon: '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' },
    { name: "Glassdoor", url: "https://www.glassdoor.com/Job/index.htm", bg: "rgba(34,226,160,0.12)", fg: "#22E2A0",
      icon: '<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 21.5 12 18 5.5 21.5 7 14.5 2 9.5 9 9 12 2"></polygon>' },
    { name: "SimplyHired", url: "https://www.simplyhired.com/search?q=" + ROLE, bg: "rgba(34,226,160,0.12)", fg: "#22E2A0",
      icon: '<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>' },
    { name: "ZipRecruiter", url: "https://www.ziprecruiter.com/jobs-search?search=" + ROLE, bg: "rgba(34,226,160,0.12)", fg: "#22E2A0",
      icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>' },
    { name: "Wellfound", url: "https://wellfound.com/jobs", bg: "rgba(34,226,160,0.12)", fg: "#22E2A0",
      icon: '<path d="M4 4l16 8-16 8V4z"></path>' }
  ];

  var boardsEl = document.getElementById("boards");
  boardsEl.innerHTML = BOARDS.map(function (b) {
    return (
      '<a class="board" data-board="' + esc(b.name) + '" href="' + b.url + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="board-icon" style="background:' + b.bg + ";color:" + b.fg + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (b.fill ? "currentColor" : "none") + '" stroke="' + (b.fill ? "none" : "currentColor") + '" stroke-width="2">' + b.icon + "</svg></span>" +
      '<span><span class="board-name">' + esc(b.name) + '</span><br><span class="board-sub">Search ' + esc(roleName) + "</span></span></a>"
    );
  }).join("");

  boardsEl.addEventListener("click", function (e) {
    var a = e.target.closest("[data-board]");
    if (!a) return;
    var name = a.getAttribute("data-board");
    S.update(function (d) { if (d.apply.boardsOpened.indexOf(name) < 0) d.apply.boardsOpened.push(name); });
  });

  /* ---------------- start date ---------------- */
  var dateEl = document.getElementById("planDate");
  var editBtn = document.getElementById("planEdit");

  function nextMonday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var add = (8 - d.getDay()) % 7 || 7;      // always the *next* Monday, never today
    d.setDate(d.getDate() + add);
    return d;
  }
  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function fromIso(s) {
    var p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function pretty(d) {
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  var editing = false;
  function currentDate() { return S.data.apply.startDate ? fromIso(S.data.apply.startDate) : nextMonday(); }

  function renderDate() {
    var saved = !!S.data.apply.startDate;
    if (editing) {
      dateEl.innerHTML = '<input class="plan-date-input" type="date" id="planInput" min="' + iso(new Date()) + '" value="' + iso(currentDate()) + '" aria-label="Start date">';
      editBtn.textContent = "Save";
      document.getElementById("planInput").focus();
    } else {
      dateEl.innerHTML = esc(pretty(currentDate())) + (saved ? "" : ' <span class="ph">(suggested — Edit &amp; Save to set it)</span>');
      editBtn.textContent = "Edit";
    }
  }
  editBtn.addEventListener("click", function () {
    if (editing) {
      var v = document.getElementById("planInput").value;
      if (v) S.update(function (d) { d.apply.startDate = v; });
    }
    editing = !editing;
    renderDate();
  });

  /* ---------------- badge ---------------- */
  var list = document.getElementById("criteria");
  var countEl = document.getElementById("badgeCount");
  var claimBtn = document.getElementById("claimBtn");
  var card = document.getElementById("badgeCard");

  /* Criteria 1–3 are DERIVED from what you did elsewhere — you can't
     tick them here. 4 and 5 happen outside this prototype (the Mock
     Interview program, and the actual applications), so they carry a
     clearly-labelled "Prototype" button. */
  function criteria() {
    var d = S.data;
    return [
      { text: "Career direction chosen — " + S.roleName(), done: d.compare.goalConfirmed, go: "compare-careers.html", goLabel: "Choose your goal" },
      { text: "Personalized roadmap generated", done: S.pct("ai-discovery") === 100, go: "ai-discovery.html", goLabel: "Finish Discovery" },
      { text: "Resume & LinkedIn built from your real story", done: d.prepare.resumeDownloaded && d.prepare.copied.length > 0, go: "prepare.html", goLabel: "Go to Prepare" },
      { text: "Practiced at least one mock interview", done: d.practice.mockDone, proto: "mock" },
      { text: "Applied to at least one role", done: d.apply.applied, proto: "applied" }
    ];
  }

  function render() {
    var C = criteria();
    var claimed = S.data.apply.claimed;
    list.innerHTML = C.map(function (c, i) {
      var action = "";
      if (!c.done && !claimed) {
        if (c.go) action = '<a class="criterion-link" href="' + c.go + '">' + c.goLabel + " &#8594;</a>";
        else if (c.proto) action = '<button type="button" class="ln-btn ln-btn--small criterion-demo" data-proto="' + c.proto + '" title="Prototype only: in the real product this is set by the Mock Interview program / your application tracker, not by you">Prototype: mark done</button>';
      }
      return (
        '<div class="criterion' + (c.done ? " is-done" : "") + '">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle>' +
        (c.done ? '<path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>' : "") + "</svg>" +
        "<span>" + esc(c.text) + "</span>" + action + "</div>"
      );
    }).join("");

    list.querySelectorAll("[data-proto]").forEach(function (b) {
      b.addEventListener("click", function () {
        var which = b.getAttribute("data-proto");
        S.update(function (d) {
          if (which === "mock") d.practice.mockDone = true;
          else d.apply.applied = true;
        });
      });
    });

    var done = C.filter(function (c) { return c.done; }).length;
    var left = C.length - done;

    if (claimed) {
      card.classList.add("is-claimed");
      document.getElementById("badgeTitle").textContent = "Starting in Tech — Pathfinder badge earned";
      document.getElementById("badgeSub").textContent = "Every step behind this badge is something you actually did:";
      countEl.textContent = "All " + C.length + " completed — and earned, not just visited.";
      claimBtn.disabled = true;
      claimBtn.textContent = "Badge claimed";
    } else if (left === 0) {
      countEl.textContent = "All " + C.length + " completed — it’s yours to claim.";
      claimBtn.disabled = false;
      claimBtn.textContent = "Claim badge";
    } else {
      countEl.textContent = done + " of " + C.length + " completed — the badge unlocks once the last " + (left === 1 ? "one is" : left + " are") + " done, not just for visiting this page.";
      claimBtn.disabled = true;
      claimBtn.textContent = "Claim badge (" + left + " step" + (left === 1 ? "" : "s") + " left)";
    }
  }

  function burst() {
    if (reduceMotion) return;
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("span");
      s.className = "spark";
      var angle = (Math.PI * 2 * i) / 14;
      var dist = 70 + Math.random() * 60;
      s.style.setProperty("--dx", Math.round(Math.cos(angle) * dist) + "px");
      s.style.setProperty("--dy", Math.round(Math.sin(angle) * dist) + "px");
      card.appendChild(s);
      (function (el) {
        requestAnimationFrame(function () { el.classList.add("is-go"); });
        setTimeout(function () { el.remove(); }, 1000);
      })(s);
    }
  }

  claimBtn.addEventListener("click", function () {
    if (claimBtn.disabled || S.data.apply.claimed) return;
    S.update(function (d) { d.apply.claimed = true; }, { silent: true });
    burst();
    if (window.SomosToast) window.SomosToast("Pathfinder badge earned", "Direction chosen, roadmap built, resume done, interview practiced, application sent.", { persist: true });
  });

  document.addEventListener("somos:change", function () { render(); if (!editing) renderDate(); });
  renderDate();
  render();

  // /apply.html#badge from the Map's "Land the Role" node
  if (location.hash === "#badge") {
    card.scrollIntoView({ behavior: "auto", block: "center" });
  }
})();
