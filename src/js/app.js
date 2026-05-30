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
  void checkApiKeyPresence();
  hydrateApiKeyField();
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
async function checkApiKeyPresence() {
  const keyManager = window.MindAIKeyManager;
  const key = keyManager ? await keyManager.resolveGeminiApiKey() : localStorage.getItem(STORAGE_KEYS.GEMINI_KEY);
  const statusText = document.getElementById("api-key-status");

  if (!key || key.trim() === "") {
    console.warn("Gemini API Key is empty. Restricting Chat Interface Access.");
    if (statusText) {
      statusText.textContent = "Belum ada key tersimpan. Tambahkan di bawah atau lewat file .env lokal.";
    }

    document.getElementById("page-settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("api-key-input")?.focus();
    return;
  }

  if (statusText) {
    statusText.textContent = keyManager && keyManager.getStoredGeminiApiKey() ? "Menggunakan key dari localStorage." : "Menggunakan key dari file .env lokal atau konfigurasi browser.";
  }
}

function hydrateApiKeyField() {
  const input = document.getElementById("api-key-input");
  const statusText = document.getElementById("api-key-status");
  const storedKey = window.MindAIKeyManager?.getStoredGeminiApiKey() || localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || "";

  if (input && storedKey) {
    input.value = storedKey;
  }

  if (statusText) {
    statusText.textContent = storedKey ? "Key tersimpan di localStorage dan akan diprioritaskan." : "Jika localStorage kosong, aplikasi mencoba membaca file .env lokal.";
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
    btnStartChat.addEventListener("click", async () => {
      if (!appState.selectedWeather) {
        alert("Harap pilih metafora visual cuaca Anda terlebih dahulu.");
        return;
      }
      // Switch layout visibility context
      document.getElementById("mood-canvas-section").classList.add("hidden");
      document.getElementById("chat-interface-section").classList.remove("hidden");

      // Trigger initial sequence injection wrapper
      if (typeof triggerAIFirstGreeting === "function") {
        await triggerAIFirstGreeting(appState.selectedWeather, document.getElementById("color-range").value);
      }
    });
  }

  // Modal Control Logic Handlers (Settings & Distress)
  document.getElementById("btn-open-settings")?.addEventListener("click", () => document.getElementById("page-settings")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  document.getElementById("btn-close-settings")?.addEventListener("click", () => document.getElementById("page-settings")?.scrollIntoView({ behavior: "smooth", block: "start" }));

  document.getElementById("btn-distress")?.addEventListener("click", () => document.getElementById("coping-modal").classList.remove("hidden"));
  document.getElementById("btn-close-coping")?.addEventListener("click", () => document.getElementById("coping-modal").classList.add("hidden"));

  // Save Action API Key Configuration Trigger
  document.getElementById("btn-save-settings")?.addEventListener("click", () => {
    const inputEl = document.getElementById("api-key-input");
    const inputVal = inputEl?.value || "";

    if (window.MindAIKeyManager) {
      const savedKey = window.MindAIKeyManager.setStoredGeminiApiKey(inputVal);
      if (savedKey) {
        alert("API Key berhasil disimpan di peramban lokal.");
      } else {
        alert("API Key lokal dihapus. Aplikasi akan mencoba memakai file .env lokal bila tersedia.");
      }
    } else if (inputVal.trim() !== "") {
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, inputVal.trim());
      alert("API Key berhasil disimpan di peramban lokal.");
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
      alert("API Key lokal dihapus. Aplikasi akan mencoba memakai file .env lokal bila tersedia.");
    }

    hydrateApiKeyField();
  });

  document.getElementById("btn-clear-api-key")?.addEventListener("click", () => {
    window.MindAIKeyManager?.clearStoredGeminiApiKey();
    localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);

    const inputEl = document.getElementById("api-key-input");
    if (inputEl) {
      inputEl.value = "";
    }

    hydrateApiKeyField();
    alert("API Key lokal dihapus.");
  });

  document.getElementById("btn-clear-data")?.addEventListener("click", () => {
    const confirmed = window.confirm("Hapus seluruh data chat, label, dan analytics?");
    if (!confirmed) {
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.EMOTION_LOGS);
    localStorage.removeItem("mindai_emotion_extraction_meta");

    appState.chatHistory = [];
    appState.emotionLogs = [];

    document.getElementById("chat-messages")?.replaceChildren();
    window.MindAIRenderDashboard?.();

    alert("Seluruh data chat, label, dan analytics sudah dihapus.");
  });
}
