/**
 * @file ai-engine.js
 * @description Remote Extraction Engine and REST Fetch Configuration Layer for Google Gemini API.
 * @author Anggota 1 (Project Leader & AI Engineer)
 */

const GEMINI_CONFIG = {
  // Menggunakan v1beta agar mendukung fitur system_instruction dan JSON response
  ENDPOINT_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
  SYSTEM_INSTRUCTION:
    "Kamu adalah MindAI, sebuah kecerdasan buatan interaktif yang bertindak sebagai konselor psikologis penyabar, ramah, hangat, dan terlatih khusus menggunakan metode Terapi Somatik untuk membantu individu dengan Alexithymia. Jangan pernah memulai obrolan dengan pertanyaan abstrak seperti 'Apa yang kamu rasakan hari ini?'. Fokuslah memandu pengguna untuk mengidentifikasi kondisi fisik tubuh mereka terlebih dahulu (seperti ketegangan otot di pundak, detak jantung, atau suhu tangan) atau gunakan analogi metafora (seperti cuaca atau warna). Gunakan kalimat pendek, menenangkan, dan jangan menghakimi.",
};

const GEMINI_KEY_STORAGE = "mindai_gemini_key";
const USER_NAME_STORAGE = "mindai_user_name";
const CHAT_HISTORY_STORAGE = "mindai_chat_history";
const EMOTION_LOGS_STORAGE = "mindai_emotion_logs";
const EMOTION_EXTRACTION_META_STORAGE = "mindai_emotion_extraction_meta";

function getStoredGeminiApiKey() {
  return localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() || "";
}

function setStoredGeminiApiKey(apiKey) {
  const normalizedKey = apiKey.trim();
  if (normalizedKey) {
    localStorage.setItem(GEMINI_KEY_STORAGE, normalizedKey);
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }

  return normalizedKey;
}

function clearStoredGeminiApiKey() {
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}

function getStoredUserName() {
  return localStorage.getItem(USER_NAME_STORAGE)?.trim() || "";
}

function setStoredUserName(userName) {
  const normalizedName = userName.trim();
  if (normalizedName) {
    localStorage.setItem(USER_NAME_STORAGE, normalizedName);
  } else {
    localStorage.removeItem(USER_NAME_STORAGE);
  }

  return normalizedName;
}

function readChatHistory() {
  try {
    return JSON.parse(localStorage.getItem(CHAT_HISTORY_STORAGE) || "[]");
  } catch (error) {
    return [];
  }
}

function writeChatHistory(history) {
  localStorage.setItem(CHAT_HISTORY_STORAGE, JSON.stringify(history));
}

function appendChatHistory(entry) {
  const history = readChatHistory();
  history.push({
    timestamp: new Date().toISOString(),
    ...entry,
  });
  writeChatHistory(history);
  return history;
}

function readEmotionExtractionMeta() {
  try {
    return JSON.parse(localStorage.getItem(EMOTION_EXTRACTION_META_STORAGE) || "{}");
  } catch (error) {
    return {};
  }
}

function writeEmotionExtractionMeta(meta) {
  localStorage.setItem(EMOTION_EXTRACTION_META_STORAGE, JSON.stringify(meta));
}

function countUserMessages(history) {
  return history.reduce((count, entry) => (entry?.role === "user" ? count + 1 : count), 0);
}

function normalizeEmotionLabels(labels) {
  if (!Array.isArray(labels)) return [];

  return labels
    .map((label) => String(label).trim())
    .filter(Boolean)
    .slice(0, 5);
}

function sanitizeGeminiHistory(history = []) {
  return history
    .map((entry) => ({
      role: entry?.role,
      parts: Array.isArray(entry?.parts)
        ? entry.parts
            .map((part) => ({
              text: typeof part?.text === "string" ? part.text : "",
            }))
            .filter((part) => part.text)
        : [],
    }))
    .filter((entry) => entry.role && entry.parts.length > 0);
}

function saveEmotionExtractionResult(labels, userMessageCount) {
  const currentLogs = JSON.parse(localStorage.getItem(EMOTION_LOGS_STORAGE) || "[]");
  const updatedLogs = [
    ...currentLogs,
    {
      source: "ai_summary",
      timestamp: new Date().toISOString(),
      userMessageCount,
      emotions: labels,
    },
  ];

  localStorage.setItem(EMOTION_LOGS_STORAGE, JSON.stringify(updatedLogs));
}

function formatChatTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
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

  return text.replace(/[&<>"']/g, (character) => map[character]);
}

function appendAssistantMessage(messageText) {
  const chatContainer = document.getElementById("chat-messages");
  if (!chatContainer) {
    return null;
  }

  const safeMessage = escapeHtml(messageText);
  const messageTime = formatChatTime();
  const botHtml = `
    <div class="message bot-message">
      <div class="message-avatar">S</div>
      <div class="message-content">
        <div class="message-bubble">${safeMessage}</div>
        <span class="message-time">${messageTime}</span>
      </div>
    </div>
  `;

  chatContainer.insertAdjacentHTML("beforeend", botHtml);
  return chatContainer.lastElementChild;
}

function buildStarterPrompt() {
  return [
    "Kamu adalah MindAI, asisten chat yang memulai percakapan lebih dulu.",
    "Tulis satu pesan pembuka yang hangat, menenangkan, singkat, dan terasa seperti ajakan hadir bersama pengguna.",
    "Jangan bertanya hal abstrak seperti 'Apa yang kamu rasakan hari ini?'.",
    "Ajak pengguna untuk memperhatikan napas, bahu, atau sensasi tubuh yang paling mudah dirasakan saat ini.",
    "Output hanya satu pesan untuk dikirim langsung ke pengguna, tanpa daftar, tanpa label, tanpa tanda kutip tambahan.",
  ].join(" ");
}

function buildAssistantPrompt(userMessage, userName = getStoredUserName()) {
  const personalizationHint = userName ? `Jika relevan, panggil pengguna dengan nama ${userName}.` : "Jika nama belum tersedia, tetap gunakan sapaan yang hangat tanpa memaksakan nama.";

  return [
    "Kamu adalah MindAI, konselor psikologis yang sabar, ramah, hangat, dan fokus pada terapi somatik.",
    "Balas secara singkat, menenangkan, dan tidak menghakimi.",
    "Bantu pengguna mengenali sensasi fisik sebelum interpretasi emosi.",
    personalizationHint,
    "Gunakan 1-3 kalimat saja.",
    `Pesan pengguna: ${userMessage}`,
  ].join(" ");
}

async function generateStarterGreeting() {
  return "Halo. Aku MindAI, dan aku akan menemani kamu pelan-pelan. Untuk sekarang, cukup tarik napas sebentar dan perhatikan bagian tubuh yang paling terasa tegang atau tidak nyaman.";
}

async function generateAssistantReply(historyLog, userMessage) {
  const responseText = await fetchGeminiResponse([
    ...historyLog,
    {
      role: "user",
      parts: [{ text: buildAssistantPrompt(userMessage) }],
    },
  ]);

  return responseText?.trim() || "Aku ada di sini bersamamu. Coba perhatikan dulu bagian tubuh mana yang paling terasa tidak nyaman saat ini.";
}

function shouldExtractEmotionLabels(history) {
  const userMessageCount = countUserMessages(history);
  const meta = readEmotionExtractionMeta();

  if (userMessageCount < 5) {
    return false;
  }

  if (userMessageCount % 5 !== 0) {
    return false;
  }

  if (Number(meta.lastExtractedUserCount || 0) >= userMessageCount) {
    return false;
  }

  return true;
}

async function extractEmotionLabelsFromHistory(history = readChatHistory(), options = {}) {
  const { force = false } = options;
  const userMessageCount = countUserMessages(history);

  if (history.length < 2 || (!force && !shouldExtractEmotionLabels(history))) {
    return null;
  }

  const apiKey = await resolveGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  const extractionPrompt = {
    role: "user",
    parts: [
      {
        text: 'Berdasarkan seluruh percakapan kita di atas, ekstrak maksimal 5 label emosi (kata sifat tunggal dalam Bahasa Indonesia) yang paling menggambarkan kondisi pengguna. Berikan output HANYA dalam format JSON murni seperti ini: {"emotions": ["Marah", "Lelah"]}',
      },
    ],
  };

  const sanitizedHistory = sanitizeGeminiHistory(history);

  const payload = {
    contents: [...sanitizedHistory, extractionPrompt],
    generationConfig: {
      response_mime_type: "application/json",
    },
  };

  try {
    const response = await fetch(`${GEMINI_CONFIG.ENDPOINT_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Terjadi kesalahan saat ekstraksi emosi.");
    }

    const data = await response.json();
    const jsonString = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!jsonString) {
      throw new Error("Respons ekstraksi emosi kosong.");
    }

    const parsedResult = JSON.parse(jsonString);
    const emotions = normalizeEmotionLabels(parsedResult?.emotions);

    if (emotions.length === 0) {
      return null;
    }

    saveEmotionExtractionResult(emotions, userMessageCount);
    writeEmotionExtractionMeta({
      lastExtractedUserCount: userMessageCount,
      lastExtractionAt: new Date().toISOString(),
    });

    return emotions;
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
}

window.MindAIChatEngine = {
  appendChatHistory,
  buildAssistantPrompt,
  buildStarterPrompt,
  countUserMessages,
  clearStoredGeminiApiKey,
  extractEmotionLabelsFromHistory,
  fetchGeminiResponse,
  formatChatTime,
  generateAssistantReply,
  generateStarterGreeting,
  getStoredGeminiApiKey,
  getStoredUserName,
  readChatHistory,
  resolveGeminiApiKey,
  saveEmotionExtractionResult,
  setStoredGeminiApiKey,
  setStoredUserName,
  shouldExtractEmotionLabels,
  writeEmotionExtractionMeta,
  writeChatHistory,
};

async function resolveGeminiApiKey() {
  return getStoredGeminiApiKey();
}

window.MindAIKeyManager = {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
  resolveGeminiApiKey,
};

window.MindAIProfile = {
  getStoredUserName,
  setStoredUserName,
};

/**
 * @description Fungsi perantara untuk menginjeksikan sapaan pembuka AI ke UI.
 */
async function triggerAIFirstGreeting() {
  const chatContainer = document.getElementById("chat-messages");
  const alreadyStarted = Boolean(chatContainer && chatContainer.children.length > 0);

  if (alreadyStarted) {
    return null;
  }

  try {
    const systemGreeting = await generateStarterGreeting();
    appendAssistantMessage(systemGreeting);
    appendChatHistory({ role: "model", parts: [{ text: systemGreeting }] });
    return systemGreeting;
  } catch (error) {
    console.error("Starter greeting error:", error);
    const fallbackGreeting = `Halo. Aku MindAI, dan aku akan menemani kamu pelan-pelan. Untuk sekarang, cukup tarik napas sebentar dan perhatikan bagian tubuh yang paling terasa tegang atau tidak nyaman.`;
    appendAssistantMessage(fallbackGreeting);
    appendChatHistory({ role: "model", parts: [{ text: fallbackGreeting }] });
    return fallbackGreeting;
  }
}

/**
 * @description Handler asinkron untuk mengirimkan payload ke Gemini API.
 * @param {Array} historyLog - Array log pesan terstruktur [{role: "user/model", parts: [{text: "..."}]}]
 */
async function fetchGeminiResponse(historyLog) {
  const apiKey = await resolveGeminiApiKey();
  if (!apiKey) {
    alert("API Key belum terdeteksi di localStorage. Untuk demo, silakan input API key di Settings agar chat AI bisa berjalan.");
    return null;
  }

  const payload = {
    contents: sanitizeGeminiHistory(historyLog),
    system_instruction: {
      parts: [{ text: GEMINI_CONFIG.SYSTEM_INSTRUCTION }],
    },
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  try {
    const response = await fetch(`${GEMINI_CONFIG.ENDPOINT_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || "Terjadi kesalahan pada API.");
    }

    const data = await response.json();
    const botResponse = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!botResponse) {
      throw new Error("Respons AI kosong atau tidak valid.");
    }

    return botResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    alert("Gagal mengambil respons AI: " + error.message);
    return null;
  }
}

/**
 * @description Mengekstrak label emosi dari percakapan menggunakan format JSON.
 * Dipanggil saat user menekan tombol 'Selesai'.
 */
async function runHiddenEmotionExtraction() {
  return extractEmotionLabelsFromHistory(readChatHistory(), { force: true });
}
