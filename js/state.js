/* ==========================================================================
   Career Journey — the one engine.

   Every screen reads from, and writes to, this file. No page keeps its own
   copy of an answer, a checked item or a percentage, which is what used to
   make the numbers disagree (Map said 20, Dashboard said 25, Roadmap said
   29, and so on).

   Two modes, one codebase:
     "example" — Alex Rivera, partway through. Pre-filled, so reviewers can
                 see what a journey looks like once it has some history.
     "demo"    — starts at 0%. Every real action moves the numbers.

   State lives in sessionStorage, so it survives page-to-page navigation
   and refresh, and resets when the tab closes. (Falls back to memory if
   storage is blocked.)

   Rules (each stage is 0–100, always derived, never typed in):
     ai-discovery  answered questions / 5
     compare       decisions made (set primary, "not for me", add) / 2
     goal          100 once a primary path is confirmed as your goal
     learn/build/connect   checked items / items in that track
     prepare       resume downloaded · LinkedIn field copied ·
                   achievement added · brand item checked  (4)
     practice      questions rehearsed (4) + a practice path chosen (1)
     apply         start date saved · job board opened · marked applied (3)
   My Career Journey = average of learn / build / connect.
   Overall program   = average of the 9 stages above.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "somos.journey.v2";

  /* ------------------------------------------------------------------
     Static content shared by several pages
     ------------------------------------------------------------------ */
  var ROLE_NAMES = {
    "prod-ops": "Product Operations Manager",
    "tpm": "Technical Program Manager",
    "platform": "Platform Engineer",
    "analyst": "Business Analyst",
    "csm": "Customer Success Manager",
    "ux": "UX Researcher"
  };

  var ITEMS = [
    // ---- Learn
    { id: "lifecycle", track: "learn", title: "Understand Product Lifecycle", type: "Course", length: "2 hrs", icon: "course",
      why: "Gives you the shared vocabulary every product-ops role assumes you already know." },
    { id: "agile", track: "learn", title: "Agile Fundamentals", type: "Course", length: "3 hrs", icon: "course",
      why: "Almost every tech team runs on some flavor of Agile.", skill: "Agile" },
    { id: "jira", track: "learn", title: "Jira Fundamentals", type: "Course", length: "2 hrs", icon: "course",
      why: "The tool you’ll actually use day-to-day to track work.", skill: "Jira" },
    { id: "sql", track: "learn", title: "SQL Basics", type: "Course", length: "6 hrs", icon: "course", priority: true,
      why: "Lets you pull your own data instead of waiting on an analyst.", reco: "your fastest path to a stronger Build score", skill: "SQL" },
    { id: "aws", track: "learn", title: "AWS Cloud Practitioner", type: "Certification", length: "~20 hrs", icon: "course",
      why: "A recognizable credential recruiters screen for, even outside cloud roles.", cert: true },
    // ---- Build
    { id: "lab", track: "build", title: "Complete SOMOS Product Lab", type: "Lab", length: "3 weeks", icon: "lab",
      why: "Your first real deliverable — becomes your resume bullet and portfolio piece." },
    { id: "volunteer", track: "build", title: "Volunteer on a SOMOS project", type: "Community", length: "Ongoing", icon: "people",
      why: "Hands-on experience without needing to be hired first." },
    { id: "casestudy", track: "build", title: "Create one case study", type: "Portfolio", length: "1 week", icon: "lab",
      why: "Turns the Lab project into something you can walk through in an interview." },
    // ---- Connect
    { id: "chapter", track: "connect", title: "Join your local SOMOS chapter", type: "Chapter", length: "Local", icon: "people",
      why: "Local meetups are where most mentor connections actually start." },
    { id: "ama", track: "connect", title: "Attend a Product Management AMA", type: "Event", length: "1 hr", icon: "people",
      why: "Direct access to working PMs — rare outside a paid program." },
    { id: "mentor", track: "connect", title: "Find a mentor", type: "Mentorship", length: "Program", icon: "people",
      why: "Mentored career changers move faster — and feel less alone doing it." },
    { id: "chat", track: "connect", title: "Talk to someone working in the role", type: "Conversation", length: "20 min", icon: "people",
      why: "One real conversation about the day-to-day beats hours of reading job posts." }
  ];

  var TRACK_META = {
    learn:   { name: "Learn",   completeTitle: "Learn complete",   completeBody: "Every course and cert is done. Your roadmap just got a lot more interesting." },
    build:   { name: "Build",   completeTitle: "Build complete",   completeBody: "Your hands-on proof is done — ready to turn it into interview stories." },
    connect: { name: "Connect", completeTitle: "Connect complete", completeBody: "You’ve built real relationships, not a contacts list — tailored to your target role." }
  };

  var STAGE_KEYS = ["ai-discovery", "compare", "goal", "learn", "build", "connect", "prepare", "practice", "apply"];

  var MILESTONES = {
    "ai-discovery": ["AI Discovery complete", "Your Career Profile is built. It now carries into Compare, your roadmap and your resume."],
    "compare": ["Comparison done", "You’ve weighed real options. Nothing is locked in — you can still change your mind."],
    "goal": ["Goal set", "Your target role is chosen. Your roadmap is now tailored to it."],
    "learn": [TRACK_META.learn.completeTitle, TRACK_META.learn.completeBody],
    "build": [TRACK_META.build.completeTitle, TRACK_META.build.completeBody],
    "connect": [TRACK_META.connect.completeTitle, TRACK_META.connect.completeBody],
    "prepare": ["Prepare complete", "Resume and LinkedIn are built from your real story, not a template."],
    "practice": ["Practice complete", "You’ve rehearsed the questions and picked a practice path."],
    "apply": ["Apply complete", "Start date set, boards searched, applications underway."]
  };

  var ENJOY_SKILL = {
    "Working with people": "Collaboration",
    "Organizing projects": "Coordination",
    "Analyzing information": "Analysis",
    "Solving technical problems": "Troubleshooting",
    "Research": "Research"
  };

  /* ------------------------------------------------------------------
     Starting states
     ------------------------------------------------------------------ */
  function baseCompare() {
    return { primary: "prod-ops", exploring: ["tpm", "platform"], more: ["analyst", "csm", "ux"], decisions: 0, goalConfirmed: false };
  }

  function emptyData() {
    return {
      discovery: { answers: { background: "", experience: "", enjoys: [], coding: [], priorities: [] } },
      compare: baseCompare(),
      items: {},
      prepare: {
        details: { name: "", location: "", education: "", jobTitle: "", jobDates: "" },
        added: [], resumeDownloaded: false, copied: [], brand: { github: false, portfolio: false }
      },
      practice: { rehearsed: [false, false, false, false], path: null, mockDone: false },
      apply: { startDate: null, boardsOpened: [], applied: false, claimed: false }
    };
  }

  function exampleData() {
    var d = emptyData();
    d.discovery.answers = {
      background: "Clinic and lab coordination in healthcare",
      experience: "Coordinated about 100 patient samples weekly between the clinic and the lab, and introduced a shared tracking sheet that ended lost handoffs between shifts.",
      enjoys: ["Organizing projects", "Analyzing information", "Research"],
      coding: ["A little curious"],
      priorities: ["Stability", "People leadership"]
    };
    d.compare.decisions = 2;
    d.compare.goalConfirmed = true;
    d.items = { agile: true, chapter: true };
    d.prepare.details = {
      name: "Alex Rivera", location: "San Antonio, TX", education: "B.S. Biology",
      jobTitle: "Clinic & Lab Coordinator — Regional Health Clinic", jobDates: "2023 – Present"
    };
    return d;
  }

  /* ------------------------------------------------------------------
     Storage
     ------------------------------------------------------------------ */
  var memory = null;
  function read() {
    try {
      var raw = window.sessionStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked — fall through to memory */ }
    return memory;
  }
  function write(obj) {
    memory = obj;
    try { window.sessionStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }

  var store = read();
  if (!store || !store.data) {
    // Nothing chosen yet: show the example so a deep link never lands on an empty page.
    store = { mode: "example", chosen: false, data: exampleData() };
  }
  var data = store.data;

  /* ------------------------------------------------------------------
     Derivations
     ------------------------------------------------------------------ */
  function ratio(n, total) { return Math.round((n / total) * 100); }

  function answeredCount() {
    var a = data.discovery.answers;
    var n = 0;
    if (a.background) n++;
    if (a.experience) n++;
    if (a.enjoys && a.enjoys.length) n++;
    if (a.coding && a.coding.length) n++;
    if (a.priorities && a.priorities.length) n++;
    return n;
  }

  function trackItems(track) {
    return ITEMS.filter(function (i) { return i.track === track; });
  }
  function trackDone(track) {
    return trackItems(track).filter(function (i) { return data.items[i.id]; }).length;
  }

  function stagePct(key) {
    switch (key) {
      case "ai-discovery": return ratio(answeredCount(), 5);
      case "compare": return ratio(Math.min(data.compare.decisions, 2), 2);
      case "goal": return data.compare.goalConfirmed ? 100 : 0;
      case "learn": case "build": case "connect":
        return ratio(trackDone(key), trackItems(key).length);
      case "prepare": {
        var p = data.prepare;
        var n = (p.resumeDownloaded ? 1 : 0) + (p.copied.length ? 1 : 0) + (p.added.length ? 1 : 0) +
                ((p.brand.github || p.brand.portfolio) ? 1 : 0);
        return ratio(n, 4);
      }
      case "practice": {
        var r = data.practice.rehearsed.filter(Boolean).length + (data.practice.path ? 1 : 0);
        return ratio(r, 5);
      }
      case "apply": {
        var a = data.apply;
        var m = (a.startDate ? 1 : 0) + (a.boardsOpened.length ? 1 : 0) + (a.applied ? 1 : 0);
        return ratio(m, 3);
      }
      case "journey":
        return Math.round((stagePct("learn") + stagePct("build") + stagePct("connect")) / 3);
    }
    return 0;
  }

  function allStages() {
    var o = {};
    STAGE_KEYS.forEach(function (k) { o[k] = stagePct(k); });
    return o;
  }
  function overall() {
    var s = allStages(), t = 0;
    STAGE_KEYS.forEach(function (k) { t += s[k]; });
    return Math.round(t / STAGE_KEYS.length);
  }

  function lc(s) { return (s || "").trim().replace(/[.\s]+$/, "").toLowerCase(); }
  function list(arr) {
    if (!arr.length) return "";
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
  }

  /* Short, honest facts the other pages build copy from. */
  function persona() {
    var a = data.discovery.answers;
    var d = data.prepare.details;
    var skills = [];
    (a.enjoys || []).forEach(function (e) { if (ENJOY_SKILL[e] && skills.indexOf(ENJOY_SKILL[e]) === -1) skills.push(ENJOY_SKILL[e]); });
    var doneItems = ITEMS.filter(function (i) { return data.items[i.id]; });
    doneItems.forEach(function (i) { if (i.skill && skills.indexOf(i.skill) === -1) skills.push(i.skill); });
    return {
      name: d.name,
      role: ROLE_NAMES[data.compare.primary],
      goalSet: data.compare.goalConfirmed,
      bg: lc(a.background),
      experience: (a.experience || "").trim(),
      enjoys: (a.enjoys || []).map(lc),
      skills: skills,
      doneItems: doneItems,
      hasDiscovery: answeredCount() > 0
    };
  }

  function nextItem() {
    var todo = ITEMS.filter(function (i) { return !data.items[i.id]; });
    for (var i = 0; i < todo.length; i++) if (todo[i].priority) return todo[i];
    return todo[0] || null;
  }

  /* ------------------------------------------------------------------
     Change detection → milestone toasts + broadcast
     ------------------------------------------------------------------ */
  var last = allStages();

  function persist() { write(store); }

  function commit(silent) {
    persist();
    var now = allStages();
    var reached = [];
    STAGE_KEYS.forEach(function (k) {
      if (now[k] === 100 && last[k] !== 100) reached.push(k);
    });
    last = now;
    document.dispatchEvent(new CustomEvent("somos:change", { detail: { reached: reached } }));
    if (!silent && window.SomosToast) {
      reached.forEach(function (k) {
        var m = MILESTONES[k];
        if (m) window.SomosToast(m[0], m[1], { persist: true });
      });
    }
  }

  var api = {
    ITEMS: ITEMS, TRACK_META: TRACK_META, ROLE_NAMES: ROLE_NAMES, STAGE_KEYS: STAGE_KEYS,
    get data() { return data; },
    get mode() { return store.mode; },
    get chosen() { return store.chosen; },
    trackItems: trackItems,
    trackDone: trackDone,
    pct: stagePct,
    stages: allStages,
    get overall() { return overall(); },
    persona: persona,
    nextItem: nextItem,
    answeredCount: answeredCount,
    roleName: function (id) { return ROLE_NAMES[id || data.compare.primary]; },
    list: list,
    lc: lc,

    /* Apply a change. `fn` mutates the data object directly. */
    update: function (fn, opts) {
      fn(data);
      commit(opts && opts.silent);
    },

    /* Start a fresh run in the given mode. */
    start: function (mode) {
      store = { mode: mode, chosen: true, data: mode === "example" ? exampleData() : emptyData() };
      data = store.data;
      last = allStages();
      persist();
    },
    restart: function () { api.start(store.mode); },
    markChosen: function () { store.chosen = true; persist(); }
  };

  window.SomosState = api;

  /* Back-compat for anything still reading the old shared-progress object. */
  window.SomosProgress = {
    get stages() { return allStages(); },
    get overall() { return overall(); },
    get: function (key) { return STAGE_KEYS.indexOf(key) > -1 || key === "journey" ? stagePct(key) : null; }
  };
})();
