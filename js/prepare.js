(function () {
  "use strict";

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function toast(t, b) { if (window.SomosToast) window.SomosToast(t, b); }

  /* Pre-filled from the example profile, not a generic template. The
     user can extend it (XYZ builder, "anything we missed") and what
     they add shows up in both the on-screen draft and the download. */
  var R = {
    name: "Alex Rivera",
    line: "Aspiring Product Operations Manager · San Antonio, TX · linkedin.com/in/alexrivera",
    summary: "Biology graduate transitioning into Product Operations, bringing 2+ years of clinical coordination experience and hands-on process-improvement skills from SOMOS.tech’s Starting in Tech program.",
    job: {
      role: "Clinic & Lab Coordinator — Regional Health Clinic",
      dates: "2023 – Present",
      bullets: ["Coordinated ~100 patient samples weekly between clinic and lab, eliminating lost handoffs between shifts by introducing a shared tracking spreadsheet adopted team-wide."]
    },
    somos: [
      "Completed Agile Fundamentals certification",
      "Completing SQL Basics coursework (in progress)",
      "Active member, SOMOS San Antonio chapter"
    ],
    education: "B.S. Biology",
    certs: "Agile Fundamentals",
    skills: "Process coordination · SQL (in progress) · Cross-team communication",
    added: []
  };
  var newest = -1; // index in R.added to flash once

  var LI = {
    headline: "Aspiring Product Operations Manager | Clinic & lab coordination, now process improvement | Agile certified",
    about: "I spent two years keeping a clinic and a lab in sync — around 100 patient samples a week, and a shared tracking sheet that ended lost handoffs between shifts. I’m moving into Product Operations to do that kind of work at product-team scale. Currently deepening SQL and Jira through SOMOS.tech’s Starting in Tech program.",
    experience: "Clinic & Lab Coordinator, Regional Health Clinic (2023 – present). Coordinated ~100 patient samples weekly between clinic and lab; introduced a shared tracking spreadsheet adopted team-wide.",
    featured: "Nothing to feature yet — pin your SOMOS Product Lab case study here once it’s built."
  };

  /* ---------------- resume / linkedin rendering ---------------- */
  function renderResume() {
    var el = document.getElementById("docResume");
    var bullets = R.job.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("");
    var somos = R.somos.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("");
    var extra = "";
    if (R.added.length) {
      extra =
        '<div class="paper-job"><h3 class="paper-h">ADDITIONAL EXPERIENCE</h3><ul class="paper-bullets">' +
        R.added.map(function (b, i) { return '<li' + (i === newest ? ' class="is-new"' : "") + ">" + esc(b) + "</li>"; }).join("") +
        "</ul></div>";
    }
    el.innerHTML =
      '<div class="paper-top"><div><div class="paper-name">' + esc(R.name) + '</div><div class="paper-line">' + esc(R.line) + "</div></div>" +
      '<button type="button" class="ln-btn ln-btn--primary" id="dlResume">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06251C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Download resume</button></div>' +
      '<div class="paper-summary">' + esc(R.summary) + "</div>" +
      '<div class="paper-job"><h3 class="paper-h">EXPERIENCE</h3>' +
      '<div class="paper-job-row"><span>' + esc(R.job.role) + "</span><span>" + esc(R.job.dates) + "</span></div>" +
      '<ul class="paper-bullets">' + bullets + "</ul></div>" +
      '<div class="paper-job"><h3 class="paper-h">SOMOS.TECH — STARTING IN TECH</h3><ul class="paper-bullets">' + somos + "</ul></div>" +
      extra +
      '<div class="paper-cols">' +
      "<div><b>Education</b><span>" + esc(R.education) + "</span></div>" +
      "<div><b>Certifications</b><span>" + esc(R.certs) + "</span></div>" +
      "<div><b>Skills</b><span>" + esc(R.skills) + "</span></div></div>";
    document.getElementById("dlResume").addEventListener("click", downloadResume);
  }

  function renderLinkedin() {
    var el = document.getElementById("docLinkedin");
    var fields = [
      ["headline", "HEADLINE", LI.headline, false],
      ["about", "ABOUT", LI.about, false],
      ["experience", "EXPERIENCE", LI.experience, false],
      ["featured", "FEATURED", LI.featured, true]
    ];
    el.innerHTML = fields.map(function (f) {
      return '<div class="li-field"><div class="li-field-head"><span class="li-field-name">' + f[1] + "</span>" +
        (f[3] ? "" : '<button type="button" class="ln-btn ln-btn--small" data-copy="' + f[0] + '">Copy</button>') +
        '</div><p class="li-field-text' + (f[3] ? " is-note" : "") + '">' + esc(f[2]) + "</p></div>";
    }).join("");
    el.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var text = LI[b.getAttribute("data-copy")];
        var done = function () { toast("Copied", "Paste it straight into your LinkedIn profile."); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else { done(); }
      });
    });
  }

  function downloadResume() {
    var L = [R.name, R.line, "", "SUMMARY", R.summary, "", "EXPERIENCE", R.job.role + " (" + R.job.dates + ")"];
    R.job.bullets.forEach(function (b) { L.push("  - " + b); });
    L.push("", "SOMOS.TECH - STARTING IN TECH");
    R.somos.forEach(function (b) { L.push("  - " + b); });
    if (R.added.length) {
      L.push("", "ADDITIONAL EXPERIENCE");
      R.added.forEach(function (b) { L.push("  - " + b); });
    }
    L.push("", "EDUCATION: " + R.education, "CERTIFICATIONS: " + R.certs, "SKILLS: " + R.skills);
    var blob = new Blob([L.join("\n")], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "alex-rivera-resume.txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Resume downloaded", "Saved as alex-rivera-resume.txt, including anything you added here.");
  }

  /* ---------------- tabs ---------------- */
  var tabR = document.getElementById("tabResume");
  var tabL = document.getElementById("tabLinkedin");
  function showTab(which) {
    var isR = which === "resume";
    tabR.setAttribute("aria-selected", String(isR));
    tabL.setAttribute("aria-selected", String(!isR));
    document.getElementById("docResume").hidden = !isR;
    document.getElementById("docLinkedin").hidden = isR;
  }
  tabR.addEventListener("click", function () { showTab("resume"); });
  tabL.addEventListener("click", function () { showTab("linkedin"); });

  function addBullet(text) {
    R.added.push(text);
    newest = R.added.length - 1;
    renderResume();
    showTab("resume");
    toast("Added to your resume", "It’s under “Additional experience” — and in the download.");
  }

  /* ---------------- XYZ builder ---------------- */
  var fx = document.getElementById("xyzX"), fy = document.getElementById("xyzY"), fz = document.getElementById("xyzZ");
  var prev = document.getElementById("xyzPreview"), addBtn = document.getElementById("xyzAdd");

  function strip(s) { return s.trim().replace(/[.\s]+$/, ""); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function updatePreview() {
    var x = strip(fx.value), y = strip(fy.value), z = strip(fz.value);
    var ready = x.length > 2 && y.length > 2 && z.length > 2;
    addBtn.disabled = !ready;
    if (!x && !y && !z) {
      prev.className = "xyz-preview is-empty";
      prev.textContent = "Fill in the three parts and your bullet appears here — in your own words, never invented for you.";
      return;
    }
    prev.className = "xyz-preview";
    prev.innerHTML =
      "<mark>" + esc(x ? cap(x) : "[X]") + "</mark>, as measured by <mark>" + esc(y || "[Y]") + "</mark>, by <mark>" + esc(z || "[Z]") + "</mark>.";
  }
  [fx, fy, fz].forEach(function (f) { f.addEventListener("input", updatePreview); });
  addBtn.addEventListener("click", function () {
    addBullet(cap(strip(fx.value)) + ", as measured by " + strip(fy.value) + ", by " + strip(fz.value) + ".");
    fx.value = fy.value = fz.value = "";
    updatePreview();
  });

  /* ---------------- brand checklist ---------------- */
  var BRAND = [
    { text: "LinkedIn — done above", done: true, locked: true },
    { text: "GitHub profile — pin your Lab project once it’s built", done: false },
    { text: "Portfolio site — optional, but strong for career changers", done: false }
  ];
  var CIRCLE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle>';
  function renderBrand() {
    var host = document.getElementById("brandList");
    host.innerHTML = BRAND.map(function (b, i) {
      return '<div class="brand-row' + (b.done ? " is-done" : "") + '" data-b="' + i + '" role="checkbox" aria-checked="' + b.done + '" tabindex="0">' +
        CIRCLE + (b.done ? '<path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>' : "") + "</svg><span>" + esc(b.text) + "</span></div>";
    }).join("");
    host.querySelectorAll("[data-b]").forEach(function (row) {
      function tog() {
        var b = BRAND[Number(row.dataset.b)];
        if (b.locked) return;
        b.done = !b.done;
        renderBrand();
      }
      row.addEventListener("click", tog);
      row.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } });
    });
  }

  /* ---------------- anything we missed ---------------- */
  var toggle = document.getElementById("missedToggle");
  var body = document.getElementById("missedBody");
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    body.hidden = open;
  });

  /* Scripted judgement — it explains *why* something is or isn't
     resume-worthy instead of blindly inserting whatever was typed. */
  function judge(text) {
    var t = text.toLowerCase();
    if (/coach|train|mentor|tutor|teach/.test(t)) {
      return { fit: true, msg: "Worth including. Teaching or coaching shows you can explain complex things and develop people — exactly what cross-team Product Ops work asks for. Make it stronger by adding how many people and what changed (the XYZ builder above is built for this)." };
    }
    if (/lead|manag|captain|organi[sz]|event|volunteer|coordinat/.test(t)) {
      return { fit: true, msg: "Worth including. Organizing people or events is coordination work, which is the core of Product Operations. Add the scale (people, budget, frequency) so it reads as impact, not just a task." };
    }
    if (/bilingual|spanish|translat|interpret/.test(t)) {
      return { fit: true, msg: "Worth including — as a skill, not a job. Bilingual communication is valuable on community-facing teams. It fits best in your Skills line, with a one-line example of using it." };
    }
    return { fit: false, msg: "Honest take: on its own this isn’t an obvious fit for Product Operations. It earns a spot only if you can attach a measurable result or a skill a hiring manager would care about. Not sure? Leave it off — a tight resume beats a crowded one." };
  }

  var out = document.getElementById("missedOut");
  document.getElementById("missedCheck").addEventListener("click", function () {
    var text = document.getElementById("missedInput").value.trim();
    if (text.length < 8) {
      out.innerHTML = '<div class="missed-reply">Tell me a bit more — a sentence about what you did is enough for me to judge it.</div>';
      return;
    }
    var j = judge(text);
    out.innerHTML =
      '<div class="missed-reply">' + esc(j.msg) +
      '<div class="missed-reply-actions">' +
      '<button type="button" class="ln-btn ln-btn--small ln-btn--primary" id="missedAdd">' + (j.fit ? "Add to my resume" : "Add it anyway") + "</button>" +
      '<button type="button" class="ln-btn ln-btn--small" id="missedSkip">Leave it off</button></div></div>';
    document.getElementById("missedAdd").addEventListener("click", function () {
      addBullet(text.replace(/\s+/g, " ").replace(/^./, function (c) { return c.toUpperCase(); }).replace(/[.]*$/, "."));
      document.getElementById("missedInput").value = "";
      out.innerHTML = "";
    });
    document.getElementById("missedSkip").addEventListener("click", function () { out.innerHTML = ""; });
  });

  renderResume();
  renderLinkedin();
  renderBrand();
})();
