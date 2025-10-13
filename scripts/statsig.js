(async function initializeStatsig() {
  const STATSIG_CLIENT_KEY =
    "client-Wql5Tkj3Wa3sE8VpFjWpCHCPHxYZMbq6RfcRZZVHFdm";
  const STATSIG_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@statsig/js-client@3/build/statsig-js-client+session-replay+web-analytics.min.js?apikey=${STATSIG_CLIENT_KEY}`;

  // Load Statsig dependencies
  const loadScript = (url) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  try {
    await loadScript(STATSIG_SCRIPT_URL);

    const statsigNamespace = window.Statsig ?? window.StatsigSDK;
    if (!statsigNamespace) {
      throw new ReferenceError(
        "Statsig namespace not available on window.Statsig or window.StatsigSDK"
      );
    }

    const {
      StatsigClient,
      StatsigAutoCapturePlugin,
      StatsigSessionReplayPlugin,
    } = statsigNamespace;

    if (typeof StatsigClient !== "function") {
      throw new ReferenceError(
        "StatsigClient constructor not found in the Statsig namespace"
      );
    }

    const plugins = [];
    if (typeof StatsigAutoCapturePlugin === "function") {
      plugins.push(new StatsigAutoCapturePlugin());
    } else {
      console.warn(
        "StatsigAutoCapturePlugin not available, skipping autocapture"
      );
    }

    if (typeof StatsigSessionReplayPlugin === "function") {
      plugins.push(new StatsigSessionReplayPlugin());
    } else {
      console.warn(
        "StatsigSessionReplayPlugin not available, skipping session replay"
      );
    }

    const options = plugins.length > 0 ? { plugins } : undefined;

    // Check if the current environment includes development indicators
    const isDevelopmentMode =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const environment = isDevelopmentMode ? "development" : "production";
    const _client = new StatsigClient(
      STATSIG_CLIENT_KEY,
      {
        userId: "", // Anonymous user; replace with stable ID if available
        environment: environment,
      },
      options
    );

    await _client.initializeAsync();

    // Optionally update userId after initialization if stableID is available
    const stableID = _client.getContext?.()?.stableID;
    if (stableID) {
      await _client.updateUserAsync({ userID: stableID , custom: { "newDocs": true }});
    }
  } catch (error) {
    // noop
  }
})();
