(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  /* ------------------------------------------------------------------
     Toast system — shared across every screen. Used today for
     "not built yet" (data-coming-soon) and the feedback button;
     reused later for milestone celebrations on the Dashboard.
     ------------------------------------------------------------------ */
  var toastStack = document.getElementById("toastStack");

  function showToast(title, body, opts) {
    if (!toastStack) return;
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

    if (hasGsap) {
      gsap.fromTo(toast,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: reduceMotion ? 0.01 : 0.35, ease: "power2.out" }
      );
    }

    function dismiss() {
      if (hasGsap) {
        gsap.to(toast, {
          opacity: 0, x: -16, duration: 0.2, ease: "power1.in",
          onComplete: function () { toast.remove(); }
        });
      } else {
        toast.remove();
      }
    }

    toast.querySelector(".toast-close").addEventListener("click", dismiss);
    if (!opts.persist) {
      setTimeout(dismiss, 4200);
    }
  }

  /* A node/pill with both data-href and data-coming-soon has been
     built for real — navigate there instead of showing the toast.
     Keeping data-coming-soon on it too means no HTML has to change
     again once the next screen after it gets built. */
  document.querySelectorAll("[data-coming-soon]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var href = el.getAttribute("data-href");
      if (href) { window.location.href = href; return; }
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

  window.SomosToast = showToast;
})();
