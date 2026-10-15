(function () {
  "use strict";

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  /* Each question carries a prep tip written against the example
     profile (the clinic spreadsheet story, the research background),
     which is what makes this "personalized" rather than a bank. */
  var QUESTIONS = [
    {
      q: "Tell me about a time you improved a process with limited authority.",
      tip: "Use your clinic tracking-sheet story. Lead with the problem (lost handoffs between shifts), then how you got buy-in without being anyone’s manager, then the measurable result."
    },
    {
      q: "How do you prioritize when two stakeholders want different things?",
      tip: "Pick a real lab-or-clinic scheduling conflict. Name the criteria you used (patient impact, deadline) — “I talked to both” isn’t an answer on its own."
    },
    {
      q: "Walk me through how you’d measure a product launch’s success.",
      tip: "Start from the goal, then choose two or three metrics (adoption, time-to-value, support tickets) and say how you’d baseline them. Your SQL Basics course is the “how I’d pull this” part."
    },
    {
      q: "Describe a time your career-change background helped, not hurt, you.",
      tip: "Lead with a transferable strength — research rigor and documentation habits — give one concrete moment it mattered, and end on the result."
    }
  ];

  var done = QUESTIONS.map(function () { return false; });
  var open = QUESTIONS.map(function () { return false; });

  var grid = document.getElementById("qGrid");
  var count = document.getElementById("qCount");

  function render() {
    grid.innerHTML = QUESTIONS.map(function (item, i) {
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
    count.innerHTML = "<strong>" + n + " of " + QUESTIONS.length + "</strong> rehearsed" +
      (n === QUESTIONS.length ? " — you’re ready for a real mock round." : ".");

    grid.querySelectorAll("[data-tip]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.dataset.tip);
        open[i] = !open[i];
        render();
      });
    });
    grid.querySelectorAll("[data-done]").forEach(function (c) {
      c.addEventListener("change", function () {
        done[Number(c.dataset.done)] = c.checked;
        render();
      });
    });
  }

  /* ---------------- handoff preview ---------------- */
  var handoff = document.getElementById("handoff");
  var CONTEXT = {
    peer: {
      label: "PEER CONNECT — BETA",
      title: "Matching you with members interviewing for similar roles",
      items: [
        "Your target role: Product Operations Manager",
        "The four questions above, so you and your partner rehearse the same set",
        "Your transferable strengths, so your partner can give feedback that’s actually relevant",
        "Your availability is asked on the other side — nothing is shared until you confirm a match"
      ],
      go: "Continue to Peer Connect"
    },
    ai: {
      label: "AI MOCK INTERVIEW — WITH GRACE",
      title: "A voice session pre-loaded with your role and questions",
      items: [
        "Your target role: Product Operations Manager",
        "The four questions above as the session’s starting set",
        "The clinic-coordination story from your resume, so follow-ups probe your real experience",
        "Detailed written feedback after each session, saved to your Career Profile"
      ],
      go: "Continue to the Mock Interview program"
    }
  };

  function openHandoff(which) {
    var c = CONTEXT[which];
    document.getElementById("pathPeer").classList.toggle("is-chosen", which === "peer");
    document.getElementById("pathAi").classList.toggle("is-chosen", which === "ai");
    document.getElementById("handoffLabel").textContent = c.label;
    document.getElementById("handoffTitle").textContent = c.title;
    document.getElementById("handoffList").innerHTML = c.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var go = document.getElementById("handoffGo");
    go.textContent = c.go;
    go.setAttribute("data-coming-soon", which === "peer" ? "Peer Connect" : "SOMOS Mock Interview program");
    handoff.hidden = false;
    handoff.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }

  document.querySelectorAll("[data-path]").forEach(function (b) {
    b.addEventListener("click", function () { openHandoff(b.getAttribute("data-path")); });
  });
  document.getElementById("handoffCancel").addEventListener("click", function () {
    handoff.hidden = true;
    document.getElementById("pathPeer").classList.remove("is-chosen");
    document.getElementById("pathAi").classList.remove("is-chosen");
  });

  render();
})();
