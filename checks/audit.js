/* ==========================================================================
   Quality audit — run it on ANY page (prototype or the ported site).

   Use: open the page, open the browser console, paste this whole file, then run
        somosAudit()            // desktop checks
        somosAudit({ touch: true })   // stricter 44px target check (use at phone width)
   It prints a summary and returns the details. Zero "problems" = same bar the
   prototype was held to. It measures; it doesn't judge taste (compare the screenshots
   in docs/screens for that).

   What it checks, and why:
   - Text contrast >= 4.5:1 (3:1 for large text), against the real stacked background
   - Exactly one <h1>, and a heading outline (role="heading" counts)
   - Every button / link / checkbox / tab has an accessible name
   - Every form field has a label
   - Interactive targets >= 24px (>= 44px with {touch:true}); a checkbox is judged by its whole label
   - Form fields >= 16px on small screens (below that, iOS zooms the page on focus)
   - Smallest text size (flag anything under 11px)
   - No horizontal scrolling
   - <html lang>, a <title>, a meta description, og:title
   Limitation: text over gradients/images is measured against the nearest solid colour.
   ========================================================================== */
window.somosAudit = function (opts) {
  opts = opts || {};
  var minTarget = opts.touch ? 44 : 24;
  var problems = [];

  var parse = function (c) {
    var m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  var over = function (t, b) { return { r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 }; };
  var lum = function (c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  var ratio = function (a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  var pageBg = parse(getComputedStyle(document.body).backgroundColor);
  var base = pageBg && pageBg.a > 0 ? pageBg : { r: 10, g: 30, b: 51, a: 1 };
  var bgOf = function (el) {
    var stack = [];
    for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
      var c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) stack.push(c);
      if (c && c.a === 1) break;
    }
    var b = base; for (var i = stack.length - 1; i >= 0; i--) b = over(stack[i], b); return b;
  };
  var q = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var visible = function (e) { var r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  var label = function (e) { return ((e.className && e.className.baseVal === undefined ? e.className : "") + " " + (e.textContent || e.id || e.tagName)).trim().slice(0, 48); };

  // 1. contrast + smallest type
  var seen = {}, textCount = 0, minFont = 99;
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
  while ((n = walker.nextNode())) {
    var t = n.nodeValue.trim(); if (!t) continue;
    var el = n.parentElement; if (!el || el.closest("script,style,[hidden],[aria-hidden=true]")) continue;
    var cs = getComputedStyle(el);
    if (!visible(el) || parseFloat(cs.opacity) === 0) continue;
    textCount++;
    var fs = parseFloat(cs.fontSize); minFont = Math.min(minFont, fs);
    var bg = bgOf(el), fg = parse(cs.color); if (!fg) continue;
    var cr = ratio(over(fg, bg), bg);
    var large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    if (cr < (large ? 3 : 4.5)) {
      var key = cs.color + "|" + t.slice(0, 18);
      if (!seen[key]) { seen[key] = 1; problems.push("Low contrast " + cr.toFixed(2) + ":1 (" + fs + "px) \"" + t.slice(0, 40) + "\""); }
    }
  }
  if (minFont < 11) problems.push("Text as small as " + minFont + "px (keep >= 11px)");

  // 2. headings
  var heads = q("h1,h2,h3,h4,[role=heading]").filter(visible);
  var h1s = q("h1").filter(visible).length;
  if (h1s !== 1) problems.push("Expected exactly one <h1>, found " + h1s);
  if (heads.length < 2) problems.push("No section headings (only the page title): add a heading per section");

  // 3. names and labels
  q("button,a[href],[role=checkbox],[role=tab],[role=button]").filter(visible).forEach(function (e) {
    if (!(e.textContent.trim() || e.getAttribute("aria-label") || e.getAttribute("title") || e.getAttribute("aria-labelledby"))) problems.push("No accessible name: " + label(e));
  });
  q("input,textarea,select").filter(visible).forEach(function (e) {
    if (e.type === "hidden") return;
    var named = (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.closest("label");
    if (!named) problems.push("Form field without a label: " + (e.id || e.name || e.type));
  });

  // 4. target sizes (inline text links inside a sentence are exempt, as in WCAG 2.2)
  q("a[href],button,input,textarea,select,[role=checkbox],[role=tab]").filter(visible).forEach(function (e) {
    if (e.tagName === "A" && getComputedStyle(e).display === "inline" && e.closest("p,li")) return;
    var wrap = e.tagName === "INPUT" && (e.type === "checkbox" || e.type === "radio") && e.closest("label");
    if (e.classList.contains("skip-link")) return;
    var r = (wrap || e).getBoundingClientRect();
    if (r.height < minTarget || r.width < minTarget) problems.push("Small target " + Math.round(r.width) + "x" + Math.round(r.height) + " (< " + minTarget + "px): " + label(e));
  });
  if (innerWidth <= 760) q("input,textarea,select").filter(visible).forEach(function (e) {
    if (parseFloat(getComputedStyle(e).fontSize) < 16) problems.push("Field under 16px on a phone (iOS will zoom): " + (e.id || e.name || e.type));
  });

  // 5. layout + document basics
  if (document.documentElement.scrollWidth > innerWidth) problems.push("Horizontal scroll: page is " + document.documentElement.scrollWidth + "px wide in a " + innerWidth + "px window");
  if (!document.documentElement.lang) problems.push("<html> has no lang attribute");
  if (!document.title) problems.push("Missing <title>");
  if (!document.querySelector("meta[name=description]")) problems.push("Missing meta description");
  if (!document.querySelector("meta[property='og:title']")) problems.push("Missing og:title");

  var report = { page: location.pathname, viewport: innerWidth + "px", textItems: textCount, headings: heads.length, minFontPx: minFont, problems: problems };
  console.log((problems.length ? "✗ " + problems.length + " problem(s)" : "✓ No problems") + " — " + report.page + " @ " + report.viewport);
  problems.forEach(function (p) { console.log("  - " + p); });
  return report;
};
