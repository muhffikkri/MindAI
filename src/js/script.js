// ===========================
// ORIGINAL navigation.js
// ===========================
// Navigation and interactivity

document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");

  if (typeof window.MindAIEnhanceAccessibility === "function") {
    window.MindAIEnhanceAccessibility(document);
  }

  if (hamburger) {
    hamburger.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", function (event) {
      if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove("active");
      }
    });

    // Close sidebar when clicking on a link
    const navLinks = sidebar.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        sidebar.classList.remove("active");
      });
    });
  }

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Active nav link based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});

// ===========================
// ORIGINAL chat.js
// ===========================
// Chat functionality

document.addEventListener("DOMContentLoaded", function () {
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const chatMessages = document.getElementById("chat-messages");
  const chatLoadingState = document.getElementById("chat-loading-state");

  if (!chatInput || !sendBtn) return;

  const aiEngine = window.MindAIChatEngine || window.MindAIKeyManager || null;

  function scrollToBottom(target = chatMessages) {
    if (!target) return;

    target.scrollTop = target.scrollHeight;
  }

  function readChatHistory() {
    try {
      return JSON.parse(localStorage.getItem("mindai_chat_history") || "[]");
    } catch (error) {
      return [];
    }
  }

  function writeChatHistory(history) {
    localStorage.setItem("mindai_chat_history", JSON.stringify(history));
  }

  function pushChatHistory(role, text) {
    const history = readChatHistory();
    history.push({
      role,
      timestamp: new Date().toISOString(),
      parts: [{ text }],
    });
    writeChatHistory(history);
    return history;
  }

  function formatHistoryTimestamp(timestamp) {
    if (!timestamp) {
      return getCurrentTime();
    }

    const parsedDate = new Date(timestamp);
    if (Number.isNaN(parsedDate.getTime())) {
      return getCurrentTime();
    }

    const hours = String(parsedDate.getHours()).padStart(2, "0");
    const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function appendMessage(role, text, timeLabel = getCurrentTime()) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${role === "model" ? "bot-message" : "user-message"}`;
    const isBot = role === "model";
    const safeLabel = escapeHtml(text);
    messageEl.innerHTML = `
      <div class="message-avatar">${isBot ? "S" : "A"}</div>
      <div class="message-content">
        <div class="message-bubble" tabindex="0" role="article" aria-label="${isBot ? "Pesan dari MindAI: " : "Pesan pengguna: "}${safeLabel}">${safeLabel}</div>
        <span class="message-time">${timeLabel}</span>
      </div>
    `;
    chatMessages.appendChild(messageEl);
    return messageEl;
  }

  function renderStoredChatHistory() {
    const storedHistory = readChatHistory();
    if (storedHistory.length === 0) {
      chatMessages.replaceChildren();
      return;
    }

    chatMessages.innerHTML = "";
    storedHistory.forEach((entry) => {
      const text = entry?.parts
        ?.map((part) => part?.text || "")
        .join("")
        .trim();
      if (!text) {
        return;
      }

      appendMessage(entry.role, text, formatHistoryTimestamp(entry.timestamp));
    });

    scrollToBottom();
  }

  function readEmotionLogs() {
    try {
      return JSON.parse(localStorage.getItem("mindai_emotion_logs") || "[]");
    } catch (error) {
      return [];
    }
  }

  function extractEmotionLabelsFromLogs(logs) {
    return logs
      .flatMap((entry) => (Array.isArray(entry?.emotions) ? entry.emotions : []))
      .map((emotion) => {
        if (typeof emotion === "object" && emotion !== null) {
          return String(emotion.label || "").trim();
        }

        return String(emotion || "").trim();
      })
      .filter(Boolean);
  }

  function renderTodaysEmotionsSidebar() {
    const emotionContainer = document.getElementById("todays-emotions");
    if (!emotionContainer) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emotionLogs = readEmotionLogs().filter((entry) => {
      if (!entry?.timestamp) {
        return false;
      }

      return new Date(entry.timestamp) >= today;
    });

    const labels = extractEmotionLabelsFromLogs(emotionLogs);
    const counts = labels.reduce((accumulator, label) => {
      accumulator[label] = (accumulator[label] || 0) + 1;
      return accumulator;
    }, {});

    const sortedLabels = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, count }));

    emotionContainer.innerHTML = "";

    if (sortedLabels.length === 0) {
      emotionContainer.innerHTML = '<span class="emotion-tag emotion-tag-empty">Belum ada label hari ini</span>';
      return;
    }

    sortedLabels.forEach(({ label, count }) => {
      const tag = document.createElement("span");
      tag.className = "emotion-tag emotion-tag-live";
      tag.textContent = `${label} · ${count}`;
      emotionContainer.appendChild(tag);
    });
  }

  async function ensureStarterGreeting() {
    const chatContainer = document.getElementById("chat-messages");
    const alreadyHasMessage = Boolean(chatContainer && chatContainer.children.length > 0);

    if (alreadyHasMessage) {
      return;
    }

    if (typeof window.MindAIChatEngine?.generateStarterGreeting !== "function") {
      return;
    }

    try {
      const starterGreeting = await window.MindAIChatEngine.generateStarterGreeting();
      appendMessage("model", starterGreeting);
      pushChatHistory("model", starterGreeting);
    } catch (error) {
      console.error("Starter greeting error:", error);
    }
  }

  window.MindAIEnsureStarterGreeting = ensureStarterGreeting;

  async function maybeExtractEmotionLabels() {
    if (!aiEngine?.extractEmotionLabelsFromHistory) {
      return;
    }

    await aiEngine.extractEmotionLabelsFromHistory(readChatHistory());
    renderTodaysEmotionsSidebar();
  }

  renderStoredChatHistory();
  renderTodaysEmotionsSidebar();

  // Auto-resize textarea
  chatInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";
  });

  // Send message on button click
  sendBtn.addEventListener("click", sendMessage);

  // Send message on Enter key (Shift+Enter for new line)
  chatInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    const historyBeforeUserMessage = readChatHistory();

    const setChatLoadingState = (isLoading) => {
      if (chatMessages) {
        chatMessages.setAttribute("aria-busy", String(isLoading));
      }

      if (chatLoadingState) {
        chatLoadingState.classList.toggle("hidden", !isLoading);
      }

      sendBtn.disabled = isLoading;
      sendBtn.setAttribute("aria-busy", String(isLoading));
    };

    appendMessage("user", message);
    pushChatHistory("user", message);

    // Clear input
    chatInput.value = "";
    chatInput.style.height = "auto";

    // Scroll to bottom
    scrollToBottom();

    setChatLoadingState(true);
    scrollToBottom();

    try {
      const historyLog = historyBeforeUserMessage;
      const assistantReply = aiEngine?.generateAssistantReply
        ? await aiEngine.generateAssistantReply(historyLog, message)
        : aiEngine?.fetchGeminiResponse
          ? await aiEngine.fetchGeminiResponse([...historyLog, { role: "user", parts: [{ text: message }] }])
          : null;

      if (!assistantReply) {
        appendMessage("model", "Aku belum bisa mengambil respons saat ini. Coba kirim ulang sebentar lagi.");
        pushChatHistory("model", "Aku belum bisa mengambil respons saat ini. Coba kirim ulang sebentar lagi.");
        scrollToBottom();
        setChatLoadingState(false);
        return;
      }

      appendMessage("model", assistantReply);
      pushChatHistory("model", assistantReply);
      scrollToBottom();

      await maybeExtractEmotionLabels();
      renderTodaysEmotionsSidebar();
      setChatLoadingState(false);
    } catch (error) {
      console.error("Chat response error:", error);
      const fallbackMessage = "Aku mengalami kendala saat mengambil respons AI. Coba lagi sebentar ya.";
      appendMessage("model", fallbackMessage);
      pushChatHistory("model", fallbackMessage);
      scrollToBottom();
      await maybeExtractEmotionLabels();
      renderTodaysEmotionsSidebar();
      setChatLoadingState(false);
    }
  }

  function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
});

// ===========================
// ORIGINAL mood.js
// ===========================
// Mood check functionality

document.addEventListener("DOMContentLoaded", function () {
  const moodSlider = document.getElementById("mood-slider");
  const sliderDisplay = document.getElementById("slider-display");
  const emotionBtns = document.querySelectorAll(".emotion-btn");

  if (moodSlider) {
    updateMoodSliderVisual(moodSlider);
    moodSlider.addEventListener("input", function () {
      sliderDisplay.textContent = this.value;
      updateMoodSliderVisual(this);
    });
  }

  emotionBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.classList.toggle("active");
      if (typeof updateEmotionScoresDisplay === "function") {
        updateEmotionScoresDisplay();
      }
    });
  });

  const checkinModal = document.getElementById("checkin-modal");
  const checkinModalClose = document.getElementById("checkin-modal-close");

  if (checkinModalClose && checkinModal) {
    checkinModalClose.addEventListener("click", () => hideCheckinModal());
    checkinModal.addEventListener("click", function (event) {
      if (event.target === this) {
        hideCheckinModal();
      }
    });
  }

  const chatSidebar = document.getElementById("chat-sidebar");
  const chatSidebarHandle = document.getElementById("chat-sidebar-handle");
  if (chatSidebar && chatSidebarHandle && window.matchMedia("(max-width: 768px)").matches) {
    const syncSidebarState = (isExpanded) => {
      chatSidebar.classList.toggle("active", isExpanded);
      chatSidebarHandle.setAttribute("aria-expanded", String(isExpanded));
    };

    chatSidebarHandle.addEventListener("click", () => {
      syncSidebarState(!chatSidebar.classList.contains("active"));
    });

    syncSidebarState(false);
  }
});

const moodScores = {};

function updateEmotionScoresDisplay() {
  const section = document.getElementById("emotion-scores-section");
  const list = document.getElementById("emotion-scores-list");
  if (!section || !list) return;

  const activeBtns = document.querySelectorAll("#page-mood .emotion-btn.active");

  if (activeBtns.length === 0) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");
  list.innerHTML = "";

  activeBtns.forEach((btn) => {
    const label = btn.querySelector("span:last-child")?.textContent?.trim() || btn.textContent.trim();
    const eid = btn.dataset.emotion;
    if (!(eid in moodScores)) moodScores[eid] = 5;

    const row = document.createElement("div");
    row.className = "emotion-score-row";
    row.innerHTML = `
      <span class="emotion-score-label">${label}</span>
      <div class="emotion-score-controls">
        <button type="button" class="score-ctrl" data-eid="${eid}" data-dir="-1" aria-label="Kurangi intensitas ${label}">−</button>
        <span class="score-value" id="sv-${eid}">${moodScores[eid]}</span>
        <button type="button" class="score-ctrl" data-eid="${eid}" data-dir="1" aria-label="Tambah intensitas ${label}">+</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll(".score-ctrl").forEach((btn) => {
    btn.addEventListener("click", function () {
      const eid = this.dataset.eid;
      const dir = parseInt(this.dataset.dir);
      const current = moodScores[eid] || 5;
      moodScores[eid] = Math.max(1, Math.min(10, current + dir));
      const display = document.getElementById(`sv-${eid}`);
      if (display) display.textContent = moodScores[eid];
    });
  });
}

function saveMood() {
  const activeEmotionButtons = Array.from(document.querySelectorAll("#page-mood .emotion-btn.active"));
  const selectedEmotions = activeEmotionButtons.map((btn) => {
    const label = btn.querySelector("span:last-child")?.textContent?.trim() || btn.textContent.trim();
    const eid = btn.dataset.emotion;
    const score = moodScores[eid] || 5;
    return { label, score };
  });
  const selectedSensations = Array.from(document.querySelectorAll('#page-mood .sensation-grid input[type="checkbox"]:checked'))
    .map((checkbox) => checkbox.nextElementSibling?.nextElementSibling?.textContent?.trim() || checkbox.closest("label")?.innerText.trim())
    .filter(Boolean);
  const moodValue = document.getElementById("mood-slider")?.value || "50";
  const notes = document.getElementById("mood-notes")?.value.trim() || "";

  if (selectedEmotions.length === 0) {
    showCheckinModal("error", "Please pick at least one emotion.", "Select an emotion first so your check-in can be saved.", "⚠️");
    return false;
  }

  try {
    const labelList = selectedEmotions.map((e) => e.label);
    const entry = {
      source: "mood_check",
      timestamp: new Date().toISOString(),
      moodValue: Number(moodValue),
      emotions: selectedEmotions,
      sensations: selectedSensations,
      notes,
    };

    const storedLogs = JSON.parse(localStorage.getItem("mindai_emotion_logs") || "[]");
    storedLogs.unshift(entry);
    localStorage.setItem("mindai_emotion_logs", JSON.stringify(storedLogs.slice(0, 50)));

    showCheckinModal("success", "Check-in saved successfully.", `Saved ${labelList.join(", ")} at mood ${moodValue}/100.`, "✓");
    resetMoodCheckinForm();
    window.MindAIRenderDashboard?.();
    return true;
  } catch (error) {
    showCheckinModal("error", "Save failed.", "Your browser could not store this check-in right now.", "✕");
    return false;
  }
}

function resetMoodCheckinForm() {
  const moodSlider = document.getElementById("mood-slider");
  const sliderDisplay = document.getElementById("slider-display");
  const notesInput = document.getElementById("mood-notes");
  const emotionButtons = document.querySelectorAll("#page-mood .emotion-btn.active");
  const checkboxes = document.querySelectorAll('#page-mood .sensation-grid input[type="checkbox"]');

  if (moodSlider) {
    moodSlider.value = "50";
    updateMoodSliderVisual(moodSlider);
  }

  if (sliderDisplay) {
    sliderDisplay.textContent = "50";
  }

  if (notesInput) {
    notesInput.value = "";
  }

  emotionButtons.forEach((button) => button.classList.remove("active"));
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  Object.keys(moodScores).forEach((key) => {
    delete moodScores[key];
  });

  const scoresSection = document.getElementById("emotion-scores-section");
  const scoresList = document.getElementById("emotion-scores-list");
  if (scoresSection) {
    scoresSection.classList.add("hidden");
  }
  if (scoresList) {
    scoresList.innerHTML = "";
  }
}

function updateMoodSliderVisual(slider) {
  const value = Number(slider.value || 0);
  const fill = value <= 50 ? "#d8f2d5" : value <= 75 ? "#f9e3a8" : "#f7b3b3";
  slider.style.background = `linear-gradient(90deg, #cfe7ff 0%, #d8f2d5 ${Math.min(value, 35)}%, #f9e3a8 ${Math.min(value, 70)}%, #f7b3b3 100%)`;
  slider.setAttribute("aria-valuenow", String(value));
  slider.setAttribute("aria-valuetext", value <= 35 ? "calm" : value <= 65 ? "balanced" : "intense");
}

function showCheckinModal(type, title, message, icon) {
  const modal = document.getElementById("checkin-modal");
  const modalTitle = document.getElementById("checkin-modal-title");
  const modalMessage = document.getElementById("checkin-modal-message");
  const modalIcon = document.getElementById("checkin-modal-icon");

  if (!modal || !modalTitle || !modalMessage || !modalIcon) {
    return;
  }

  modal.classList.remove("hidden");
  modal.classList.toggle("is-error", type === "error");
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalIcon.textContent = icon;
  modal.setAttribute("aria-hidden", "false");
}

function hideCheckinModal() {
  const modal = document.getElementById("checkin-modal");
  if (!modal) {
    return;
  }

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

// ===========================
// DASHBOARD RENDER ENGINE
// ===========================

let moodChartInstance = null;
let emotionChartInstance = null;

function extractLabels(emotions) {
  if (!Array.isArray(emotions)) return [];
  return emotions
    .map((e) => {
      if (typeof e === "object" && e !== null) return String(e.label || "").trim();
      return String(e).trim();
    })
    .filter(Boolean);
}

function renderDashboard() {
  const logs = JSON.parse(localStorage.getItem("mindai_emotion_logs") || "[]");
  const moodChecks = logs.filter((e) => e.source === "mood_check" || (e.moodValue !== undefined && e.source !== "ai_summary"));

  renderStatCards(moodChecks);
  renderMoodTrendChart(moodChecks);
  renderEmotionBarChart(logs);
  renderEmotionList(logs);

  if (typeof renderReflectiveWordCloud === "function") {
    renderReflectiveWordCloud({ canvasId: "dash-wordcloud-canvas", placeholderId: "dash-wordcloud-placeholder" });
  }
}

window.MindAIRenderDashboard = renderDashboard;

function renderStatCards(moodChecks) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekCheckins = moodChecks.filter((e) => new Date(e.timestamp) >= weekAgo).length;
  document.getElementById("stat-checkins").textContent = weekCheckins;

  const scores = moodChecks.map((e) => e.moodValue).filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (scores.length > 0) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    document.getElementById("stat-avgmood").textContent = avg.toFixed(1) + "/100";
  } else {
    document.getElementById("stat-avgmood").textContent = "—";
  }

  const uniqueDays = new Set(moodChecks.map((e) => e.timestamp?.slice(0, 10)).filter(Boolean));
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  document.getElementById("stat-streak").textContent = streak;
}

function renderMoodTrendChart(moodChecks) {
  const canvas = document.getElementById("mood-line-chart");
  const emptyMsg = document.getElementById("mood-line-empty");
  if (!canvas) return;

  if (moodChartInstance) moodChartInstance.destroy();

  const pointsByDay = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    pointsByDay[key] = {
      index: 6 - i,
      label: d.toLocaleDateString("en", { weekday: "short" }),
      dateLabel: d.toLocaleDateString("id", { day: "2-digit", month: "short" }),
      points: [],
    };
  }

  const sortedChecks = [...moodChecks].filter((entry) => typeof entry?.moodValue === "number" && !Number.isNaN(entry.moodValue) && entry?.timestamp).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  sortedChecks.forEach((entry) => {
    const key = entry.timestamp.slice(0, 10);
    const dayBucket = pointsByDay[key];
    if (!dayBucket) return;

    const sameDayPointCount = dayBucket.points.length;
    const spread = 0.12;
    const offset = (sameDayPointCount - (sameDayPointCount > 0 ? (sameDayPointCount - 1) / 2 : 0)) * spread;

    dayBucket.points.push({
      x: dayBucket.index + offset,
      y: entry.moodValue,
      timestamp: entry.timestamp,
      moodValue: entry.moodValue,
      label: dayBucket.label,
      dateLabel: dayBucket.dateLabel,
    });
  });

  const data = Object.values(pointsByDay).flatMap((bucket) => bucket.points);

  const hasData = data.length > 0;
  if (emptyMsg) emptyMsg.classList.toggle("hidden", hasData);
  if (emptyMsg) emptyMsg.style.display = hasData ? "none" : "block";
  canvas.style.display = hasData ? "block" : "none";

  if (!hasData || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  canvas.parentElement.style.position = "relative";
  moodChartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Mood Score",
          data,
          showLine: false,
          borderColor: "rgba(156, 175, 136, 0.24)",
          backgroundColor: "#9CAF88",
          pointBackgroundColor: "#9CAF88",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1.5,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(context) {
              const item = context?.[0]?.raw;
              if (!item) return "Mood check-in";
              return `${item.label}, ${item.dateLabel}`;
            },
            label(context) {
              const item = context.raw || {};
              return `Mood ${item.moodValue}/100`;
            },
            afterLabel(context) {
              const item = context.raw || {};
              return item.timestamp ? new Date(item.timestamp).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" }) : "";
            },
          },
        },
      },
      scales: {
        y: { min: 0, max: 100, ticks: { stepSize: 25, color: "#a5a8a0" }, grid: { color: "rgba(194,200,191,0.2)" } },
        x: {
          min: -0.5,
          max: 6.5,
          ticks: {
            color: "#a5a8a0",
            callback(value) {
              const dayIndex = Math.round(Number(value));
              const dayNames = Object.values(pointsByDay)
                .sort((a, b) => a.index - b.index)
                .map((item) => item.label);

              return dayIndex >= 0 && dayIndex < dayNames.length ? dayNames[dayIndex] : "";
            },
          },
          grid: { display: false },
        },
      },
    },
  });
}

