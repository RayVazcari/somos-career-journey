(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);

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
     Node reveal — fade/rise in as each stage enters the viewport
     ------------------------------------------------------------------ */
  var nodes = gsap.utils.toArray(".node:not(.node--current)");
  nodes.forEach(function (node) {
    gsap.to(node, {
      opacity: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.45,
      ease: "power2.out",
      scrollTrigger: {
        trigger: node,
        start: "top 88%",
        toggleActions: "play none none reverse"
      }
    });
  });

  /* current node reveals immediately (it's the anchor of the page) */
  var currentNode = document.querySelector(".node--current");
  if (currentNode) {
    gsap.to(currentNode, {
      opacity: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: currentNode,
        start: "top 90%",
        toggleActions: "play none none reverse"
      }
    });
  }

  /* ------------------------------------------------------------------
     Connector draw — the spine fills in as it scrolls into view
     ------------------------------------------------------------------ */
  var connectors = gsap.utils.toArray("[data-connector]");
  connectors.forEach(function (line) {
    gsap.to(line, {
      scaleY: 1,
      duration: reduceMotion ? 0.01 : 0.5,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: line,
        start: "top 92%",
        toggleActions: "play none none reverse"
      }
    });
  });

  /* ------------------------------------------------------------------
     Fork / merge branch bars — SVG path draw
     ------------------------------------------------------------------ */
  function drawPaths(selector, triggerEl) {
    var paths = gsap.utils.toArray(selector);
    if (!paths.length) return;
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: reduceMotion ? 0.01 : 0.6,
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
  var mergeBar = document.querySelector(".merge-bar");
  if (forkBar) drawPaths("[data-fork-path]", forkBar);
  if (mergeBar) drawPaths("[data-merge-path]", mergeBar);

  /* ------------------------------------------------------------------
     Fork cards — staggered reveal + progress bar fill
     ------------------------------------------------------------------ */
  var forkCards = gsap.utils.toArray("[data-fork-card]");
  if (forkCards.length) {
    gsap.to(forkCards, {
      opacity: 1,
      y: 0,
      duration: reduceMotion ? 0.01 : 0.45,
      ease: "back.out(1.5)",
      stagger: 0.1,
      scrollTrigger: {
        trigger: ".fork-grid",
        start: "top 85%",
        toggleActions: "play none none reverse",
        onEnter: fillBars,
        onEnterBack: fillBars
      }
    });
  }

  function fillBars() {
    document.querySelectorAll("[data-fill]").forEach(function (bar) {
      var pct = bar.getAttribute("data-fill");
      bar.style.width = pct + "%";
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

  /* ------------------------------------------------------------------
     "Coming soon" toast — for nodes/pills not yet built
     ------------------------------------------------------------------ */
  var toastStack = document.getElementById("toastStack");

  function showToast(title, body, opts) {
    opts = opts || {};
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML =
      '<span class="toast-icon">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l2.5 2.5"></path></svg>' +
      '</span>' +
      '<div style="flex:1"><strong>' + title + '</strong><p>' + body + '</p></div>' +
      '<button class="toast-close" aria-label="Dismiss">&times;</button>';

    toastStack.appendChild(toast);
    gsap.fromTo(toast,
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: reduceMotion ? 0.01 : 0.35, ease: "power2.out" }
    );

    function dismiss() {
      gsap.to(toast, {
        opacity: 0, x: -16, duration: 0.2, ease: "power1.in",
        onComplete: function () { toast.remove(); }
      });
    }

    toast.querySelector(".toast-close").addEventListener("click", dismiss);
    if (!opts.persist) {
      setTimeout(dismiss, 4200);
    }
  }

  document.querySelectorAll("[data-coming-soon]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var screen = el.getAttribute("data-coming-soon");
      showToast("Not built yet", "The " + screen + " screen is next up — check back soon.");
    });
  });

  var feedbackBtn = document.getElementById("feedbackBtn");
  if (feedbackBtn) {
    feedbackBtn.addEventListener("click", function () {
      showToast("Feedback", "This is a concept prototype — feedback capture isn't wired up yet.");
    });
  }

  window.SomosToast = showToast; // reused by milestone celebrations on later screens
})();
