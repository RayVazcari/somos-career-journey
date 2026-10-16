(function () {
  "use strict";

  var S = window.SomosState;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function clip(s, n) { s = (s || "").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }

  var p0 = S.persona();
  var roleName = p0.role;
  document.getElementById("pracSub").textContent =
    "Scoped to " + roleName + ", not a generic question bank. When you’re ready to actually practice, this hands off to SOMOS’s dedicated Mock Interview program.";

  /* Prep tips are written against THIS person's own answers, which is
     what makes this "personalized" rather than a bank. */
  function questions() {
    var p = S.persona();
    var story = p.experience
      ? "Start from your own story — “" + clip(p.experience, 110) + "” — "
      : "Pick a real example from " + (p.bg ? "your " + p.bg + " work" : "your past work") + " and ";
    var strengths = p.skills.slice(0, 2);
    return [
      {
        q: "Tell me about a time you improved a process with limited authority.",
        tip: story + "lead with the problem, then how you got buy-in without being anyone’s manager, then the measurable result."
      },
      {
        q: "How do you prioritize when two stakeholders want different things?",
        tip: "Pick a real conflict over time or resources from " + (p.bg ? "your " + p.bg + " experience" : "your past work") + ". Name the criteria you used (impact, deadline) — “I talked to both” isn’t an answer on its own."
      },
      {
        q: "Walk me through how you’d measure a product launch’s success.",
        tip: "Start from the goal, then choose two or three metrics (adoption, time-to-value, support tickets) and say how you’d baseline them. " +
          (S.data.items.sql ? "Your SQL Basics course is the “how I’d pull this” part." : "Mention you’d pull the numbers with SQL — and that you’re learning it (it’s on your roadmap).")
      },
      {
        q: "Describe a time your career-change background helped, not hurt, you.",
        tip: "Lead with a transferable strength — " + (strengths.length ? S.list(strengths).toLowerCase() : "the skills you’ve built") + " — give one concrete moment it mattered, and end on the result."
      }
    ];
  }

  var open = [false, false, false, false];
  var grid = document.getElementById("qGrid");
  var count = document.getElementById("qCount");

  function render() {
    var QS = questions();
    var done = S.data.practice.rehearsed;
    grid.innerHTML = QS.map(function (item, i) {
      return (
        '<div class="q-card' + (done[i] ? " is-done" : "") + '">' +
        '<p class="q-text">“' + esc(item.q) + '”</p>' +
        '<div class="q-actions">' +
        '<button type="button" class="q-link" data-tip="' + i + '" aria-expanded="' + open[i] + '">' + (open[i] ? "Hide prep tip" : "Prep tip") + "</button>" +
        '<label class="q-check"><input type="checkbox" data-done="' + i + '"' + (done[i] ? " checked" : "") + "> I’ve rehearsed this</label>" +
        "</div>" +
        (open[i] ? '<div class="q-tip">' + esc(item.tip) + "</div>" : "") +
        "</div>"
      );
    }).join("");

    var n = done.filter(Boolean).length;
    count.innerHTML = "<strong>" + n + " of " + QS.length + "</strong> rehearsed" +
      (n === QS.length ? " — you’re ready for a real mock round." : ".");

    grid.querySelectorAll("[data-tip]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.dataset.tip);
        open[i] = !open[i];
        render();
      });
    });
    grid.querySelectorAll("[data-done]").forEach(function (c) {
      c.addEventListener("change", function () {
        var i = Number(c.dataset.done), v = c.checked;
        S.update(function (d) { d.practice.rehearsed[i] = v; });
      });
    });
  }

  /* ---------------- handoff preview ---------------- */
  var handoff = document.getElementById("handoff");

  function context() {
    var p = S.persona();
    var story = p.experience ? "A story from your resume: “" + clip(p.experience, 90) + "”" : "Your resume draft from Prepare, so follow-ups probe your real experience";
    var strengths = p.skills.length ? "Your transferable strengths (" + S.list(p.skills.slice(0, 3)).toLowerCase() + "), so feedback is actually relevant" : "Your transferable strengths, so feedback is actually relevant";
    return {
      peer: {
        label: "PEER CONNECT — BETA",
        title: "Matching you with members interviewing for similar roles",
        items: [
          "Your target role: " + p.role,
          "The four questions above, so you and your partner rehearse the same set",
          strengths,
          "Your availability is asked on the other side — nothing is shared until you confirm a match"
        ],
        go: "Continue to Peer Connect"
      },
      ai: {
        label: "AI MOCK INTERVIEW — WITH GRACE",
        title: "A voice session pre-loaded with your role and questions",
        items: [
          "Your target role: " + p.role,
          "The four questions above as the session’s starting set",
          story,
          "Detailed written feedback after each session, saved to your Career Profile"
        ],
        go: "Continue to the Mock Interview program"
      }
    };
  }

  function showHandoff(which) {
    var c = context()[which];
    document.getElementById("pathPeer").classList.toggle("is-chosen", which === "peer");
    document.getElementById("pathAi").classList.toggle("is-chosen", which === "ai");
    document.getElementById("handoffLabel").textContent = c.label;
    document.getElementById("handoffTitle").textContent = c.title;
    document.getElementById("handoffList").innerHTML = c.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var go = document.getElementById("handoffGo");
    go.textContent = c.go;
    go.setAttribute("data-coming-soon", which === "peer" ? "Peer Connect" : "SOMOS Mock Interview program");
    handoff.hidden = false;
  }

  function hideHandoff() {
    handoff.hidden = true;
    document.getElementById("pathPeer").classList.remove("is-chosen");
    document.getElementById("pathAi").classList.remove("is-chosen");
  }

  document.querySelectorAll("[data-path]").forEach(function (b) {
    b.addEventListener("click", function () {
      var which = b.getAttribute("data-path");
      showHandoff(which);
      S.update(function (d) { d.practice.path = which; });
      handoff.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    });
  });
  document.getElementById("handoffCancel").addEventListener("click", function () {
    hideHandoff();
    S.update(function (d) { d.practice.path = null; });
  });

  // returning to the page: show the path you already chose
  if (S.data.practice.path) showHandoff(S.data.practice.path);

  document.addEventListener("somos:change", render);
  render();
})();