function renderEmotionBarChart(logs) {
  const canvas = document.getElementById("emotion-bar-chart");
  const emptyMsg = document.getElementById("emotion-bar-empty");
  if (!canvas) return;

  if (emotionChartInstance) emotionChartInstance.destroy();

  const freq = {};
  logs.forEach((entry) => {
    const labels = extractLabels(entry.emotions);
    labels.forEach((l) => {
      freq[l] = (freq[l] || 0) + 1;
    });
  });

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const hasData = sorted.length > 0;

  if (emptyMsg) emptyMsg.classList.toggle("hidden", hasData);
  if (emptyMsg) emptyMsg.style.display = hasData ? "none" : "block";
  canvas.style.display = hasData ? "block" : "none";

  if (!hasData || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  emotionChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map(([l]) => l),
      datasets: [
        {
          label: "Frequency",
          data: sorted.map(([_, c]) => c),
          backgroundColor: ["#9CAF88", "#B0C4DE", "#A3B8CC", "#8FA479", "#C5D5C0", "#7BA48B", "#D4C5A9", "#A8C5D6", "#B8C9A8", "#C0B8D6"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: "#a5a8a0" }, grid: { color: "rgba(194,200,191,0.2)" } },
        x: { ticks: { color: "#727971", maxRotation: 45 } },
      },
    },
  });
}

