(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  /* ------------------------------------------------------------------
     1. Atmosphere — scroll-linked light pools + grain
     ------------------------------------------------------------------ */
  var atmos = document.createElement("div");
  atmos.className = "atmos";
  atmos.setAttribute("aria-hidden", "true");
  var grain = document.createElement("div");
  grain.className = "atmos__grain";
  grain.setAttribute("aria-hidden", "true");
  document.body.insertBefore(grain, document.body.firstChild);
  document.body.insertBefore(atmos, document.body.firstChild);

  if (!reduceMotion) {
    var ticking = false;
    var updateScroll = function () {
      var max = root.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty("--p", p.toFixed(4));
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
    }, { passive: true });
    window.addEventListener("resize", updateScroll);
    updateScroll();
  }

  /* ------------------------------------------------------------------
     2. Cursor spotlight on cards — the light eases toward the pointer
        and eases out after it leaves, instead of snapping.
     ------------------------------------------------------------------ */
  var CARD_SEL = ".ln-card, .tip, .q-card, .path-card, .board, .apply-tips, .plan-box, " +
    ".rm-phase, .rm-launch, .track-card, .profile-card, .profile-panel, " +
    ".chat-panel, .role-card, .fork-card";

  if (finePointer && !reduceMotion) {
    var lit = new Map(); // card -> {x,y,tx,ty,s,ts}
    var raf = 0;

    var frame = function () {
      raf = 0;
      lit.forEach(function (st, card) {
        st.x += (st.tx - st.x) * 0.18;
        st.y += (st.ty - st.y) * 0.18;
        st.s += (st.ts - st.s) * 0.14;
        card.style.setProperty("--mx", st.x.toFixed(1) + "px");
        card.style.setProperty("--my", st.y.toFixed(1) + "px");
        card.style.setProperty("--spot", st.s.toFixed(3));
        if (st.ts === 0 && st.s < 0.01) {
          card.style.removeProperty("--mx");
          card.style.removeProperty("--my");
          card.style.removeProperty("--spot");
          lit.delete(card);
        }
      });
      if (lit.size) raf = requestAnimationFrame(frame);
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };

    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(CARD_SEL);
      lit.forEach(function (st, c) { if (c !== card) st.ts = 0; });
      if (!card) { kick(); return; }
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var st = lit.get(card);
      if (!st) { st = { x: x, y: y, tx: x, ty: y, s: 0, ts: 1 }; lit.set(card, st); }
      st.tx = x; st.ty = y; st.ts = 1;
      kick();
    }, { passive: true });

    document.addEventListener("pointerleave", function () {
      lit.forEach(function (st) { st.ts = 0; });
      kick();
    });
  }

  /* ------------------------------------------------------------------
     3. Magnetic primary actions — leans a few px toward the cursor,
        springs back on leave. Uses the independent `translate` property
        so it never fights the hover/press transforms.
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".ln-btn--primary, .ln-next").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.translate = (dx * 4).toFixed(2) + "px " + (dy * 3).toFixed(2) + "px";
      });
      el.addEventListener("pointerleave", function () {
        var from = el.style.translate || "0px 0px";
        el.style.translate = "";
        if (el.animate) {
          el.animate(
            [{ translate: from }, { translate: "0px 0px" }],
            { duration: 520, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
          );
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     4. Arrow glyphs get their own span so they can lead on hover
     ------------------------------------------------------------------ */
  document.querySelectorAll(".ln-btn, .ln-next, .rm-launch-go, .brand-review").forEach(function (el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [], n;
    while ((n = walker.nextNode())) { if (n.nodeValue.indexOf("→") !== -1) nodes.push(n); }
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split("→");
      var frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
          var s = document.createElement("span");
          s.className = "arr";
          s.setAttribute("aria-hidden", "true");
          s.textContent = "→";
          frag.appendChild(s);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  });

  /* ------------------------------------------------------------------
     5. (Number count-ups now live in shell.js, where the numbers do.)
        Navigating away mid page-fade makes the browser log a harmless
        "Transition was skipped" rejection — keep the console clean.
     ------------------------------------------------------------------ */
  window.addEventListener("unhandledrejection", function (e) {
    if (e.reason && e.reason.name === "AbortError") e.preventDefault();
  });

  /* ------------------------------------------------------------------
     6. Completing a checklist item settles with a little spring.
        The lists re-render their markup on every toggle, so remember
        WHICH checkbox was hit (by document order) and decorate the
        fresh node once it exists.
     ------------------------------------------------------------------ */
  var CB_SEL = '[role="checkbox"]';
  var pendingIndex = -1;

  function markToggle(e) {
    var cb = e.target.closest && e.target.closest(CB_SEL);
    if (!cb) return;
    if (e.type === "keydown" && e.key !== " " && e.key !== "Enter") return;
    pendingIndex = Array.prototype.indexOf.call(document.querySelectorAll(CB_SEL), cb);
    setTimeout(settle, 0);
  }

  function settle() {
    if (pendingIndex < 0) return;
    var cb = document.querySelectorAll(CB_SEL)[pendingIndex];
    pendingIndex = -1;
    if (!cb || cb.getAttribute("aria-checked") !== "true" || reduceMotion) return;

    cb.classList.remove("just-checked");
    void cb.offsetWidth; // restart the animation
    cb.classList.add("just-checked");
    setTimeout(function () { cb.classList.remove("just-checked"); }, 900);

    // Draw the tick in, if this checkbox has one.
    var tick = cb.querySelector(".icon-check path, .icon-check polyline, svg path[d^='M9 12'], svg polyline");
    if (tick && tick.getTotalLength && tick.animate) {
      var len = tick.getTotalLength();
      tick.animate(
        [{ strokeDasharray: len, strokeDashoffset: len }, { strokeDasharray: len, strokeDashoffset: 0 }],
        { duration: 380, delay: 90, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "backwards" }
      );
    }
  }

  document.addEventListener("click", markToggle, true);
  document.addEventListener("keydown", markToggle, true);
})();
