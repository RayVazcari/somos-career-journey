(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICONS = {
    learn: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    build: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"></path></svg>',
    connect: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>'
  };
  var CHECK = '<svg class="icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';

  /* ------------------------------------------------------------------
     Learn / Build / Connect data. Each item's own "why it matters"
     line, not just a bare checkbox label, per the design spec. Percent
     per track is computed live from these checkboxes — this page is
     specifically where real completion state should drive things,
     unlike the static example numbers the other screens share.
     ------------------------------------------------------------------ */
  var TRACKS = [
    {
      key: "learn", name: "Learn", icon: ICONS.learn,
      itemIcon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
      completeTitle: "Learn complete",
      completeBody: "All 4 courses & certs finished. Your roadmap just unlocked Build recommendations.",
      items: [
        { title: "Agile Fundamentals", meta: "Course · 3 hrs", why: "Almost every tech team runs on some flavor of Agile.", done: true },
        { title: "Jira Fundamentals", meta: "Course · 2 hrs", why: "The tool you’ll actually use day-to-day to track work.", done: false },
        { title: "SQL Basics", meta: "Course · 6 hrs", why: "Lets you pull your own data instead of waiting on an analyst.", done: false },
        { title: "AWS Cloud Practitioner", meta: "Certification", why: "A recognizable credential recruiters screen for, even outside cloud roles.", done: false }
      ]
    },
    {
      key: "build", name: "Build", icon: ICONS.build,
      itemIcon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"></path></svg>',
      completeTitle: "Build complete",
      completeBody: "Your hands-on proof is done — ready to turn it into interview stories.",
      items: [
        { title: "SOMOS Product Lab", meta: "Lab · 3 weeks", why: "Your first real deliverable — becomes your resume bullet.", done: false },
        { title: "Volunteer project", meta: "Community · ongoing", why: "Hands-on experience without needing to be hired first.", done: false },
        { title: "Case study write-up", meta: "Portfolio piece", why: "Turns the Lab project into something you can walk through in an interview.", done: false }
      ]
    },
    {
      key: "connect", name: "Connect", icon: ICONS.connect,
      itemIcon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>',
      completeTitle: "Connect complete",
      completeBody: "You’ve built real relationships, not a contacts list — tailored to your target role.",
      items: [
        { title: "Joined SOMOS San Antonio", meta: "Chapter · local", why: "Local meetups are where most mentor connections actually start.", done: true },
        { title: "Product Management AMA", meta: "Event · Sept 22", why: "Direct access to working PMs — rare outside a paid program.", done: false },
        { title: "Find a mentor", meta: "Mentorship program", why: "Mentored career changers move faster — and feel less alone doing it.", done: false }
      ]
    }
  ];

  var grid = document.getElementById("trackGrid");

  /* Snapshot of each track's completion as of the LAST render, used to
     detect the 0%-or-partial -> 100% transition. This has to live
     outside renderAll and be read before the DOM (re)renders — the
     item toggle already mutated track.items by the time renderAll
     runs, so computing "before" from track.items inside that same
     call would just read the already-new state and miss the moment
     of completion entirely. */
  var wasComplete = {};
  TRACKS.forEach(function (t) { wasComplete[t.key] = trackPct(t) === 100; });

  function trackPct(track) {
    var done = track.items.filter(function (i) { return i.done; }).length;
    return Math.round((done / track.items.length) * 100);
  }

  function renderTrack(track) {
    var pct = trackPct(track);
    var complete = pct === 100;
    var card = document.createElement("section");
    card.className = "track-card" + (complete ? " is-complete" : "");
    card.setAttribute("aria-label", track.name + " track, " + pct + " percent complete");

    var itemsHtml = track.items.map(function (item, i) {
      return (
        '<div class="track-item' + (item.done ? " is-done" : "") + '" data-item="' + i + '" role="checkbox" aria-checked="' + item.done + '" tabindex="0">' +
        '<span class="track-checkbox"><span class="icon-item">' + track.itemIcon + '</span>' + CHECK + '</span>' +
        '<div class="track-item-body">' +
        '<div class="track-item-title">' + item.title + '</div>' +
        '<div class="track-item-meta">' + item.meta + '</div>' +
        '<div class="track-item-why">' + item.why + '</div>' +
        '</div>' +
        '<svg class="track-status" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle>' + (item.done ? '<path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>' : '') + '</svg>' +
        '</div>'
      );
    }).join("");

    card.innerHTML =
      '<div class="track-head"><div class="track-head-left"><span class="track-icon">' + track.icon + '</span><span class="track-name">' + track.name + '</span></div><span class="track-pct">' + pct + '%</span></div>' +
      '<div class="track-bar"><div class="track-bar-fill" style="width:' + pct + '%"></div></div>' +
      itemsHtml +
      (complete
        ? '<div class="track-card-note"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path></svg>Every item here is done — nice work.</div>'
        : "");

    card.querySelectorAll("[data-item]").forEach(function (row) {
      function toggle() {
        var idx = Number(row.dataset.item);
        track.items[idx].done = !track.items[idx].done;
        renderAll();
      }
      row.addEventListener("click", toggle);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });

    return card;
  }

  /* Career readiness: a live composite of the three tracks above, so
     it visibly moves as items are checked — distinct from "Overall
     program" below it, which is the static shared figure every other
     screen shows and does NOT change when you check things here. */
  function updateReadiness() {
    var avg = Math.round(TRACKS.reduce(function (sum, t) { return sum + trackPct(t); }, 0) / TRACKS.length);
    var valueEl = document.querySelector("[data-readiness-value]");
    if (valueEl) valueEl.textContent = avg + "%";
    var ring = document.querySelector("[data-readiness-ring]");
    if (ring) {
      var c = 2 * Math.PI * 27;
      ring.style.strokeDasharray = String(c);
      ring.style.strokeDashoffset = String(c * (1 - avg / 100));
    }
  }

  /* A milestone toast fires exactly once per track, only on the
     transition into "every item checked" (compared against the
     wasComplete snapshot from the previous render) — never on page
     load for a track that already starts complete, and never repeats
     while it stays complete. Un-checking an item later and completing
     the track again re-fires the celebration, since wasComplete gets
     updated to false as soon as it drops below 100%. */
  function renderAll() {
    grid.innerHTML = "";
    TRACKS.forEach(function (track) { grid.appendChild(renderTrack(track)); });
    updateReadiness();

    TRACKS.forEach(function (t) {
      var nowComplete = trackPct(t) === 100;
      if (nowComplete && !wasComplete[t.key]) {
        window.SomosToast && window.SomosToast(t.completeTitle, t.completeBody, { persist: true });
      }
      wasComplete[t.key] = nowComplete;
    });
  }

  renderAll();
})();
