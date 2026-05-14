/**
 * @file app.js
 * @description Central Application UI Coordinator and LocalStorage State Engine.
 * @author Anggota 5 (Data Logic) & Anggota 2 (UI/UX)
 */

// Keys Constants for LocalStorage Persistence
const STORAGE_KEYS = {
  CHAT_HISTORY: "mindai_chat_history",
  EMOTION_LOGS: "mindai_emotion_logs",
  GEMINI_KEY: "mindai_gemini_key",
};

// Global Application State Manager Object
let appState = {
  selectedWeather: "",
  colorRangeValue: 50,
  chatHistory: [],
  emotionLogs: [],
};

// INITIALIZATION EVENT HANDLER ON DOM LOADED
document.addEventListener("DOMContentLoaded", () => {
  initStorageEngine();
  registerUIEventListeners();
  checkApiKeyPresence();
});

/**
 * @description Inisialisasi data array default jika LocalStorage kosong.
 */
function initStorageEngine() {
  if (!localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)) {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMOTION_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.EMOTION_LOGS, JSON.stringify([]));
  }

  appState.chatHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY));
  appState.emotionLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMOTION_LOGS));
}

/**
 * @description Memeriksa eksistensi API Key lokal di browser.
 */
function checkApiKeyPresence() {
  const key = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY);
  if (!key || key.trim() === "") {
    console.warn("Gemini API Key is empty. Restricting Chat Interface Access.");
    // Jalankan logika untuk memicu/menampilkan modal Settings secara otomatis jika kosong
    document.getElementById("settings-modal").classList.remove("hidden");
  }
}

/**
 * @description Registrasi seluruh event listener interaksi komponen UI.
 */
function registerUIEventListeners() {
  // Weather Metaphor Options Selection Handling
  const weatherButtons = document.querySelectorAll(".weather-opt");
  weatherButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      weatherButtons.forEach((b) => b.classList.remove("active"));
      const targetButton = e.currentTarget;
      targetButton.classList.add("active");
      appState.selectedWeather = targetButton.getAttribute("data-weather");
    });
  });

  // Navigation Switch from Mood Canvas Onboarding to Active AI Chat Interface
  const btnStartChat = document.getElementById("btn-start-chat");
  if (btnStartChat) {
    btnStartChat.addEventListener("click", () => {
      if (!appState.selectedWeather) {
        alert("Harap pilih metafora visual cuaca Anda terlebih dahulu.");
        return;
      }
      // Switch layout visibility context
      document.getElementById("mood-canvas-section").classList.add("hidden");
      document.getElementById("chat-interface-section").classList.remove("hidden");

      // Trigger initial sequence injection wrapper
      if (typeof triggerAIFirstGreeting === "function") {
        triggerAIFirstGreeting(appState.selectedWeather, document.getElementById("color-range").value);
      }
    });
  }

  // Modal Control Logic Handlers (Settings & Distress)
  document.getElementById("btn-open-settings")?.addEventListener("click", () => document.getElementById("settings-modal").classList.remove("hidden"));
  document.getElementById("btn-close-settings")?.addEventListener("click", () => document.getElementById("settings-modal").classList.add("hidden"));

  document.getElementById("btn-distress")?.addEventListener("click", () => document.getElementById("coping-modal").classList.remove("hidden"));
  document.getElementById("btn-close-coping")?.addEventListener("click", () => document.getElementById("coping-modal").classList.add("hidden"));

  // Save Action API Key Configuration Trigger
  document.getElementById("btn-save-settings")?.addEventListener("click", () => {
    const inputVal = document.getElementById("api-key-input").value;
    if (inputVal.trim() !== "") {
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, inputVal.trim());
      document.getElementById("settings-modal").classList.add("hidden");
      alert("API Key berhasil disimpan di peramban lokal.");
    }
  });
}
