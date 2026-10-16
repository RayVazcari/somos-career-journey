(function () {
  "use strict";

  var S = window.SomosState;

  var ICONS = {
    learn: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    build: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"></path></svg>',
    connect: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>'
  };
  var ITEM_ICON = {
    learn: ICONS.learn.replace('width="17" height="17"', 'width="16" height="16"'),
    build: ICONS.build.replace('width="17" height="17"', 'width="16" height="16"'),
    connect: ICONS.connect.replace('width="17" height="17"', 'width="16" height="16"')
  };
  var CHECK = '<svg class="icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  var grid = document.getElementById("trackGrid");
  var TRACKS = ["learn", "build", "connect"];

  /* ------------------------------------------------------------------
     Header + profile card — all derived, nothing typed in
     ------------------------------------------------------------------ */
  function renderHeader() {
    var p = S.persona();
    var target = document.getElementById("dashTarget");
    target.innerHTML = p.goalSet
      ? 'Target role: <strong>' + esc(p.role) + '</strong>'
      : 'Target role: <strong>Not chosen yet</strong>';

    var rev = document.getElementById("dashRevisit");
    var check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22E2A0" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
    if (!p.hasDiscovery) {
      rev.href = "ai-discovery.html";
      rev.innerHTML = check + "Start with AI Discovery &mdash; it builds the profile this page uses";
    } else if (!p.goalSet) {
      rev.href = "compare-careers.html";
      rev.innerHTML = check + "Choose your goal in Explore &amp; Compare to tailor this page";
    } else {
      rev.href = "ai-discovery.html";
      rev.innerHTML = check + "Career direction set from your Discovery conversation &middot; revisit it";
    }

    var bg = [S.data.prepare.details.education, p.bg ? p.bg.charAt(0).toUpperCase() + p.bg.slice(1) : ""].filter(Boolean).join(" · ");
    document.getElementById("pcBackground").textContent = bg || "Not asked yet — start AI Discovery";

    document.getElementById("pcSkills").innerHTML = p.skills.length
      ? p.skills.map(function (s) { return '<span class="mini-chip">' + esc(s) + "</span>"; }).join("")
      : '<span class="mini-chip" style="opacity:.6">Builds as you answer Discovery</span>';

    var missing;
    if (S.pct("build") === 0) missing = "Hands-on project";
    else if (S.pct("learn") < 50) missing = "Core coursework";
    else if (S.pct("connect") < 50) missing = "A mentor or community";
    else missing = "Interview practice";
    document.getElementById("pcMissing").textContent = missing;

    var next = S.nextItem();
    var nextText = document.getElementById("nextText");
    var nextBtn = document.getElementById("nextBtn");
    if (next) {
      nextText.textContent = "Next up: " + next.title + " — " + (next.reco || next.why.charAt(0).toLowerCase() + next.why.slice(1).replace(/\.$/, ""));
      nextBtn.textContent = "See it on your roadmap";
      nextBtn.setAttribute("data-href", "living-roadmap.html");
    } else {
      nextText.textContent = "Every item is done — your next move is Prepare, where your resume can draw on real, finished work.";
      nextBtn.textContent = "Go to Prepare";
      nextBtn.setAttribute("data-href", "prepare.html");
    }
  }

  /* ------------------------------------------------------------------
     Tracks
     ------------------------------------------------------------------ */
  function renderTrack(track) {
    var meta = S.TRACK_META[track];
    var pct = S.pct(track);
    var complete = pct === 100;
    var card = document.createElement("section");
    card.className = "track-card" + (complete ? " is-complete" : "");
    card.setAttribute("aria-label", meta.name + " track, " + pct + " percent complete");

    var itemsHtml = S.trackItems(track).map(function (item) {
      var done = !!S.data.items[item.id];
      return (
        '<div class="track-item' + (done ? " is-done" : "") + '" data-item="' + item.id + '" role="checkbox" aria-checked="' + done + '" tabindex="0">' +
        '<span class="track-checkbox"><span class="icon-item">' + ITEM_ICON[track] + '</span>' + CHECK + '</span>' +
        '<div class="track-item-body">' +
        '<div class="track-item-title">' + esc(item.title) + '</div>' +
        '<div class="track-item-meta">' + esc(item.type) + ' · ' + esc(item.length) + '</div>' +
        '<div class="track-item-why">' + esc(item.why) + '</div>' +
        '</div>' +
        '<svg class="track-status" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle>' + (done ? '<path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>' : '') + '</svg>' +
        '</div>'
      );
    }).join("");

    card.innerHTML =
      '<div class="track-head"><div class="track-head-left"><span class="track-icon">' + ICONS[track] + '</span><span class="track-name">' + meta.name + '</span></div><span class="track-pct">' + pct + '%</span></div>' +
      '<div class="track-bar"><div class="track-bar-fill" style="width:' + pct + '%"></div></div>' +
      itemsHtml +
      (complete
        ? '<div class="track-card-note"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path></svg>Every item here is done — nice work.</div>'
        : "");

    card.querySelectorAll("[data-item]").forEach(function (row) {
      function toggle() {
        var id = row.getAttribute("data-item");
        S.update(function (d) { d.items[id] = !d.items[id]; });
      }
      row.addEventListener("click", toggle);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });

    return card;
  }

  function renderAll() {
    grid.innerHTML = "";
    TRACKS.forEach(function (t) { grid.appendChild(renderTrack(t)); });
    renderHeader();
  }

  document.addEventListener("somos:change", renderAll);
  renderAll();
})();
