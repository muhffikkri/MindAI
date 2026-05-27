/**
 * @file wordcloud.js
 * @description Wordcloud Canvas Rendering Engine using WordCloud.js Library.
 * @author Anggota 2 (UI/UX Frontend) & Anggota 5 (Data Logic)
 */

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("wordcloud-canvas")) {
    renderReflectiveWordCloud({ canvasId: "wordcloud-canvas", placeholderId: "wordcloud-placeholder" });
  }
  if (document.getElementById("dash-wordcloud-canvas")) {
    renderReflectiveWordCloud({ canvasId: "dash-wordcloud-canvas", placeholderId: "dash-wordcloud-placeholder" });
  }
});

function extractEmotionLabels(entry) {
  const raw = Array.isArray(entry) ? entry : Array.isArray(entry?.emotions) ? entry.emotions : [];
  return raw.map((e) => {
    if (typeof e === "object" && e !== null) return String(e.label || "").trim();
    return String(e).trim();
  }).filter(Boolean);
}

function renderReflectiveWordCloud(options = {}) {
  const { canvasId = "wordcloud-canvas", placeholderId = "wordcloud-placeholder" } = options;
  const storedLogs = JSON.parse(localStorage.getItem("mindai_emotion_logs")) || [];
  const placeholder = document.getElementById(placeholderId);
  const canvasElement = document.getElementById(canvasId);

  if (storedLogs.length === 0) {
    if (placeholder) placeholder.classList.remove("hidden");
    if (canvasElement) canvasElement.classList.add("hidden");
    return;
  }

  if (placeholder) placeholder.classList.add("hidden");
  if (canvasElement) canvasElement.classList.remove("hidden");

  const emotionCounts = storedLogs.reduce((counts, entry) => {
    const labels = extractEmotionLabels(entry);
    labels.forEach((label) => {
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  }, {});

  const wordFreqList = Object.keys(emotionCounts).length > 0
    ? Object.entries(emotionCounts).map(([emotion, count]) => [emotion, Math.max(12, count * 8)])
    : [
        ["Cemas", 24],
        ["Lelah", 18],
        ["Gelisah", 15],
        ["Kewalahan", 30],
        ["Tenang", 12],
      ];

  if (typeof WordCloud !== "function" || !canvasElement) {
    if (placeholder) placeholder.classList.remove("hidden");
    if (canvasElement) canvasElement.classList.add("hidden");
    return;
  }

  WordCloud(canvasElement, {
    list: wordFreqList,
    gridSize: 12,
    weightFactor: 2,
    fontFamily: "Inter, system-ui, sans-serif",
    color: function () {
      const colors = ["#9CAF88", "#8FA479", "#A3B8CC", "#B0C4DE"];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    backgroundColor: "#FDFBF7",
    rotateRatio: 0.3,
  });
}
