(function () {
  const interactiveSelector = "a[href], button, input, select, textarea, summary, [role='button'], [role='link'], [role='tab'], [contenteditable='true']";
  const skipSelector = "script, style, svg, path, title, meta, link, noscript, [aria-hidden='true'], [data-a11y-skip='true']";

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getReadableLabel(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("svg, path, script, style, [aria-hidden='true'], .nav-icon, .logo-mark").forEach((node) => {
      node.remove();
    });
    return normalizeText(clone.textContent);
  }

  function isVisible(element) {
    if (!element || element.hidden) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function shouldPromoteTextNode(element) {
    if (!(element instanceof Element)) return false;
    if (element.matches(skipSelector)) return false;
    if (element.closest(skipSelector)) return false;
    if (element.closest(interactiveSelector)) return false;
    if (element.children.length > 0) return false;

    const label = getReadableLabel(element);
    return /[\p{L}\p{N}]/u.test(label);
  }

  function applyLabel(element) {
    if (element.hasAttribute("aria-label") || element.hasAttribute("aria-labelledby")) {
      return;
    }

    const label = getReadableLabel(element);
    if (label) {
      element.setAttribute("aria-label", label);
    }
  }

  function enhanceScope(root = document) {
    const scope = root instanceof Document ? root.body || root.documentElement : root;
    if (!scope) return;

    const elements = scope.querySelectorAll("*");
    elements.forEach((element) => {
      if (!isVisible(element)) return;

      if (element.matches(interactiveSelector)) {
        applyLabel(element);
        return;
      }

      if (!shouldPromoteTextNode(element)) return;

      element.setAttribute("tabindex", "0");
      element.classList.add("a11y-focusable");
      applyLabel(element);
    });
  }

  window.MindAIEnhanceAccessibility = enhanceScope;
})();
