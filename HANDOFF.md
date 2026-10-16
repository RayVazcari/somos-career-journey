# Handoff: porting the Career Journey prototype into the SOMOS.tech site

**Read this before copying any code.** This repo is a *clickable concept prototype*, not production code.
It was built to show the flow, the feel and the product rules. Some of it is deliberately fake. This
document says which parts to keep, which to replace, and what must not be lost in the move.

> Status: concept prototype, **not yet approved for the live site.** Please put it on a staging or
> preview URL first and get product sign-off before anything goes public.

## 1. What it is in one paragraph

A single "Career Profile" drives eight screens: a scrolling **Map**, **AI Discovery**, **Explore & Compare**,
**My Career Journey** (Learn / Build / Connect), **Living Roadmap**, **Prepare** (resume + LinkedIn),
**Practice**, and **Apply**. Every number on every screen comes from one engine, so the screens can never
disagree. A person can browse a pre-filled *example journey* or run a *live demo* from 0%.

## 2. Run it

No build step. Open `index.html`, or serve the folder with any static server
(`python -m http.server`). GSAP and the Bricolage Grotesque font load from CDNs.

## 3. Architecture in 60 seconds

```
js/state.js   THE ENGINE. Owns all data + derives every percentage. Emits `somos:change`.
js/shell.js   Shared UI on every page: progress card, journey strip, mode chip, start screen,
              Map -> page fly-in animation, heading semantics.
js/<page>.js  One per screen. Reads from the engine, writes through SomosState.update(fn).
js/common.js  Toasts, "coming soon" navigation, feedback button.
js/polish.js  Micro-interactions (card spotlight, checkbox settle, magnetic buttons).
css/styles.css  Design tokens (:root) + the Map.   css/shell.css, css/polish.css  Shared.
```

Data flow: page script -> `SomosState.update(d => { ... })` -> state saved -> `somos:change` event ->
every renderer (page + progress card + strip) redraws. **Pages never keep their own copy of a value.**

## 4. What is real vs. prototype (this is the important table)

| In the prototype | In production it should be |
|---|---|
| State in `sessionStorage` (resets when the tab closes) | The user's real **Career Profile**, stored per account, shared across SOMOS programs |
| `ITEMS` list in `state.js` (12 courses, labs, events) | The real program catalogue: real courses, SOMOS events, mentor matching |
| Scripted Discovery chat (`STEPS` in `discovery.js`) | A real AI conversation that writes the same five profile fields |
| `ROLES` text in `compare.js` (6 canned roles) | AI/profile-driven recommendations with real reasoning |
| "Prototype: mark done" buttons on Apply (mock interview, applied) | Set automatically by the Mock Interview program and an application tracker |
| **Example mode** (Alex Rivera fixture) | A demo/sales fixture only. **Never ship Alex as a real user.** |
| Placeholder site nav (Home, Community, ...) | The real SOMOS.tech navigation |
| Program name "Starting in Tech" (footers, resume text, badge) | The new program name once the rebrand is decided: search for it and make it one constant |

## 5. Product rules to preserve (from the design brief)

1. **Explain fit, don't score it.** Role cards say *why* it fits and *what to consider*. No bare match percentages.
2. **Exploration is not commitment.** Swapping the primary role never discards the old one; only "Make this my goal" commits, and it can be changed.
3. **Progress must mean something.** Percentages and badges come from real completed actions. Never from visiting a page.
4. **Hand off to existing SOMOS programs** (Mock Interview, Resume Review with Grace) rather than rebuilding them.
5. **Map = navigation, Roadmap = execution.** Don't merge them.
6. **One shared profile**, reused everywhere (resume, roadmap, practice questions all read the same answers).
7. **Program completion is not career readiness.** Don't label a finished checklist as "job ready".

## 6. The progress rules (change only with product sign-off)

Each stage is 0-100 and always derived:
- AI Discovery = answered questions / 5
- Compare = decisions made / 2 (set primary, "not for me", add)  ·  Goal = 100 once confirmed
- Learn / Build / Connect = items checked / items in that track
- Prepare = (resume downloaded, LinkedIn field copied, achievement added, brand item checked) / 4
- Practice = (questions rehearsed + a practice path chosen) / 5
- Apply = (start date saved, job board opened, marked applied) / 3
- **My Career Journey = average of Learn, Build, Connect** (it was briefly a *sum*; that breaks as soon as people can change things)
- **Overall = average of the 9 stages**

**Acceptance test that must keep passing:** in Example mode the Map shows Overall **38%**, Discovery /
Compare / Goal **100%**, Learn **20%**, Build **0%**, Connect **25%**, My Career Journey **15%**.

## 7. Experience details worth keeping

- The **same progress card** top-right and the **same journey strip** top-left on every screen, in the same place.
- Clicking a stage on the Map shrinks the map and flies a mini-map copy to where the strip lives on the next page (`setupMapHandoff` in `shell.js`). It is driven by Web Animations, not by browser page-transition features. Skipped for `prefers-reduced-motion`.
- Milestone toasts fire only when a stage genuinely reaches 100% (engine-driven), never on page visits.
- Accessibility baseline that was verified: AA contrast on every page, 44px touch targets on touch/small screens, 16px form fields (no iOS zoom), a skip link, a real heading outline, labelled inputs, keyboard-operable checklists, and `prefers-reduced-motion` support.

## 8. Porting advice

- **Don't paste the HTML wholesale.** The page headers are duplicated markup. Rebuild them as shared components and keep the *behaviour* (the engine contract + the shared progress card + the strip).
- **Keep the engine pure.** `state.js` has no DOM code; it is the part most worth porting as-is (or as a typed module), then pointing at real storage.
- **Replace storage, keep the contract:** `SomosState.update(fn)`, `SomosState.pct(key)`, `SomosState.overall`, and the `somos:change` event. If those survive, every renderer keeps working.
- Self-host the font and GSAP rather than relying on CDNs; add a real `og:image`.
- There are no automated tests. At minimum, turn section 6's formulas and the 38/20/0/25/15 check into unit tests.

## 9. Open questions (need an answer from SOMOS)

1. What is the site's stack (WordPress, a JS framework, something else) and where would this live (`/career-journey`?)
2. Where does the Career Profile live, and who owns it? Is there an existing login?
3. Is there a real AI service for Discovery and Compare, or does that stay scripted for now?
4. **Badges:** who issues them, and are they verifiable (e.g. Credly / Open Badges)? Proposed set: Learn, Build, Connect, plus the Pathfinder capstone. A LinkedIn share needs a real public URL and an `og:image`.
5. What is the new name of the program being rebranded, and which programs are being retired?
6. Does it need another language, or is browser translation enough?
7. Who approves it, and what's the review step before it goes live?

## 10. Known rough edges

Placeholder nav links show a toast; Glassdoor and Wellfound link to their job-search home pages;
`role="heading"` is applied by script (`patchHeadings`), which should become real `<h2>`/`<h3>` in a rebuild;
`sessionStorage` means refresh keeps progress but a closed tab loses it; no analytics.
