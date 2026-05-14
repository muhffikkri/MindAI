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

  if (storedLogs.length === 0) {
    console.log("Log riwayat kata emosi kosong. Melewati rendering grafik Wordcloud.");
    return;
  }

  // Transformasi data array menjadi pasangan matriks list format frekuensi: [['Kata', Ukuran], ['Kata', Ukuran]]
  // Contoh dummy transformasi:
  const mockWordFreqList = [
    ["Cemas", 24],
    ["Lelah", 18],
    ["Gelisah", 15],
    ["Kewalahan", 30],
    ["Tenang", 12],
  ];

  const canvasElement = document.getElementById("wordcloud-canvas");

  // Konfigurasi Pustaka WordCloud2.js Engine Call
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
