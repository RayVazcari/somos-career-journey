(function () {
  "use strict";

  var S = window.SomosState;

  var ICON = {
    course: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    lab: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"></path></svg>',
    people: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>'
  };

  /* Phases 1 and 2 are groupings of the SAME items the Dashboard shows —
     one list, two views. Phase 3 is the three launchers in the markup. */
  var PHASES = [
    { key: "foundations", title: "Phase 1 — Foundations", tracks: ["learn"] },
    { key: "experience", title: "Phase 2 — Experience & community", tracks: ["build", "connect"] }
  ];

  var host = document.getElementById("rmPhases");

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function itemsOf(phase) {
    return S.ITEMS.filter(function (i) { return phase.tracks.indexOf(i.track) > -1; });
  }
  function pct(phase) {
    var items = itemsOf(phase);
    var done = items.filter(function (i) { return S.data.items[i.id]; }).length;
    return Math.round((done / items.length) * 100);
  }

  function buildPhase(phase) {
    var p = pct(phase);
    var el = document.createElement("section");
    el.className = "rm-phase" + (p === 100 ? " is-complete" : "");
    el.setAttribute("aria-label", phase.title + ", " + p + " percent complete");

    var next = S.nextItem();
    var items = itemsOf(phase).map(function (item) {
      var done = !!S.data.items[item.id];
      var isNext = next && next.id === item.id;
      return (
        '<div class="rm-item' + (done ? " is-done" : "") + '" data-id="' + item.id + '" role="checkbox" aria-checked="' + done + '" tabindex="0">' +
        '<span class="rm-item-icon">' + ICON[item.icon] + '</span>' +
        '<div class="rm-item-body">' +
        '<div class="rm-item-top"><span class="rm-item-title">' + esc(item.title) + '</span>' +
        (isNext ? '<span class="rm-item-next">NEXT UP</span>' : "") +
        '<span class="rm-item-meta">' + esc(item.type) + ' &middot; ' + esc(item.length) + '</span></div>' +
        '<div class="rm-item-why">' + esc(item.why) + '</div>' +
        '</div>' +
        '<svg class="rm-item-status" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle>' + (done ? '<path d="M9 12l2 2 4-4"></path>' : "") + '</svg>' +
        '</div>'
      );
    }).join("");

    el.innerHTML =
      '<div class="rm-phase-head"><span class="rm-phase-title">' + esc(phase.title) + '</span><span class="rm-phase-pct">' + p + '%</span></div>' +
      '<div class="rm-bar"><div class="rm-bar-fill" style="width:' + p + '%"></div></div>' +
      items;

    el.querySelectorAll("[data-id]").forEach(function (row) {
      function toggle() {
        var id = row.getAttribute("data-id");
        S.update(function (d) { d.items[id] = !d.items[id]; });
      }
      row.addEventListener("click", toggle);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    });
    return el;
  }

  function updateSummary() {
    var p = S.persona();
    document.getElementById("rmTitle").textContent = p.goalSet ? "Your " + p.role + " roadmap" : "Your roadmap";

    var next = S.nextItem();
    var learn = S.pct("learn"), build = S.pct("build");
    var reco;
    if (!p.goalSet) {
      reco = "This roadmap works best once you’ve chosen a goal. Pick one in Explore & Compare and I’ll tailor the order of everything below to that role.";
    } else if (!next) {
      reco = "Every resource on this roadmap is done. Your next move is the Career Launch Kit below — start with Prepare, since your resume can now draw on real, finished work.";
    } else if (learn === 0 && build === 0) {
      reco = "A good place to start: " + next.title + ". It’s the quickest way to build momentum before the hands-on work begins.";
    } else if (learn >= build) {
      reco = "You’re moving faster on Learn than Build. Recommended next: " + next.title + (learn === 100 ? "" : ", then start your first SOMOS Product Lab project") + " — hands-on experience is what’s missing from your profile right now.";
    } else {
      reco = "Your hands-on work is ahead of your coursework. Recommended next: " + next.title + " — it fills the biggest remaining gap before you start applying.";
    }
    document.getElementById("rmReco").textContent = reco;

    var prep = Math.round((S.pct("prepare") + S.pct("practice") + S.pct("apply")) / 3);
    document.getElementById("rmP3Pct").textContent = prep + "%";
    document.getElementById("rmP3Bar").style.width = prep + "%";
  }

  function render() {
    host.innerHTML = "";
    PHASES.forEach(function (ph) { host.appendChild(buildPhase(ph)); });
    updateSummary();
  }

  /* A real download of the current roadmap state — what you see is
     what you get, including anything you've checked off this visit. */
  document.getElementById("rmDownload").addEventListener("click", function () {
    var role = S.persona().role;
    var lines = ["Your " + role + " roadmap", "SOMOS.tech - Starting in Tech v4 (concept)", ""];
    PHASES.forEach(function (ph) {
      lines.push(ph.title + " (" + pct(ph) + "%)");
      itemsOf(ph).forEach(function (i) {
        lines.push("  [" + (S.data.items[i.id] ? "x" : " ") + "] " + i.title + " - " + i.type + ", " + i.length);
        lines.push("        Why: " + i.why);
      });
      lines.push("");
    });
    var blob = new Blob([lines.join("\n")], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "roadmap.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    if (window.SomosToast) window.SomosToast("Roadmap downloaded", "Saved as roadmap.txt with your current progress.");
  });

  document.addEventListener("somos:change", render);
  render();
})();
