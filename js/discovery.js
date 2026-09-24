(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Overall program progress — same shared figure the Map shows,
     from the same js/progress-data.js. Every screen carries this.
     ------------------------------------------------------------------ */
  if (window.SomosProgress) {
    var overallLabel = document.querySelector("[data-overall-label]");
    if (overallLabel) overallLabel.textContent = window.SomosProgress.overall + "%";

    var ring = document.querySelector("[data-ring-fill]");
    if (ring) {
      var circumference = 2 * Math.PI * 7; // matches r="7" in the header ring
      var offset = circumference * (1 - window.SomosProgress.overall / 100);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          ring.style.strokeDashoffset = String(offset);
        });
      });
    }
  }

  /* ------------------------------------------------------------------
     Scripted conversation — no backend yet, so this is a fixed tree,
     not a real model. Each step maps to one field in the live Career
     Profile panel, matching the design spec's 5 fields.
     ------------------------------------------------------------------ */
  var STEPS = [
    {
      field: "background",
      type: "text",
      chips: ["Healthcare or caregiving", "Retail or customer service", "Office or admin work"]
      // step 0's AI prompt is already in the page markup (first paint, no JS needed to see it)
    },
    {
      field: "experience",
      type: "text",
      aiText: "Got it. What does a typical day look like for you there?"
    },
    {
      field: "enjoys",
      type: "chips-multi",
      aiText: "Which parts of that work do you enjoy most? Pick as many as apply.",
      chips: ["Working with people", "Organizing projects", "Analyzing information", "Solving technical problems", "Research", "Something else"]
    },
    {
      field: "coding",
      type: "chips-single",
      aiText: "How do you feel about code or technical tools these days?",
      chips: ["Never tried it", "A little curious", "I've dabbled a bit", "Pretty comfortable already"]
    },
    {
      field: "priorities",
      type: "chips-multi",
      maxSelect: 2,
      aiText: "What matters most to you in your next role? Pick up to 2.",
      chips: ["Stability", "Higher salary", "Remote or flexible", "People leadership", "Technical depth", "Creativity"]
    },
    {
      field: null,
      type: "final",
      aiText: "This gives me a real picture, not just a guess. Ready to see roles that could fit — with the reasoning behind each one?"
    }
  ];

  var chatLog = document.getElementById("chatLog");
  var chatChips = document.getElementById("chatChips");
  var chatInput = document.getElementById("chatInput");
  var chatSend = document.getElementById("chatSend");
  var chatCta = document.getElementById("chatCta");
  var stepLabel = document.getElementById("stepLabel");
  var progressSegs = document.querySelectorAll("[data-seg]");

  var currentIndex = 0;
  var selectedChips = [];
  var profile = {};
  var busy = false; // true while the "typing" delay is playing, blocks double-submits

  /* ------------------------------------------------------------------
     Rendering helpers
     ------------------------------------------------------------------ */
  function scrollToBottom() {
    requestAnimationFrame(function () {
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  }

  function appendAIMessage(text) {
    var row = document.createElement("div");
    row.className = "msg msg--ai";
    row.innerHTML =
      '<span class="msg-avatar msg-avatar--ai">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"></path></svg>' +
      '</span>' +
      '<div class="msg-bubble"></div>';
    row.querySelector(".msg-bubble").textContent = text;
    chatLog.appendChild(row);
    scrollToBottom();
  }

  function appendUserMessage(text) {
    var row = document.createElement("div");
    row.className = "msg msg--user";
    row.innerHTML =
      '<span class="msg-avatar msg-avatar--user">You</span>' +
      '<div class="msg-bubble"></div>';
    row.querySelector(".msg-bubble").textContent = text;
    chatLog.appendChild(row);
    scrollToBottom();
  }

  function appendTyping() {
    var row = document.createElement("div");
    row.className = "msg msg--ai";
    row.id = "typingRow";
    row.innerHTML =
      '<span class="msg-avatar msg-avatar--ai">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"></path></svg>' +
      '</span>' +
      '<div class="msg-bubble"><div class="msg-typing"><span></span><span></span><span></span></div></div>';
    chatLog.appendChild(row);
    scrollToBottom();
    return row;
  }

  function renderChips(step) {
    chatChips.innerHTML = "";
    if (!step.chips) return;
    step.chips.forEach(function (label, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = label;
      if (!reduceMotion) btn.style.animationDelay = (i * 0.05) + "s";
      btn.addEventListener("click", function () { onChipClick(step, btn, label); });
      chatChips.appendChild(btn);
    });
  }

  function onChipClick(step, btn, label) {
    if (busy) return;
    if (step.type === "text") {
      chatInput.value = label;
      chatInput.focus();
      return;
    }
    if (step.type === "chips-single") {
      chatChips.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-selected"); });
      btn.classList.add("is-selected");
      selectedChips = [label];
      return;
    }
    // chips-multi
    var idx = selectedChips.indexOf(label);
    if (idx > -1) {
      selectedChips.splice(idx, 1);
      btn.classList.remove("is-selected");
    } else {
      if (step.maxSelect && selectedChips.length >= step.maxSelect) {
        nudgeComposer();
        return;
      }
      selectedChips.push(label);
      btn.classList.add("is-selected");
    }
  }

  function updateProfileField(field, answer) {
    if (!field) return;
    var container = document.querySelector('[data-field="' + field + '"]');
    if (!container) return;
    container.innerHTML = "";
    var values = Array.isArray(answer) ? answer : [answer];
    values.forEach(function (v, i) {
      var chip = document.createElement("span");
      chip.className = "profile-chip";
      chip.textContent = v;
      if (!reduceMotion) chip.style.animationDelay = (i * 0.08) + "s";
      container.appendChild(chip);
    });
  }

  function updateProgress(stepIndex) {
    progressSegs.forEach(function (seg, i) {
      seg.classList.toggle("is-done", i < stepIndex);
      seg.classList.toggle("is-active", i === stepIndex);
    });
    stepLabel.textContent = "Step " + Math.min(stepIndex + 1, STEPS.length) + " of " + STEPS.length;
  }

  function nudgeComposer() {
    var row = document.querySelector(".chat-composer-row");
    row.style.transition = "transform 80ms ease-in-out";
    row.style.transform = "translateX(-4px)";
    setTimeout(function () { row.style.transform = "translateX(4px)"; }, 80);
    setTimeout(function () { row.style.transform = "translateX(0)"; }, 160);
  }

  /* ------------------------------------------------------------------
     Step submission
     ------------------------------------------------------------------ */
  function submitStep() {
    if (busy) return;
    var step = STEPS[currentIndex];
    if (step.type === "final") return;

    var text = chatInput.value.trim();
    var answer;

    if (step.type === "chips-multi" || step.type === "chips-single") {
      if (selectedChips.length) answer = selectedChips.slice();
      else if (text) answer = [text];
      else { nudgeComposer(); return; }
    } else {
      if (text) answer = text;
      else { nudgeComposer(); return; }
    }

    var displayText = Array.isArray(answer) ? answer.join(", ") : answer;
    appendUserMessage(displayText);
    chatInput.value = "";
    selectedChips = [];
    chatChips.innerHTML = "";

    if (step.field) {
      profile[step.field] = answer;
      updateProfileField(step.field, answer);
    }

    busy = true;
    chatSend.disabled = true;
    var typingRow = appendTyping();

    var nextIndex = currentIndex + 1;
    setTimeout(function () {
      typingRow.remove();
      currentIndex = nextIndex;
      updateProgress(currentIndex);
      var nextStep = STEPS[currentIndex];
      if (nextStep.aiText) appendAIMessage(nextStep.aiText);

      if (nextStep.type === "final") {
        chatChips.innerHTML = "";
        document.querySelector(".chat-composer-row").style.display = "none";
        document.querySelector(".chat-hint").style.display = "none";
        chatCta.classList.add("is-visible");
      } else {
        renderChips(nextStep);
      }

      busy = false;
      chatSend.disabled = false;
      scrollToBottom();
    }, reduceMotion ? 50 : 750);
  }

  chatSend.addEventListener("click", submitStep);
  chatInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submitStep(); }
  });

  /* ------------------------------------------------------------------
     Init — step 0's AI message and progress state are already in the
     page markup; just wire up its chips and the progress bar.
     ------------------------------------------------------------------ */
  updateProgress(0);
  renderChips(STEPS[0]);
})();
