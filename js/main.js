(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     Progress math — every stage's number comes from js/progress-data.js,
     the one shared file every page reads (see that file's comment for
     why). This page no longer hardcodes any percentage in its own
     markup; it looks each card's value up by data-stage-key/data-track
     and writes data-pct itself, so everything downstream (labels, bar
     fills, the overall average) still works unchanged.
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

  /* "My Career Journey" shows its OWN number — the sum of its three
     direct children (Learn + Build + Connect) — which is a different,
     narrower figure than the whole-path average above. It's computed
     from data-pct on the matching [data-track] cards, not hardcoded, so
     it can't drift out of sync with them either. Clamped at 100 so a
     later state where the tracks add past 100 still displays sanely. */
  var trackValues = {};
  document.querySelectorAll("[data-track]").forEach(function (el) {
    trackValues[el.getAttribute("data-track")] = Number(el.getAttribute("data-pct"));
  });
  document.querySelectorAll("[data-pct-of]").forEach(function (el) {
    var keys = el.getAttribute("data-pct-of").split(",");
    var vals = keys
      .map(function (k) { return trackValues[k.trim()]; })
      .filter(function (v) { return v !== undefined; });
    if (!vals.length) return;
    var total = Math.min(100, vals.reduce(function (a, b) { return a + b; }, 0));
    var label = el.querySelector(".pct-label");
    if (label) label.textContent = total + "%";
    var fill = el.querySelector(".pct-fill");
    if (fill) fill.dataset.target = total;
  });

  var overall = window.SomosProgress ? window.SomosProgress.overall : 0;

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
