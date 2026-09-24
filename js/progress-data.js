/* ==========================================================================
   Shared Career Profile data — the ONE place every page reads its
   stage percentages from. The Map's own HTML used to hardcode these
   as data-pct="20" etc. on each card; any other page that wanted to
   show the same number had to copy it by hand, which is exactly how
   the 42%-vs-45% mismatch happened earlier. Every page now sources
   from this file instead, so there is nothing left to drift.

   This is a static example profile (a persona partway through the
   program), not per-visitor tracked state — there's no backend yet,
   and wiring real cross-page persistence (e.g. localStorage) is a
   deliberate later step once more of the 8 screens exist, not
   something to half-build now. See 00-DESIGN-DECISIONS.md's "Shared
   Career Profile" and "Future" notes.
   ========================================================================== */
(function () {
  "use strict";

  var STAGES = {
    "ai-discovery": 100,
    "compare": 100,
    "goal": 100,
    "learn": 20,
    "build": 0,
    "connect": 25,
    "prepare": 0,
    "practice": 0,
    "apply": 0
  };

  var keys = Object.keys(STAGES);
  var sum = keys.reduce(function (total, k) { return total + STAGES[k]; }, 0);
  var overall = Math.round(sum / keys.length);

  window.SomosProgress = {
    stages: STAGES,
    overall: overall,
    get: function (key) { return STAGES.hasOwnProperty(key) ? STAGES[key] : null; }
  };
})();
