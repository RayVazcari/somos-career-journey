# Instructions for AI assistants working in this repo

You are most likely here to **port or extend** the SOMOS.tech Career Journey prototype.
Read this file, then `HANDOFF.md` in full, **before changing or copying anything.**

## What this is
A concept prototype: plain HTML/CSS/JS, no build step. It is **not production code** and
parts of it are deliberately fake. `HANDOFF.md` §4 lists exactly which parts. Do not ship them as real.

## Hard rules
1. **Never ship the fake parts as real:** the "Alex Rivera" example fixture, scripted AI chat,
   canned role text, the invented course/event catalogue, the "Prototype: mark done" buttons,
   the placeholder site navigation.
2. **Do not invent product data.** No made-up courses, mentors, events, job listings, badge
   issuers or statistics. If real data isn't provided, leave a clearly-marked placeholder and ask.
3. **One source of truth.** Every number comes from the engine (`js/state.js`). A page must never
   keep its own copy of an answer, a checked item or a percentage. Keep the contract:
   `SomosState.update(fn)`, `SomosState.pct(key)`, `SomosState.overall`, and the `somos:change` event.
4. **Do not change the progress formulas** (`HANDOFF.md` §6) without explicit product sign-off.
   My Career Journey is the **average** of Learn/Build/Connect. It must never become a sum.
5. **Progress and badges must be earned by real actions,** never by visiting a page.
6. **Preserve the product rules** in `HANDOFF.md` §5 (explain fit don't score it; exploration is not
   commitment; hand off to existing SOMOS programs; one shared profile; and so on).
7. **Don't push, deploy or publish** without being asked. Put work on a staging/preview URL first.

## Definition of done: prove it, don't claim it
A port is not finished until **all** of these pass. Report real results, not impressions.

- [ ] **Engine tests:** open `checks/tests.html`. Every line must be PASS (13 tests, including the
      "Example mode = 38 / 100,100,100 / 20,0,25 / 15" check).
- [ ] **Quality audit on every ported page:** paste `checks/audit.js` into the console, run
      `somosAudit()` on desktop and `somosAudit({touch:true})` at 375px width. **Zero problems.**
- [ ] **Compare with the reference screens** in `docs/screens/` (desktop) and note any intended
      differences. Same layout, same shared progress card top-right, same journey strip top-left.
- [ ] **Behaviour:** the Map -> page fly-in (`setupMapHandoff` in `js/shell.js`) still works and lands
      exactly on the next page's strip; `prefers-reduced-motion` disables it.
- [ ] **Nothing hard-coded to the prototype:** search for `Alex`, `Rivera`, `Starting in Tech`,
      `Prototype:` and `sessionStorage`; each hit is either replaced or deliberately kept and explained.

## Quality bar (what "as good as the original" means)
- A distinctive point of view, not a template; a display face paired with a body face
- A restrained palette (navy / teal / gold + neutral text); AA contrast everywhere
- Hierarchy that breathes; motion that whispers (hand-built, respects reduced motion)
- Mobile that is *designed*, not shrunk: 44px touch targets, 16px form fields, strip fills the width
- Invisible quality: semantic HTML, a real heading outline, keyboard operable, real meta tags, fast load

## Known follow-ups (not yet done)
Self-host the font and GSAP; add an `og:image`; real `<h2>/<h3>` instead of `role="heading"`;
badges (Learn / Build / Connect + Pathfinder), pending who issues them; the program rebrand name.

## When you are unsure
Ask. The cost of one question is small; the cost of shipping an invented course catalogue is not.
