const pendingQueries = [];

function getKapaApi() {
  return (
    window.KapaAIWidget ||
    window.KapaWidget ||
    window.KapaAI ||
    window.Kapa ||
    window.kapa ||
    null
  );
}

function findLauncherButton() {
  return (
    document.querySelector("[data-kapa-open]") ||
    document.querySelector("[data-testid='kapa-launcher']") ||
    document.querySelector("button[class*='kapa'][class*='launcher']") ||
    null
  );
}

function openKapaWithQuery(query) {
  if (!query) {
    return false;
  }

  const api = getKapaApi();
  if (api?.openWithQuery && typeof api.openWithQuery === "function") {
    api.openWithQuery(query);
    return true;
  }

  if (api?.open && typeof api.open === "function") {
    try {
      api.open({ query });
    } catch (error) {
      api.open(query);
    }
    return true;
  }

  if (api?.toggle && typeof api.toggle === "function") {
    api.toggle(true, query);
    return true;
  }

  const launcher = findLauncherButton();
  if (launcher instanceof HTMLElement) {
    launcher.click();
    if (query) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("kapa:set-query", { detail: { query } })
        );
      }, 250);
    }
    return true;
  }

  return false;
}

function flushPendingQueries() {
  if (!pendingQueries.length) {
    return;
  }

  const api = getKapaApi() || findLauncherButton();
  if (!api) {
    return;
  }

  while (pendingQueries.length) {
    const query = pendingQueries.shift();
    if (!openKapaWithQuery(query)) {
      pendingQueries.unshift(query);
      break;
    }
  }
}

window.addEventListener("mintlify:ask-ai", (event) => {
  const detail = event.detail ?? {};
  const query = typeof detail === "string" ? detail : detail.query;
  if (!query) {
    return;
  }

  if (!openKapaWithQuery(query)) {
    pendingQueries.push(query);
  }
});

const script = document.createElement("script");
script.src = "https://widget.kapa.ai/kapa-widget.bundle.js";
script.async = true;
script.setAttribute("data-website-id", "418990dd-0615-4ba7-b52f-3ab8c1af4e79");
script.setAttribute("data-project-name", "Statsig");
script.setAttribute("data-project-color", "#202020");
script.setAttribute(
  "data-project-logo",
  "https://statsig.com/images/sections/multi-products-v2/menu-statsig.svg"
);
script.addEventListener("load", () => {
  flushPendingQueries();
});
document.head.appendChild(script);

const readinessObserver = new MutationObserver(() => {
  flushPendingQueries();
  if (getKapaApi()) {
    readinessObserver.disconnect();
  }
});

readinessObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

window.addEventListener("load", () => {
  flushPendingQueries();
});
