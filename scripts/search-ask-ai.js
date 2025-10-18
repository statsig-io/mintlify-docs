(() => {
  const ASK_AI_CLASS = "mintlify-ask-ai-option";
  const STYLE_ID = "mintlify-ask-ai-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${ASK_AI_CLASS} {
        width: 100%;
        border: none;
        background: transparent;
        padding: 0;
        text-align: left;
        cursor: pointer;
        font: inherit;
      }
      .${ASK_AI_CLASS}:focus {
        outline: none;
      }
      .${ASK_AI_CLASS} .DocSearch-Hit-Container {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        transition: background 0.15s ease;
      }
      .${ASK_AI_CLASS}:hover .DocSearch-Hit-Container,
      .${ASK_AI_CLASS}:focus-visible .DocSearch-Hit-Container {
        background: rgba(32, 32, 32, 0.08);
      }
      .${ASK_AI_CLASS} .DocSearch-Hit-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.75rem;
        background: linear-gradient(135deg, #202020, #4b4b4b);
        color: white;
        flex-shrink: 0;
      }
      .${ASK_AI_CLASS} .DocSearch-Hit-title {
        font-weight: 600;
      }
      .${ASK_AI_CLASS} .DocSearch-Hit-path {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: rgba(32, 32, 32, 0.6);
      }
      [data-theme='dark'] .${ASK_AI_CLASS} .DocSearch-Hit-Container {
        background: transparent;
      }
      [data-theme='dark'] .${ASK_AI_CLASS} .DocSearch-Hit-path {
        color: rgba(249, 250, 250, 0.6);
      }
      [data-theme='dark'] .${ASK_AI_CLASS}:hover .DocSearch-Hit-Container,
      [data-theme='dark'] .${ASK_AI_CLASS}:focus-visible .DocSearch-Hit-Container {
        background: rgba(249, 250, 250, 0.08);
      }
    `;
    document.head.appendChild(style);
  }

  function dispatchAskAI(query, source = "search") {
    window.dispatchEvent(
      new CustomEvent("mintlify:ask-ai", {
        detail: { query, source },
      })
    );
  }

  function closeSearch(modal) {
    const cancelButton = modal?.querySelector(".DocSearch-Cancel");
    if (cancelButton instanceof HTMLElement) {
      cancelButton.click();
      return;
    }

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  function createAskAIOption(modal) {
    const existing = modal.querySelector(`.${ASK_AI_CLASS}`);
    if (existing) {
      return existing;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = `${ASK_AI_CLASS} DocSearch-Hit`;
    button.dataset.mintlifyAskAiOption = "true";
    button.setAttribute("role", "option");
    button.style.display = "none";

    button.innerHTML = `
      <div class="DocSearch-Hit-Container">
        <div class="DocSearch-Hit-icon">AI</div>
        <div class="DocSearch-Hit-content">
          <div class="DocSearch-Hit-title"></div>
          <span class="DocSearch-Hit-path"></span>
        </div>
      </div>
    `;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const query = button.dataset.query;
      dispatchAskAI(query, "search-suggestion");
      closeSearch(modal);
    });

    const dropdown = modal.querySelector(".DocSearch-Dropdown") || modal;
    dropdown.appendChild(button);
    return button;
  }

  function updateAskAI(input) {
    const modal = input.closest(".DocSearch-Modal");
    if (!modal) {
      return;
    }

    const query = input.value.trim();
    const option = createAskAIOption(modal);
    const titleEl = option.querySelector(".DocSearch-Hit-title");
    const subtitleEl = option.querySelector(".DocSearch-Hit-path");

    if (query.length > 3) {
      option.dataset.query = query;
      option.style.display = "";
      if (titleEl) {
        titleEl.textContent = `Ask AI about “${query}”`;
      }
      if (subtitleEl) {
        subtitleEl.textContent = "Let Kapa answer instantly.";
      }
    } else {
      option.dataset.query = "";
      option.style.display = "none";
    }
  }

  function bindInput(input) {
    if (input.dataset.askAiBound === "true") {
      return;
    }
    input.dataset.askAiBound = "true";

    input.addEventListener("input", () => updateAskAI(input));
    input.addEventListener("focus", () => updateAskAI(input));
    updateAskAI(input);
  }

  injectStyle();

  function isNativeAskAiButton(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (element.dataset.mintlifyAskAiOption === "true") {
      return false;
    }
    const aria = element.getAttribute("aria-label")?.toLowerCase();
    if (aria && aria.includes("ask ai")) {
      return true;
    }
    const text = element.textContent?.trim().toLowerCase();
    if (!text) {
      return false;
    }
    return text === "ask ai" || text.startsWith("ask ai ");
  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll("input.DocSearch-Input").forEach(bindInput);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("input.DocSearch-Input").forEach(bindInput);
  });

  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest("button, a")
          : null;
      if (!target || !isNativeAskAiButton(target)) {
        return;
      }

      const modal = target.closest(".DocSearch-Modal");
      const input = modal?.querySelector("input.DocSearch-Input");
      const query = input?.value?.trim() ?? "";

      event.preventDefault();
      event.stopPropagation();

      dispatchAskAI(query.length > 0 ? query : undefined, "search-native");
      closeSearch(modal);
    },
    true
  );
})();
