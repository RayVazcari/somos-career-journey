(function () {
  "use strict";

  var S = window.SomosState;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function toast(t, b) { if (window.SomosToast) window.SomosToast(t, b); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function strip(s) { return (s || "").trim().replace(/[.\s]+$/, ""); }
  function sentence(s) { s = strip(s); return s ? cap(s) + "." : ""; }
  function ph(text) { return '<span class="ph">' + esc(text) + "</span>"; }
  function slug(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  /* How each completed item reads on a resume — worded as what the
     person DID, and only ever for items they've actually checked off. */
  var RESUME_LINE = {
    lifecycle: "Completed Understand Product Lifecycle",
    agile: "Completed Agile Fundamentals",
    jira: "Completed Jira Fundamentals",
    sql: "Completed SQL Basics coursework",
    aws: "Earned AWS Cloud Practitioner certification",
    lab: "Completed the SOMOS Product Lab",
    volunteer: "Volunteered on a SOMOS community project",
    casestudy: "Wrote and published a product case study",
    chapter: "Active member, SOMOS local chapter",
    ama: "Attended a Product Management AMA hosted by SOMOS",
    mentor: "Matched with a SOMOS mentor",
    chat: "Held an informational interview with a working professional in the field"
  };

  /* ------------------------------------------------------------------
     The draft — assembled from the engine every time it renders
     ------------------------------------------------------------------ */
  var newest = -1; // index in prepare.added to flash once

  function build() {
    var p = S.persona();
    var d = S.data.prepare.details;
    var role = p.role;

    var summary = "Aspiring " + role +
      (p.bg ? " with a background in " + p.bg : "") +
      (p.enjoys.length ? ", drawn to " + S.list(p.enjoys) : "") + ". " +
      "Building skills through SOMOS.tech’s Starting in Tech program.";

    var somos = p.doneItems.map(function (i) { return RESUME_LINE[i.id]; }).filter(Boolean);
    var certs = p.doneItems.filter(function (i) { return i.cert; }).map(function (i) { return i.title; });
    var skills = p.skills.length ? p.skills.join(" · ") : "";

    return {
      p: p, d: d, role: role, summary: summary, somos: somos,
      bullet: sentence(p.experience),
      certs: certs.join(", "), skills: skills,
      line: [d.location, "linkedin.com/in/" + (slug(d.name) || "your-name")].filter(Boolean).join(" · ")
    };
  }

  /* ---------------- resume rendering ---------------- */
  function renderResume() {
    var b = build();
    var d = b.d;
    var el = document.getElementById("docResume");
    var added = S.data.prepare.added;

    var jobRow = (d.jobTitle ? esc(d.jobTitle) : ph("Your most recent role — add it in “Your details”")) +
      "</span><span>" + (d.jobDates ? esc(d.jobDates) : ph("Dates"));
    var bullets = b.bullet
      ? "<li>" + esc(b.bullet) + ' <span class="ph">(from your Discovery answer — sharpen it with the XYZ builder)</span></li>'
      : '<li>' + ph("Answer AI Discovery and your day-to-day shows up here, in your own words.") + "</li>";
    var somos = b.somos.length
      ? b.somos.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("")
      : "<li>" + ph("Check off items on My Journey and they appear here as things you actually did.") + "</li>";
    var extra = "";
    if (added.length) {
      extra =
        '<div class="paper-job"><h3 class="paper-h">ADDITIONAL EXPERIENCE</h3><ul class="paper-bullets">' +
        added.map(function (t, i) { return '<li' + (i === newest ? ' class="is-new"' : "") + ">" + esc(t) + "</li>"; }).join("") +
        "</ul></div>";
    }

    el.innerHTML =
      '<div class="paper-top"><div><div class="paper-name">' + (d.name ? esc(d.name) : ph("Your name")) + '</div><div class="paper-line">' + esc(b.line) + "</div></div>" +
      '<button type="button" class="ln-btn ln-btn--primary" id="dlResume">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06251C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Download resume</button></div>' +
      '<div class="paper-summary">' + esc(b.summary) + "</div>" +
      '<div class="paper-job"><h3 class="paper-h">EXPERIENCE</h3>' +
      '<div class="paper-job-row"><span>' + jobRow + "</span></div>" +
      '<ul class="paper-bullets">' + bullets + "</ul></div>" +
      '<div class="paper-job"><h3 class="paper-h">SOMOS.TECH — STARTING IN TECH</h3><ul class="paper-bullets">' + somos + "</ul></div>" +
      extra +
      '<div class="paper-cols">' +
      "<div><b>Education</b><span>" + (d.education ? esc(d.education) : ph("Add in “Your details”")) + "</span></div>" +
      "<div><b>Certifications</b><span>" + (b.certs ? esc(b.certs) : ph("None earned yet")) + "</span></div>" +
      "<div><b>Skills</b><span>" + (b.skills ? esc(b.skills) : ph("Builds as you learn")) + "</span></div></div>";
    document.getElementById("dlResume").addEventListener("click", downloadResume);
  }

  function downloadResume() {
    var b = build(), d = b.d;
    var L = [d.name || "YOUR NAME", b.line, "", "SUMMARY", b.summary, "", "EXPERIENCE",
      (d.jobTitle || "[Your most recent role]") + " (" + (d.jobDates || "dates") + ")"];
    if (b.bullet) L.push("  - " + b.bullet);
    L.push("", "SOMOS.TECH - STARTING IN TECH");
    b.somos.forEach(function (t) { L.push("  - " + t); });
    if (S.data.prepare.added.length) {
      L.push("", "ADDITIONAL EXPERIENCE");
      S.data.prepare.added.forEach(function (t) { L.push("  - " + t); });
    }
    L.push("", "EDUCATION: " + (d.education || "[add]"), "CERTIFICATIONS: " + (b.certs || "none yet"), "SKILLS: " + (b.skills || "[add]"));
    var blob = new Blob([L.join("\n")], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var fname = (slug(d.name) || "my") + "-resume.txt";
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Resume downloaded", "Saved as " + fname + ", including anything you added here.");
    S.update(function (s) { s.prepare.resumeDownloaded = true; });
  }

  /* ---------------- LinkedIn ---------------- */
  function linkedinFields() {
    var b = build(), p = b.p, d = b.d;
    var topSkill = p.skills.filter(function (s) { return ["Agile", "Jira", "SQL"].indexOf(s) > -1; })[0];
    var todo = S.ITEMS.filter(function (i) { return i.track === "learn" && !S.data.items[i.id]; }).slice(0, 2).map(function (i) { return i.title; });

    var headline = "Aspiring " + b.role + (p.bg ? " | " + cap(p.bg) + " background" : "") + (topSkill ? " | " + topSkill : "");
    var about =
      (p.bg ? "My background is in " + p.bg + ". " : "") +
      (b.bullet ? b.bullet + " " : "") +
      "I’m moving into " + b.role + (p.enjoys.length ? " because I enjoy " + S.list(p.enjoys) : "") + ". " +
      (todo.length ? "Currently building skills in " + S.list(todo) + " " : "Building skills ") + "through SOMOS.tech’s Starting in Tech program.";
    var experience = d.jobTitle
      ? d.jobTitle + (d.jobDates ? " (" + d.jobDates + ")" : "") + "." + (b.bullet ? " " + b.bullet : "")
      : "Add your most recent role in “Your details” above and it will appear here.";
    return [
      ["headline", "HEADLINE", headline],
      ["about", "ABOUT", about],
      ["experience", "EXPERIENCE", experience],
      ["featured", "FEATURED", "Nothing to feature yet — pin your SOMOS Product Lab case study here once it’s built.", true]
    ];
  }

  function renderLinkedin() {
    var el = document.getElementById("docLinkedin");
    var fields = linkedinFields();
    var copied = S.data.prepare.copied;

    var howto =
      '<div class="li-howto"><div class="li-howto-title">How to use this &mdash; it takes about 3 minutes</div><ol>' +
      '<li><b>Open your profile.</b> <a href="https://www.linkedin.com/in/me" target="_blank" rel="noopener noreferrer">Open LinkedIn &#8599;</a> &mdash; signed in, it lands on your own profile.</li>' +
      '<li><b>Edit a section.</b> Click the pencil beside your headline, About, or an Experience entry.</li>' +
      '<li><b>Copy, paste, make it yours.</b> Press <em>Copy</em> on a field below, paste it in, and change anything that doesn&rsquo;t sound like you.</li>' +
      '<li><b>Save.</b> Nothing is posted for you &mdash; LinkedIn stays entirely yours.</li>' +
      "</ol></div>";

    el.innerHTML = howto + fields.map(function (f) {
      var isCopied = copied.indexOf(f[0]) > -1;
      return '<div class="li-field"><div class="li-field-head"><span class="li-field-name">' + f[1] + "</span>" +
        (f[3] ? "" : '<button type="button" class="ln-btn ln-btn--small' + (isCopied ? " is-copied" : "") + '" data-copy="' + f[0] + '">' + (isCopied ? "Copied ✓" : "Copy") + "</button>") +
        '</div><p class="li-field-text' + (f[3] ? " is-note" : "") + '">' + esc(f[2]) + "</p></div>";
    }).join("");

    el.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-copy");
        var text = linkedinFields().filter(function (f) { return f[0] === key; })[0][2];
        var done = function () {
          toast("Copied", "Now paste it into the matching section of your LinkedIn profile.");
          S.update(function (s) { if (s.prepare.copied.indexOf(key) < 0) s.prepare.copied.push(key); });
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
        else done();
      });
    });
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
    S.update(function (s) { s.prepare.added.push(text); });
    newest = S.data.prepare.added.length - 1;
    renderResume();
    showTab("resume");
    toast("Added to your resume", "It’s under “Additional experience” — and in the download.");
  }

  /* ---------------- your details ---------------- */
  var IDS = { dName: "name", dLoc: "location", dEdu: "education", dRole: "jobTitle", dDates: "jobDates" };
  Object.keys(IDS).forEach(function (id) {
    var input = document.getElementById(id);
    input.value = S.data.prepare.details[IDS[id]] || "";
    input.addEventListener("input", function () {
      S.update(function (s) { s.prepare.details[IDS[id]] = input.value; }, { silent: true });
    });
  });
  document.getElementById("detailsNote").textContent = S.mode === "example"
    ? "Pre-filled from the example profile. Edit anything — it updates the draft below as you type."
    : "Only you know these, so we never guess. They appear on your resume exactly as you type them.";
  document.getElementById("draftBadge").textContent = S.mode === "example" ? "drafted from Alex’s journey" : "built from your answers";

  /* ---------------- XYZ builder ---------------- */
  var fx = document.getElementById("xyzX"), fy = document.getElementById("xyzY"), fz = document.getElementById("xyzZ");
  var prev = document.getElementById("xyzPreview"), addBtn = document.getElementById("xyzAdd");

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
  var CIRCLE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="10"></circle>';
  function brandRows() {
    var pr = S.data.prepare;
    return [
      { key: "linkedin", text: pr.copied.length ? "LinkedIn — draft copied" : "LinkedIn — copy your draft from the LinkedIn tab above", done: pr.copied.length > 0, locked: true },
      { key: "github", text: "GitHub profile — pin your Lab project once it’s built", done: pr.brand.github },
      { key: "portfolio", text: "Portfolio site — optional, but strong for career changers", done: pr.brand.portfolio }
    ];
  }
  function renderBrand() {
    var host = document.getElementById("brandList");
    host.innerHTML = brandRows().map(function (b) {
      return '<div class="brand-row' + (b.done ? " is-done" : "") + '" data-b="' + b.key + '" role="checkbox" aria-checked="' + b.done + '"' + (b.locked ? ' aria-disabled="true"' : "") + ' tabindex="0">' +
        CIRCLE + (b.done ? '<path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"></path>' : "") + "</svg><span>" + esc(b.text) + "</span></div>";
    }).join("");
    host.querySelectorAll("[data-b]").forEach(function (row) {
      function tog() {
        var key = row.getAttribute("data-b");
        if (key === "linkedin") return;
        S.update(function (s) { s.prepare.brand[key] = !s.prepare.brand[key]; });
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
      return { fit: true, msg: "Worth including. Teaching or coaching shows you can explain complex things and develop people — exactly what cross-team work asks for. Make it stronger by adding how many people and what changed (the XYZ builder above is built for this)." };
    }
    if (/lead|manag|captain|organi[sz]|event|volunteer|coordinat/.test(t)) {
      return { fit: true, msg: "Worth including. Organizing people or events is coordination work, which is the core of Product Operations. Add the scale (people, budget, frequency) so it reads as impact, not just a task." };
    }
    if (/bilingual|spanish|translat|interpret/.test(t)) {
      return { fit: true, msg: "Worth including — as a skill, not a job. Bilingual communication is valuable on community-facing teams. It fits best in your Skills line, with a one-line example of using it." };
    }
    return { fit: false, msg: "Honest take: on its own this isn’t an obvious fit for the role. It earns a spot only if you can attach a measurable result or a skill a hiring manager would care about. Not sure? Leave it off — a tight resume beats a crowded one." };
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

  /* The draft and checklist follow the engine — edit your details or
     check off a Journey item elsewhere and this stays in sync. */
  document.addEventListener("somos:change", function () {
    renderResume();
    renderLinkedin();
    renderBrand();
  });

  renderResume();
  renderLinkedin();
  renderBrand();
})();
