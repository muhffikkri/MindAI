const results = [];
const resultList = document.getElementById("test-results");
const summary = document.getElementById("test-summary");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function renderResults() {
  if (!resultList || !summary) {
    return;
  }

  resultList.innerHTML = "";
  let passed = 0;

  results.forEach((result) => {
    const item = document.createElement("li");
    item.className = `test-item ${result.status}`;
    item.innerHTML = `
      <span class="status ${result.status}">${result.status.toUpperCase()}</span>
      <div>
        <strong>${result.name}</strong>
        <div>${result.message}</div>
      </div>
    `;
    resultList.appendChild(item);

    if (result.status === "pass") {
      passed += 1;
    }
  });

  summary.className = `summary ${passed === results.length ? "pass" : "fail"}`;
  summary.textContent = `${passed}/${results.length} tests passed.`;
}

async function runTest(name, fn) {
  try {
    await fn();
    results.push({ status: "pass", name, message: "OK" });
  } catch (error) {
    results.push({ status: "fail", name, message: error.message || String(error) });
  }
}

async function runSuite() {
  await runTest("Unit: assistant prompt includes somatic guidance", () => {
    const prompt = window.MindAIChatEngine.buildAssistantPrompt("Tubuh terasa tegang");
    assert(prompt.includes("Tubuh terasa tegang"), "Prompt should contain the user message.");
    assert(prompt.includes("terapi somatik"), "Prompt should mention somatic therapy guidance.");
  });

  await runTest("Unit: user message counting only counts user roles", () => {
    const history = [
      { role: "user", parts: [{ text: "a" }] },
      { role: "model", parts: [{ text: "b" }] },
      { role: "user", parts: [{ text: "c" }] },
    ];
    assert(window.MindAIChatEngine.countUserMessages(history) === 2, "Expected exactly two user messages.");
  });

  await runTest("Unit: Gemini key helpers trim whitespace", () => {
    window.MindAIKeyManager.setStoredGeminiApiKey("  demo-key  ");
    assert(window.MindAIKeyManager.getStoredGeminiApiKey() === "demo-key", "Stored key should be trimmed.");
  });

  await runTest("Unit: Gemini payload strips timestamp fields", async () => {
    window.MindAIKeyManager.setStoredGeminiApiKey("demo-key");
    const originalFetch = window.fetch;
    let capturedPayload = null;

    window.fetch = async (_, init) => {
      capturedPayload = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "siap" }] } }],
        }),
      };
    };

    const response = await window.MindAIChatEngine.fetchGeminiResponse([{ role: "user", parts: [{ text: "Halo" }], timestamp: "2026-05-30T10:00:00.000Z" }]);

    window.fetch = originalFetch;

    assert(response === "siap", "Expected mocked Gemini response to be returned.");
    assert(Array.isArray(capturedPayload.contents), "Payload contents should be an array.");
    assert(!Object.prototype.hasOwnProperty.call(capturedPayload.contents[0], "timestamp"), "Timestamp should not be sent to Gemini.");
  });

  await runTest("Integration: mobile structure keeps notifications in off-canvas sidebar", () => {
    assert(document.querySelector(".sidebar-mobile-actions"), "Sidebar mobile actions should exist.");
    assert(document.querySelector("#hamburger"), "Hamburger button should exist inside the app header.");
    assert(document.querySelector(".header-actions"), "Desktop header actions should still exist.");
  });

  await runTest("Integration: clear data button removes chat, labels, and analytics", () => {
    localStorage.setItem("mindai_chat_history", JSON.stringify([{ role: "user", parts: [{ text: "hello" }] }]));
    localStorage.setItem("mindai_emotion_logs", JSON.stringify([{ timestamp: new Date().toISOString(), emotions: ["Cemas"] }]));
    localStorage.setItem("mindai_emotion_extraction_meta", JSON.stringify({ lastExtractedUserCount: 5 }));

    const chatMessages = document.getElementById("chat-messages");
    chatMessages.innerHTML = "<div>should be removed</div>";

    const originalRenderDashboard = window.MindAIRenderDashboard;
    let dashboardRendered = false;
    window.MindAIRenderDashboard = () => {
      dashboardRendered = true;
      originalRenderDashboard?.();
    };

    document.getElementById("btn-clear-data").click();

    window.MindAIRenderDashboard = originalRenderDashboard;

    assert(localStorage.getItem("mindai_chat_history") === null, "Chat history should be removed.");
    assert(localStorage.getItem("mindai_emotion_logs") === null, "Emotion logs should be removed.");
    assert(localStorage.getItem("mindai_emotion_extraction_meta") === null, "Extraction metadata should be removed.");
    assert(chatMessages.children.length === 0, "Chat UI should be cleared.");
    assert(dashboardRendered, "Dashboard renderer should be invoked after clearing data.");
  });

  await runTest("Integration: wordcloud canvas fills its container", () => {
    const originalWordCloud = window.WordCloud;
    let receivedCanvas = null;
    let receivedOptions = null;

    window.WordCloud = (canvas, options) => {
      receivedCanvas = canvas;
      receivedOptions = options;
    };

    localStorage.setItem(
      "mindai_emotion_logs",
      JSON.stringify([
        { timestamp: new Date().toISOString(), emotions: ["Cemas", "Lelah"] },
        { timestamp: new Date().toISOString(), emotions: ["Cemas"] },
      ]),
    );

    const canvas = document.getElementById("dash-wordcloud-canvas");
    const container = canvas.parentElement;
    container.style.width = "520px";
    container.style.height = "320px";
    window.MindAIRenderDashboard();

    window.WordCloud = originalWordCloud;

    assert(receivedCanvas === canvas, "WordCloud should render into the dashboard canvas.");
    assert(canvas.width > 0 && canvas.height > 0, "Canvas should be sized before rendering.");
    assert(typeof receivedOptions.weightFactor === "function", "WordCloud options should define a weight factor.");
    assert(receivedOptions.weightFactor(10) >= 14, "Wordcloud font sizing should be slightly larger.");
  });

  renderResults();
}

window.addEventListener("load", () => {
  window.requestAnimationFrame(() => {
    runSuite();
  });
});