function renderEmotionList(logs) {
  const list = document.getElementById("emotion-list-dash");
  if (!list) return;

  const freq = {};
  logs.forEach((entry) => {
    const labels = extractLabels(entry.emotions);
    labels.forEach((l) => {
      freq[l] = (freq[l] || 0) + 1;
    });
  });

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const total = sorted.reduce((s, [_, c]) => s + c, 0);

  list.innerHTML = "";
  if (sorted.length === 0) {
    list.innerHTML = '<li class="emotion-list-empty">No data yet.</li>';
    return;
  }

  sorted.forEach(([label, count]) => {
    const li = document.createElement("li");
    const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
    li.innerHTML = `<span>${label}</span><span class="percentage">${pct}%</span>`;
    list.appendChild(li);
  });
}

// ===========================
// SINGLE PAGE APP ROUTER + SPLASH SCREEN ADDITIONS
// ===========================

document.addEventListener("DOMContentLoaded", function () {
  const routeMap = {
    "": "home",
    "#": "home",
    "#home": "home",
    "#chat": "chat",
    "#mood": "mood",
    "#dashboard": "dashboard",
    "#resources": "resources",
    "#settings": "settings",
    "index.html": "home",
    "./index.html": "home",
    "chat.html": "chat",
    "./chat.html": "chat",
    "mood-canvas.html": "mood",
    "./mood-canvas.html": "mood",
    "dashboard.html": "dashboard",
    "./dashboard.html": "dashboard",
    "resources.html": "resources",
    "./resources.html": "resources",
    "settings.html": "settings",
    "./settings.html": "settings",
  };

  const pageTitles = {
    home: "MindAI - Emotional Wellness",
    chat: "Chat - MindAI",
    mood: "Mood Check - MindAI",
    dashboard: "Analytics - MindAI",
    resources: "Resources - MindAI",
    settings: "Settings - MindAI",
  };

  const navByPage = {
    home: "#home",
    chat: "#chat",
    mood: "#mood",
    dashboard: "#dashboard",
    resources: "#resources",
    settings: "#settings",
  };

  function normalizeHref(href) {
    if (!href) return "";
    if (href.startsWith("#")) return href;
    try {
      const url = new URL(href, window.location.href);
      return url.pathname.split("/").pop() + (url.hash || "");
    } catch (error) {
      return href;
    }
  }

  function resolvePage(href) {
    const normalized = normalizeHref(href);
    const withoutHash = normalized.split("#")[0];
    const hash = normalized.includes("#") ? "#" + normalized.split("#").slice(1).join("#") : normalized;

    if (routeMap[normalized]) return routeMap[normalized];
    if (routeMap[withoutHash]) return routeMap[withoutHash];
    if (routeMap[hash]) return routeMap[hash];
    return null;
  }

  function showPage(page, options = {}) {
    const target = document.getElementById(`page-${page}`);
    if (!target) return;

    document.querySelectorAll(".spa-page").forEach((section) => {
      if (!section.hasAttribute("tabindex")) {
        section.setAttribute("tabindex", "-1");
      }
    });

    document.querySelectorAll(".spa-page").forEach((section) => {
      section.classList.toggle("active", section.dataset.page === page);
    });

    document.querySelectorAll(".nav-link").forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", href === navByPage[page]);
    });

    document.title = pageTitles[page] || pageTitles.home;

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("active");

    if (!options.skipHash) {
      const nextHash = page === "home" ? "#home" : `#${page}`;
      if (window.location.hash !== nextHash) {
        history.replaceState(null, "", nextHash);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (page === "dashboard" && typeof renderDashboard === "function") {
      renderDashboard();
    }

    if (page === "chat" && typeof window.MindAIEnsureStarterGreeting === "function") {
      void window.MindAIEnsureStarterGreeting();
    }

    if (typeof window.MindAIHydrateUserProfile === "function") {
      window.MindAIHydrateUserProfile();
    }

    if (typeof window.MindAIHydrateApiKeyField === "function") {
      window.MindAIHydrateApiKeyField();
    }

    if (typeof window.MindAIEnhanceAccessibility === "function") {
      window.MindAIEnhanceAccessibility(document);
    }

    if (!options.skipFocus) {
      window.requestAnimationFrame(() => {
        target.focus({ preventScroll: true });
      });
    }
  }

  // Keep placeholder links from triggering the original smooth-scroll handler.
  document.addEventListener(
    "click",
    function (event) {
      const link = event.target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (href === "#") {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const page = resolvePage(href);
      if (page) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showPage(page);
      }
    },
    true,
  );

  window.addEventListener("hashchange", function () {
    const page = resolvePage(window.location.hash) || "home";
    showPage(page, { skipHash: true });
  });

  const initialPage = resolvePage(window.location.hash) || "home";
  showPage(initialPage, { skipHash: true });

  const splashScreen = document.getElementById("splash-screen");
  const splashEnter = document.getElementById("splash-enter");
  const splashSkip = document.getElementById("splash-skip");

  function hideSplash() {
    if (!splashScreen) return;
    splashScreen.classList.add("hidden");
    window.setTimeout(() => {
      splashScreen.style.display = "none";
    }, 400);
  }

  if (splashEnter) {
    splashEnter.addEventListener("click", function () {
      hideSplash();
      showPage("dashboard");
    });
  }

  if (splashSkip) {
    splashSkip.addEventListener("click", hideSplash);
  }

  window.setTimeout(hideSplash, 1800);

  const moodSaveButton = document.querySelector("#page-mood .form-actions .btn-primary");
  if (moodSaveButton) {
    moodSaveButton.addEventListener("click", function () {
      if (typeof saveMood === "function") {
        saveMood();
      }
    });
  }
});
