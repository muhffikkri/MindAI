/**
 * @file ai-engine.js
 * @description Remote Extraction Engine and REST Fetch Configuration Layer for Google Gemini API.
 * @author Anggota 1 (Project Leader & AI Engineer)
 */

const GEMINI_CONFIG = {
  // Menggunakan v1beta agar mendukung fitur system_instruction dan JSON response
  ENDPOINT_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  SYSTEM_INSTRUCTION:
    "Kamu adalah MindAI, sebuah kecerdasan buatan interaktif yang bertindak sebagai konselor psikologis penyabar, ramah, hangat, dan terlatih khusus menggunakan metode Terapi Somatik untuk membantu individu dengan Alexithymia. Jangan pernah memulai obrolan dengan pertanyaan abstrak seperti 'Apa yang kamu rasakan hari ini?'. Fokuslah memandu pengguna untuk mengidentifikasi kondisi fisik tubuh mereka terlebih dahulu (seperti ketegangan otot di pundak, detak jantung, atau suhu tangan) atau gunakan analogi metafora (seperti cuaca atau warna). Gunakan kalimat pendek, menenangkan, dan jangan menghakimi.",
};

/**
 * @description Fungsi perantara untuk menginjeksikan sapaan pembuka AI ke UI.
 */
async function triggerAIFirstGreeting(weather, colorEnergy) {
  const chatContainer = document.getElementById("chat-messages");

  let systemGreeting = `Selamat datang di MindAI. Aku melihat langit internalmu hari ini sedang sedikit ${weather} (Energi Spektrum: ${colorEnergy}/100), ya? Tidak apa-apa, mari kita temani kondisi itu sejenak di sini. Sambil beristirahat, apakah kamu merasakan ada bagian tubuhmu—mungkin di area dada atau pundak—yang terasa agak berat atau kaku saat ini? Ceritakan pelan-pelan.`;

  // Render greeting ke UI
  const botHtml = `
        <div class="flex flex-col items-start space-y-1 max-w-[80%] mb-4">
            <span class="text-xs text-gray-400 font-medium">MindAI Bot</span>
            <div class="bg-gray-100 text-gray-800 p-3.5 rounded-2xl rounded-tl-none text-sm leading-relaxed">${systemGreeting}</div>
        </div>
    `;
  chatContainer.insertAdjacentHTML("beforeend", botHtml);

  // Inisialisasi history awal dengan sapaan bot
  const history = JSON.parse(localStorage.getItem("mindai_chat_history") || "[]");
  history.push({ role: "model", parts: [{ text: systemGreeting }] });
  localStorage.setItem("mindai_chat_history", JSON.stringify(history));
}

/**
 * @description Handler asinkron untuk mengirimkan payload ke Gemini API.
 * @param {Array} historyLog - Array log pesan terstruktur [{role: "user/model", parts: [{text: "..."}]}]
 */
async function fetchGeminiResponse(historyLog) {
  const apiKey = localStorage.getItem("mindai_gemini_key");
  if (!apiKey) {
    alert("API Key Kosong! Silakan atur token Anda di panel Settings.");
    return null;
  }

  const payload = {
    contents: historyLog,
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
    const botResponse = data.candidates[0].content.parts[0].text;

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
  const apiKey = localStorage.getItem("mindai_gemini_key");
  const history = JSON.parse(localStorage.getItem("mindai_chat_history") || "[]");

  if (history.length < 2) return; // Belum cukup konteks

  // Prompt khusus untuk ekstraksi emosi
  const extractionPrompt = {
    role: "user",
    parts: [
      {
        text: 'Berdasarkan seluruh percakapan kita di atas, ekstrak maksimal 5 label emosi (kata sifat tunggal dalam Bahasa Indonesia) yang paling menggambarkan kondisi pengguna. Berikan output HANYA dalam format JSON murni seperti ini: {"emotions": ["Marah", "Lelah"]}',
      },
    ],
  };

  const payload = {
    contents: [...history, extractionPrompt],
    generationConfig: {
      response_mime_type: "application/json", // Memaksa output menjadi JSON
    },
  };

  try {
    console.log("Memulai ekstraksi emosi...");
    const response = await fetch(`${GEMINI_CONFIG.ENDPOINT_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const jsonString = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(jsonString);

    if (result.emotions) {
      // Simpan hasil ke emotion logs untuk WordCloud
      const currentLogs = JSON.parse(localStorage.getItem("mindai_emotion_logs") || "[]");
      const updatedLogs = [...currentLogs, ...result.emotions];
      localStorage.setItem("mindai_emotion_logs", JSON.stringify(updatedLogs));

      console.log("Ekstraksi berhasil:", result.emotions);
      return result.emotions;
    }
  } catch (error) {
    console.error("Extraction Error:", error);
  }
}
