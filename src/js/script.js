// ===========================
// ORIGINAL navigation.js
// ===========================
// Navigation and interactivity

document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");

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
    history.push({ role, parts: [{ text }] });
    writeChatHistory(history);
    return history;
  }

  function appendMessage(role, text, timeLabel = getCurrentTime()) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${role === "model" ? "bot-message" : "user-message"}`;
    messageEl.innerHTML = `
      <div class="message-avatar">${role === "model" ? "S" : "A"}</div>
      <div class="message-content">
        <div class="message-bubble">${escapeHtml(text)}</div>
        <span class="message-time">${timeLabel}</span>
      </div>
    `;
    chatMessages.appendChild(messageEl);
    return messageEl;
  }

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

    appendMessage("user", message);
    pushChatHistory("user", message);

    // Clear input
    chatInput.value = "";
    chatInput.style.height = "auto";

    // Scroll to bottom
    scrollToBottom();

    const typingEl = document.createElement("div");
    typingEl.className = "message bot-message";
    typingEl.innerHTML = `
      <div class="message-avatar">S</div>
      <div class="message-content">
        <div class="message-bubble">MindAI sedang menulis balasan...</div>
        <span class="message-time">${getCurrentTime()}</span>
      </div>
    `;
    chatMessages.appendChild(typingEl);
    scrollToBottom();

    try {
      const historyLog = historyBeforeUserMessage;
      const assistantReply = aiEngine?.generateAssistantReply
        ? await aiEngine.generateAssistantReply(historyLog, message)
        : aiEngine?.fetchGeminiResponse
          ? await aiEngine.fetchGeminiResponse([...historyLog, { role: "user", parts: [{ text: message }] }])
          : null;

      typingEl.remove();

      if (!assistantReply) {
        appendMessage("model", "Aku belum bisa mengambil respons saat ini. Coba kirim ulang sebentar lagi.");
        pushChatHistory("model", "Aku belum bisa mengambil respons saat ini. Coba kirim ulang sebentar lagi.");
        scrollToBottom();
        return;
      }

      appendMessage("model", assistantReply);
      pushChatHistory("model", assistantReply);
      scrollToBottom();
    } catch (error) {
      typingEl.remove();
      console.error("Chat response error:", error);
      const fallbackMessage = "Aku mengalami kendala saat mengambil respons AI. Coba lagi sebentar ya.";
      appendMessage("model", fallbackMessage);
      pushChatHistory("model", fallbackMessage);
      scrollToBottom();
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

function saveMood() {
  const activeEmotionButtons = Array.from(document.querySelectorAll("#page-mood .emotion-btn.active"));
  const selectedEmotions = activeEmotionButtons.map((button) => button.querySelector("span:last-child")?.textContent?.trim() || button.textContent.trim());
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
    const entry = {
      timestamp: new Date().toISOString(),
      moodValue: Number(moodValue),
      emotions: selectedEmotions,
      sensations: selectedSensations,
      notes,
    };

    const storedLogs = JSON.parse(localStorage.getItem("mindai_emotion_logs") || "[]");
    storedLogs.unshift(entry);
    localStorage.setItem("mindai_emotion_logs", JSON.stringify(storedLogs.slice(0, 50)));

    showCheckinModal("success", "Check-in saved successfully.", `Saved ${selectedEmotions.join(", ")} at mood ${moodValue}/100.`, "✓");
    return true;
  } catch (error) {
    showCheckinModal("error", "Save failed.", "Your browser could not store this check-in right now.", "✕");
    return false;
  }
}

function updateMoodSliderVisual(slider) {
  const value = Number(slider.value || 0);
  const fill = value <= 50 ? "#d8f2d5" : value <= 75 ? "#f9e3a8" : "#f7b3b3";
  slider.style.background = `linear-gradient(90deg, #cfe7ff 0%, #d8f2d5 ${Math.min(value, 35)}%, #f9e3a8 ${Math.min(value, 70)}%, #f7b3b3 100%)`;
  slider.setAttribute("aria-valuenow", String(value));
  slider.setAttribute("aria-valuetext", value <= 35 ? "calm" : value <= 65 ? "balanced" : "intense");
  slider.title = value <= 35 ? "calm" : value <= 65 ? "balanced" : "intense";
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
    home: "SomaCare - Emotional Wellness",
    chat: "Chat - SomaCare",
    mood: "Mood Check - SomaCare",
    dashboard: "Analytics - SomaCare",
    resources: "Resources - SomaCare",
    settings: "Settings - SomaCare",
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
