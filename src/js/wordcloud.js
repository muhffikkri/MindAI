/**
 * @file wordcloud.js
 * @description Wordcloud Canvas Rendering Engine using WordCloud.js Library.
 * @author Anggota 2 (UI/UX Frontend) & Anggota 5 (Data Logic)
 */

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("wordcloud-canvas")) {
    renderReflectiveWordCloud();
  }
});

/**
 * @description Membaca data array emosi lokal dan memproses hitungan frekuensi bobot kata emosi untuk dirender oleh pustaka WordCloud.
 */
function renderReflectiveWordCloud() {
  // Ambil log kata dari LocalStorage
  const storedLogs = JSON.parse(localStorage.getItem("mindai_emotion_logs")) || [];
  const placeholder = document.getElementById("wordcloud-placeholder");
  const canvasElement = document.getElementById("wordcloud-canvas");

  if (storedLogs.length === 0) {
    if (placeholder) {
      placeholder.classList.remove("hidden");
    }
    if (canvasElement) {
      canvasElement.classList.add("hidden");
    }
    console.log("Log riwayat kata emosi kosong. Menampilkan placeholder wordcloud.");
    return;
  }

  if (placeholder) {
    placeholder.classList.add("hidden");
  }
  if (canvasElement) {
    canvasElement.classList.remove("hidden");
  }

  const emotionCounts = storedLogs.reduce((counts, entry) => {
    const emotions = Array.isArray(entry?.emotions) ? entry.emotions : [];
    emotions.forEach((emotion) => {
      const normalizedEmotion = String(emotion).trim();
      if (!normalizedEmotion) {
        return;
      }
      counts[normalizedEmotion] = (counts[normalizedEmotion] || 0) + 1;
    });
    return counts;
  }, {});

  const mockWordFreqList =
    Object.keys(emotionCounts).length > 0
      ? Object.entries(emotionCounts).map(([emotion, count]) => [emotion, Math.max(12, count * 8)])
      : [
          ["Cemas", 24],
          ["Lelah", 18],
          ["Gelisah", 15],
          ["Kewalahan", 30],
          ["Tenang", 12],
        ];

  // Konfigurasi Pustaka WordCloud2.js Engine Call
  if (typeof WordCloud !== "function" || !canvasElement) {
    if (placeholder) {
      placeholder.classList.remove("hidden");
    }
    if (canvasElement) {
      canvasElement.classList.add("hidden");
    }
    return;
  }

  WordCloud(canvasElement, {
    list: mockWordFreqList,
    gridSize: 12,
    weightFactor: 2,
    fontFamily: "Inter, system-ui, sans-serif",
    color: function () {
      // Skema warna sejuk (Sage Green & Soft Pastel Blue)
      const colors = ["#9CAF88", "#8FA479", "#A3B8CC", "#B0C4DE"];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    backgroundColor: "#FDFBF7",
    rotateRatio: 0.3,
  });
}
