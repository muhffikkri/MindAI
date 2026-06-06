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
  USER_NAME: "mindai_user_name",
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
  hydrateUserProfile();
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
  if (!localStorage.getItem(STORAGE_KEYS.USER_NAME)) {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, "");
  }

  appState.chatHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY));
  appState.emotionLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMOTION_LOGS));

  window.MindAIAppState = appState;
}

/**
 * @description Memeriksa eksistensi API Key lokal di browser.
 */
async function checkApiKeyPresence() {
  const keyManager = window.MindAIKeyManager;
  const storedKey = keyManager ? keyManager.getStoredGeminiApiKey() : localStorage.getItem(STORAGE_KEYS.GEMINI_KEY);
  const key = keyManager ? await keyManager.resolveGeminiApiKey() : storedKey;
  const statusText = document.getElementById("api-key-status");
  const noticeText = document.getElementById("api-key-notice");

  if (!storedKey || storedKey.trim() === "") {
    console.warn("Gemini API Key is missing from localStorage. Demo guidance will be shown in Settings.");
    if (statusText) {
      statusText.textContent = key ? "localStorage kosong, tetapi aplikasi masih menemukan sumber key lain untuk sesi ini." : "Belum ada key tersimpan di localStorage.";
    }

    if (noticeText) {
      noticeText.textContent = "Belum ada API key di localStorage. Untuk demo, silakan input API key di Settings agar chat AI bisa digunakan.";
      noticeText.classList.remove("hidden");
    }
    return;
  }

  if (statusText) {
    statusText.textContent = "Menggunakan key dari localStorage.";
  }

  if (noticeText) {
    noticeText.classList.add("hidden");
  }
}

function hydrateApiKeyField() {
  const input = document.getElementById("api-key-input");
  const statusText = document.getElementById("api-key-status");
  const noticeText = document.getElementById("api-key-notice");
  const storedKey = window.MindAIKeyManager?.getStoredGeminiApiKey() || localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || "";

  if (input) {
    input.value = storedKey;
  }

  if (statusText) {
    statusText.textContent = storedKey ? "Key tersimpan di localStorage dan akan diprioritaskan." : "Jika localStorage kosong, gunakan form ini untuk menambahkan API key demo.";
  }

  if (noticeText && !storedKey) {
    noticeText.textContent = "Belum ada API key di localStorage. Untuk demo, masukkan API key di sini agar MindAI bisa memulai chat AI.";
    noticeText.classList.remove("hidden");
  }
}

function hydrateUserProfile() {
  const nameInput = document.getElementById("user-name-input");
  const storedName = window.MindAIProfile?.getStoredUserName() || localStorage.getItem(STORAGE_KEYS.USER_NAME) || "";
  const displayName = storedName || "Alex";
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || "A";

  if (nameInput) {
    nameInput.value = storedName;
  }

  document.querySelectorAll(".user-name, #sidebar-user-name").forEach((element) => {
    element.textContent = displayName;
  });

  const avatarElements = [document.getElementById("sidebar-user-avatar"), document.getElementById("header-user-avatar")];
  avatarElements.forEach((avatarEl) => {
    if (avatarEl) {
      avatarEl.textContent = avatarLetter;
    }
  });
}

window.MindAIHydrateApiKeyField = hydrateApiKeyField;
window.MindAIHydrateUserProfile = hydrateUserProfile;

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
      const moodCanvasSection = document.getElementById("mood-canvas-section");
      const chatInterfaceSection = document.getElementById("chat-interface-section");

      moodCanvasSection?.classList.add("hidden");
      chatInterfaceSection?.classList.remove("hidden");

      // Trigger initial greeting without reading any mood or weather state.
      if (typeof window.MindAIEnsureStarterGreeting === "function") {
        await window.MindAIEnsureStarterGreeting();
      }

      chatInterfaceSection?.setAttribute("tabindex", "-1");
      chatInterfaceSection?.focus({ preventScroll: true });
    });
  }

  // Modal Control Logic Handlers (Settings & Distress)
  document.getElementById("btn-open-settings")?.addEventListener("click", () => {
    const settingsPage = document.getElementById("page-settings");
    settingsPage?.scrollIntoView({ behavior: "smooth", block: "start" });
    settingsPage?.setAttribute("tabindex", "-1");
    settingsPage?.focus({ preventScroll: true });
  });
  document.getElementById("btn-close-settings")?.addEventListener("click", () => {
    const settingsPage = document.getElementById("page-settings");
    settingsPage?.scrollIntoView({ behavior: "smooth", block: "start" });
    settingsPage?.setAttribute("tabindex", "-1");
    settingsPage?.focus({ preventScroll: true });
  });

  document.getElementById("btn-distress")?.addEventListener("click", () => document.getElementById("coping-modal").classList.remove("hidden"));
  document.getElementById("btn-close-coping")?.addEventListener("click", () => document.getElementById("coping-modal").classList.add("hidden"));

  // Save Action API Key Configuration Trigger
  document.getElementById("btn-save-settings")?.addEventListener("click", () => {
    const inputEl = document.getElementById("api-key-input");
    const nameInput = document.getElementById("user-name-input");
    const inputVal = inputEl?.value || "";
    const inputName = nameInput?.value || "";

    if (window.MindAIProfile) {
      window.MindAIProfile.setStoredUserName(inputName);
    } else if (inputName.trim() !== "") {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, inputName.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    }

    if (window.MindAIKeyManager) {
      const savedKey = window.MindAIKeyManager.setStoredGeminiApiKey(inputVal);
      if (savedKey) {
        alert("API Key berhasil disimpan di peramban lokal.");
      } else {
        alert("API Key lokal dihapus. MindAI akan meminta key dari localStorage saat chat dibuka.");
      }
    } else if (inputVal.trim() !== "") {
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, inputVal.trim());
      alert("API Key berhasil disimpan di peramban lokal.");
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
      alert("API Key lokal dihapus. MindAI akan meminta key dari localStorage saat chat dibuka.");
    }

    hydrateUserProfile();
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
