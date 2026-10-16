(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);

  var S = window.SomosState;

  /* ------------------------------------------------------------------
     Stage states — derived, not hard-coded. The first unfinished stage
     on the main path is "you are here"; finished ones are teal and
     solid; everything ahead is dashed. Prepare / Practice / Apply stay
     open anytime (never locked), they just read as "not done yet".
     ------------------------------------------------------------------ */
  var GLYPH = {
    "ai-discovery": '<path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"></path>',
    "compare": '<rect x="3" y="4" width="7" height="16" rx="1.5"></rect><rect x="14" y="4" width="7" height="16" rx="1.5"></rect>',
    "goal": '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle><circle cx="12" cy="12" r="0.8" fill="currentColor"></circle>'
  };
  var CHECK_PATH = '<path d="M20 6L9 17l-5-5"></path>';

  function nodeFor(key) {
    return key === "journey" ? document.querySelector("[data-pct-of]") : document.querySelector('[data-stage-key="' + key + '"]');
  }

  (function applyStates() {
    var seq = ["ai-discovery", "compare", "goal", "journey"];
    var cur = -1;
    for (var i = 0; i < seq.length; i++) { if (S.pct(seq[i]) < 100) { cur = i; break; } }

    seq.forEach(function (key, idx) {
      var node = nodeFor(key);
      if (!node) return;
      var complete = S.pct(key) === 100;
      var isCurrent = idx === cur;
      node.classList.remove("node--done", "node--current", "node--upcoming");
      node.classList.add(complete ? "node--done" : isCurrent ? "node--current" : "node--upcoming");

      // "You are here" furniture exists only on the current node
      node.querySelectorAll(".pulse-ring, .here-tag").forEach(function (n) { n.remove(); });
      if (isCurrent) {
        var ring = document.createElement("span");
        ring.className = "pulse-ring";
        ring.setAttribute("data-pulse", "");
        var tag = document.createElement("span");
        tag.className = "here-tag";
        tag.innerHTML = '<span class="pulse-dot"></span>You are here';
        node.insertBefore(tag, node.firstChild);
        node.insertBefore(ring, node.firstChild);
      }

      // Icon: a check once done, the stage's own glyph while still ahead
      var icon = node.querySelector(".node-icon svg");
      if (icon && GLYPH[key]) {
        icon.innerHTML = complete ? CHECK_PATH : GLYPH[key];
        icon.setAttribute("stroke-width", complete ? "2.6" : "2.2");
      }

      var label = node.closest(".stage") && node.closest(".stage").querySelector(".stage-label");
      if (label) label.classList.toggle("is-current", isCurrent);

      // The connector after a finished stage is solid; otherwise dashed
      var stage = node.closest(".stage");
      var conn = stage && stage.nextElementSibling;
      if (conn && conn.classList.contains("connector")) {
        conn.classList.toggle("connector--solid", complete);
        conn.classList.toggle("connector--dashed", !complete);
      }
    });

    // The fork leaves the hub: dim it until the path reaches it
    var fork = document.querySelector(".fork-wrap");
    if (fork) fork.classList.toggle("is-ahead", S.pct("goal") < 100);

    var p = S.persona();
    var goalNode = nodeFor("goal");
    if (goalNode) {
      var gd = goalNode.querySelector(".node-desc");
      gd.innerHTML = p.goalSet
        ? 'Target: <strong>' + p.role + '</strong> &mdash; unlocks your personalized roadmap, nothing before this was locked in.'
        : 'Pick your target role &mdash; unlocks your personalized roadmap. Nothing before this is locked in, and you can change it later.';
    }
    var hub = nodeFor("journey");
    if (hub) {
      hub.querySelector(".node-desc").innerHTML =
        "Your home base &mdash; the average of Learn, Build and Connect below, tracked together, not as separate to-do lists.";
    }
    var reward = document.querySelector(".node--reward .node-desc");
    if (reward && S.data.apply.claimed) reward.innerHTML = "Pathfinder badge earned &mdash; every step behind it is something you actually did.";
  })();

  /* ------------------------------------------------------------------
     Progress math — every number comes from the one engine
     (js/state.js). This page writes no percentage of its own: it looks
     each card's value up by data-stage-key / data-track and writes
     data-pct, so labels, bar fills and the overall figure all agree
     with every other page.
     ------------------------------------------------------------------ */
  function applyLabel(el) {
    var key = el.getAttribute("data-stage-key") || el.getAttribute("data-track");
    var pct = key && window.SomosProgress ? window.SomosProgress.get(key) : null;
    if (pct === null || pct === undefined) return;
    el.setAttribute("data-pct", pct);
    var label = el.querySelector(".pct-label");
    if (label) label.textContent = pct + "%";
    var fill = el.querySelector(".pct-fill");
    if (fill) fill.dataset.target = pct;
  }

  var trackedStages = document.querySelectorAll("[data-stage-key], [data-track]");
  trackedStages.forEach(applyLabel);

  /* "My Career Journey" is the AVERAGE of its three tracks (Learn, Build,
     Connect). It used to be their sum, which only worked while nobody
     could change anything: finishing Learn alone would have read as
     100%. An average always means what it says. */
  document.querySelectorAll("[data-pct-of]").forEach(function (el) {
    var total = S.pct("journey");
    el.setAttribute("data-pct", total);
    var label = el.querySelector(".pct-label");
    if (label) label.textContent = total + "%";
    var fill = el.querySelector(".pct-fill");
    if (fill) fill.dataset.target = total;
  });

  var overall = S.overall;

  /* Overall path progress lives in its own standalone widget (.path-summary),
     never inside a stage card — keeping it physically separate is what
     stops it from being misread as any one stage's own number. */
  var overallLabel = document.querySelector("[data-overall-label]");
  if (overallLabel) overallLabel.textContent = overall + "%";

  var ring = document.querySelector("[data-ring-fill]");
  if (ring) {
    var circumference = 2 * Math.PI * 25; // matches r="25" in the SVG
    var offset = circumference * (1 - overall / 100);
    // rAF so the transition (not the initial paint) carries the motion
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ring.style.strokeDashoffset = String(offset);
      });
    });
  }

  function fillOnEnter(el) {
    var fill = el.querySelector(".pct-fill");
    if (!fill) return;
    fill.style.width = (fill.dataset.target || 0) + "%";
  }
  function unfillOnLeaveBack(el) {
    var fill = el.querySelector(".pct-fill");
    if (fill) fill.style.width = "0%";
  }

  /* ------------------------------------------------------------------
     Scroll cue — hide once the user starts scrolling
     ------------------------------------------------------------------ */
  var scrollCue = document.getElementById("scrollCue");
  if (scrollCue) {
    var cueHidden = false;
    window.addEventListener("scroll", function () {
      if (!cueHidden && window.scrollY > 80) {
        scrollCue.classList.add("is-hidden");
        cueHidden = true;
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Node reveal — fade/rise in as each stage enters the viewport,
     progress bar fills in step with it
     ------------------------------------------------------------------ */
  /* CSS deliberately declares no opacity/transform for .node — that's
     what let a variant's own resting opacity (.node--upcoming: 0.9,
     .node--reward: 0.88) silently outrank the shared hidden-state
     opacity:0 rule since both were plain class selectors and the
     variant came later in the stylesheet, so those cards never
     actually started hidden. Setting the hidden state here instead,
     then clearing it via clearProps on completion, means each card
     always settles back onto its own CSS resting value with nothing
     left to fight over. */
  var nodes = gsap.utils.toArray(".node:not(.node--current)");
  gsap.set(nodes, { opacity: 0, y: 14 });
  nodes.forEach(function (node) {
    gsap.to(node, {
      opacity: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.5,
      ease: "power2.out",
      onComplete: function () { gsap.set(node, { clearProps: "opacity,transform" }); },
      scrollTrigger: {
        trigger: node,
        start: "top 88%",
        toggleActions: "play none none reverse",
        onEnter: function () { fillOnEnter(node); },
        onEnterBack: function () { fillOnEnter(node); },
        onLeaveBack: function () { unfillOnLeaveBack(node); }
      }
    });
  });

  /* current node reveals immediately (it's the anchor of the page) */
  var currentNode = document.querySelector(".node--current");
  if (currentNode) {
    gsap.set(currentNode, { opacity: 0, y: 14 });
    gsap.to(currentNode, {
      opacity: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.55,
      ease: "power2.out",
      onComplete: function () { gsap.set(currentNode, { clearProps: "opacity,transform" }); },
      scrollTrigger: {
        trigger: currentNode,
        start: "top 90%",
        toggleActions: "play none none reverse",
        onEnter: function () { fillOnEnter(currentNode); },
        onEnterBack: function () { fillOnEnter(currentNode); },
        onLeaveBack: function () { unfillOnLeaveBack(currentNode); }
      }
    });
  }

  /* ------------------------------------------------------------------
     Connector draw — the spine fills in as it scrolls into view
     ------------------------------------------------------------------ */
  var connectors = gsap.utils.toArray("[data-connector]");
  connectors.forEach(function (line, i) {
    // stagger the ambient travel-pulse so the whole path feels like it's
    // flowing, rather than every segment blinking in lockstep
    line.style.setProperty("--travel-delay", (i * 0.18) + "s");
    gsap.to(line, {
      scaleY: 1,
      duration: reduceMotion ? 0.01 : 0.55,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: line,
        start: "top 92%",
        toggleActions: "play none none reverse"
      }
    });
  });

  /* ------------------------------------------------------------------
     Fork branch bar — SVG path draw (the merge bar was removed in
     favor of a single plain connector below the fork, so there's
     only one branching bar left to animate now)
     ------------------------------------------------------------------ */
  function drawPaths(selector, triggerEl) {
    var paths = gsap.utils.toArray(selector);
    if (!paths.length) return;
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: reduceMotion ? 0.01 : 0.65,
      ease: "power1.inOut",
      stagger: 0.08,
      scrollTrigger: {
        trigger: triggerEl,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  }

  var forkBar = document.querySelector(".fork-bar");
  if (forkBar) drawPaths("[data-fork-path]", forkBar);

  /* ------------------------------------------------------------------
     Fork cards — staggered pop-in reveal + progress bar fill
     ------------------------------------------------------------------ */
  var forkCards = gsap.utils.toArray("[data-fork-card]");
  if (forkCards.length) {
    gsap.set(forkCards, { opacity: 0, y: 14 });
    gsap.to(forkCards, {
      opacity: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.45,
      ease: "back.out(1.5)",
      stagger: 0.1,
      onComplete: function () { gsap.set(forkCards, { clearProps: "opacity,transform" }); },
      scrollTrigger: {
        trigger: ".fork-grid",
        start: "top 85%",
        toggleActions: "play none none reverse",
        onEnter: function () { forkCards.forEach(fillOnEnter); },
        onEnterBack: function () { forkCards.forEach(fillOnEnter); }
      }
    });
  }

  /* ------------------------------------------------------------------
     "You are here" glow — only animates while in view (perf + intent)
     ------------------------------------------------------------------ */
  var pulseRing = document.querySelector("[data-pulse]");
  if (pulseRing && !reduceMotion) {
    ScrollTrigger.create({
      trigger: currentNode,
      start: "top 95%",
      end: "bottom 5%",
      onEnter: function () { pulseRing.classList.add("is-animating"); },
      onLeave: function () { pulseRing.classList.remove("is-animating"); },
      onEnterBack: function () { pulseRing.classList.add("is-animating"); },
      onLeaveBack: function () { pulseRing.classList.remove("is-animating"); }
    });
  } else if (pulseRing) {
    pulseRing.classList.add("is-animating");
  }

  /* Toast system, "coming soon" wiring, and the feedback button live
     in common.js — shared by every screen, not just this one. */
})();
