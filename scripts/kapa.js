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

function openKapa(query) {
  const sanitizedQuery =
    typeof query === "string" ? query.trim() : "";
  const hasQuery = sanitizedQuery.length > 0;
  const api = getKapaApi();
  if (api?.openWithQuery && typeof api.openWithQuery === "function" && hasQuery) {
    api.openWithQuery(sanitizedQuery);
    return true;
  }

  if (api?.open && typeof api.open === "function") {
    try {
      if (hasQuery) {
        api.open({ query: sanitizedQuery });
      } else {
        api.open();
      }
    } catch (error) {
      if (hasQuery) {
        api.open(sanitizedQuery);
      } else {
        api.open();
      }
    }
    return true;
  }

  if (api?.toggle && typeof api.toggle === "function") {
    api.toggle(true, hasQuery ? sanitizedQuery : undefined);
    return true;
  }

  const launcher = findLauncherButton();
  if (launcher instanceof HTMLElement) {
    launcher.click();
    if (hasQuery) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("kapa:set-query", { detail: { query: sanitizedQuery } })
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
    const request = pendingQueries.shift();
    if (!openKapa(request)) {
      pendingQueries.unshift(request);
      break;
    }
  }
}

window.addEventListener("mintlify:ask-ai", (event) => {
  const detail = event.detail ?? {};
  const query = typeof detail === "string" ? detail : detail.query;
  if (!openKapa(query)) {
    pendingQueries.push(query ?? null);
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
