(function () {
  "use strict";

  var ICON = {
    course: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    lab: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"></path></svg>',
    people: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>'
  };

  /* Phases 1 and 2 only — Phase 3 is three plain launcher cards in
     the markup, per the spec. Each resource carries its own duration
     and "why it matters", which is what makes this the detailed
     execution layer rather than a duplicate of the Dashboard. */
  var PHASES = [
    {
      key: "foundations", title: "Phase 1 — Foundations",
      completeTitle: "Phase 1 complete",
      completeBody: "Foundations done. You now have the shared vocabulary every product-ops team assumes.",
      items: [
        { title: "Understand Product Lifecycle", type: "Course", length: "2 hrs", icon: "course", done: true,
          why: "Gives you the shared vocabulary every product-ops role assumes you already know." },
        { title: "Agile Fundamentals", type: "Course", length: "3 hrs", icon: "course", done: true,
          why: "Almost every tech team runs on some flavor of Agile — this is the baseline." },
        { title: "Jira Fundamentals", type: "Course", length: "2 hrs", icon: "course", done: false,
          why: "The tool you’ll actually use day-to-day to track work." },
        { title: "SQL Basics", type: "Course", length: "6 hrs", icon: "course", done: false, priority: true,
          why: "Lets you pull your own data instead of waiting on an analyst." }
      ]
    },
    {
      key: "experience", title: "Phase 2 — Experience",
      completeTitle: "Phase 2 complete",
      completeBody: "Real, shareable proof of your work. This is what interviewers will actually ask about.",
      items: [
        { title: "Complete SOMOS Product Lab", type: "Lab", length: "3 weeks", icon: "lab", done: false,
          why: "Your first real deliverable — this becomes your resume bullet and portfolio piece." },
        { title: "Volunteer on a SOMOS project", type: "Community", length: "Ongoing", icon: "people", done: false,
          why: "Hands-on experience without needing to be hired first." },
        { title: "Create one case study", type: "Portfolio", length: "1 week", icon: "lab", done: false,
          why: "Turns the Lab project into something you can walk through in an interview." }
      ]
    }
  ];

  var host = document.getElementById("rmPhases");

  function pct(phase) {
    var done = phase.items.filter(function (i) { return i.done; }).length;
    return Math.round((done / phase.items.length) * 100);
  }

  /* Snapshot from the previous render, read BEFORE re-rendering —
     the click handler has already flipped item.done by the time
     render() runs, so recomputing "was it complete?" inside render
     would just see the new state and never detect the transition. */
  var wasComplete = {};
  PHASES.forEach(function (p) { wasComplete[p.key] = pct(p) === 100; });

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function buildPhase(phase) {
    var p = pct(phase);
    var el = document.createElement("section");
    el.className = "rm-phase" + (p === 100 ? " is-complete" : "");
    el.setAttribute("aria-label", phase.title + ", " + p + " percent complete");

    var items = phase.items.map(function (item, i) {
      return (
        '<div class="rm-item' + (item.done ? " is-done" : "") + '" data-i="' + i + '" role="checkbox" aria-checked="' + item.done + '" tabindex="0">' +
        '<span class="rm-item-icon">' + ICON[item.icon] + '</span>' +
        '<div class="rm-item-body">' +
        '<div class="rm-item-top"><span class="rm-item-title">' + esc(item.title) + '</span>' +
        '<span class="rm-item-meta">' + esc(item.type) + ' &middot; ' + esc(item.length) + '</span></div>' +
        '<div class="rm-item-why">' + esc(item.why) + '</div>' +
        '</div>' +
        '<svg class="rm-item-status" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle>' + (item.done ? '<path d="M9 12l2 2 4-4"></path>' : "") + '</svg>' +
        '</div>'
      );
    }).join("");

    el.innerHTML =
      '<div class="rm-phase-head"><span class="rm-phase-title">' + esc(phase.title) + '</span><span class="rm-phase-pct">' + p + '%</span></div>' +
      '<div class="rm-bar"><div class="rm-bar-fill" style="width:' + p + '%"></div></div>' +
      items;

    el.querySelectorAll("[data-i]").forEach(function (row) {
      function toggle() {
        var item = phase.items[Number(row.dataset.i)];
        item.done = !item.done;
        render();
      }
      row.addEventListener("click", toggle);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
    return el;
  }

  /* The AI's pick: an unfinished resource flagged as priority wins
     (SQL Basics, matching the Dashboard's "Finish SQL Basics"),
     otherwise just the first unfinished one in order. Keeps both
     screens recommending the same next step. */
  function nextUp() {
    var first = null;
    for (var p = 0; p < PHASES.length; p++) {
      for (var i = 0; i < PHASES[p].items.length; i++) {
        var it = PHASES[p].items[i];
        if (it.done) continue;
        if (it.priority) return it;
        if (!first) first = it;
      }
    }
    return first;
  }

  function updateSummary() {
    var all = [];
    PHASES.forEach(function (p) { all = all.concat(p.items); });
    var done = all.filter(function (i) { return i.done; }).length;
    var total = all.length;
    document.getElementById("rmOverall").textContent = Math.round((done / total) * 100) + "%";
    document.getElementById("rmOverallSub").textContent = done + " of " + total + " resources done";

    var learn = pct(PHASES[0]);
    var build = pct(PHASES[1]);
    var next = nextUp();
    var reco;
    if (!next) {
      reco = "Every resource on this roadmap is done. Your next move is the Career Launch Kit below — start with Prepare, since your resume can now draw on real, finished work.";
    } else if (learn >= build) {
      reco = "You’re moving faster on Learn than Build. Recommended next: " + next.title + (learn === 100 ? "" : ", then start your first SOMOS Product Lab project") + " — hands-on experience is what’s missing from your profile right now.";
    } else {
      reco = "Your hands-on work is ahead of your coursework. Recommended next: " + next.title + " — it fills the biggest remaining gap before you start applying.";
    }
    document.getElementById("rmReco").textContent = reco;
  }

  function render() {
    host.innerHTML = "";
    PHASES.forEach(function (p) { host.appendChild(buildPhase(p)); });
    updateSummary();

    PHASES.forEach(function (p) {
      var now = pct(p) === 100;
      if (now && !wasComplete[p.key] && window.SomosToast) {
        window.SomosToast(p.completeTitle, p.completeBody, { persist: true });
      }
      wasComplete[p.key] = now;
    });
  }

  /* A real download of the current roadmap state — what you see is
     what you get, including anything you've checked off this visit. */
  document.getElementById("rmDownload").addEventListener("click", function () {
    var lines = ["Your Product Operations roadmap", "SOMOS.tech - Starting in Tech v4 (concept)", ""];
    PHASES.forEach(function (p) {
      lines.push(p.title + " (" + pct(p) + "%)");
      p.items.forEach(function (i) {
        lines.push("  [" + (i.done ? "x" : " ") + "] " + i.title + " - " + i.type + ", " + i.length);
        lines.push("        Why: " + i.why);
      });
      lines.push("");
    });
    var blob = new Blob([lines.join("\n")], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "product-operations-roadmap.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    if (window.SomosToast) window.SomosToast("Roadmap downloaded", "Saved as product-operations-roadmap.txt with your current progress.");
  });

  render();
})();
