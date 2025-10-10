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
    // console.log("Loading Statsig scripts...");
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
    const client = new StatsigClient(
      STATSIG_CLIENT_KEY,
      {
        userID: "anonymous",
      },
      options
    );

    // console.log("Initializing Statsig client...");
    await client.initializeAsync();
  } catch (error) {
    console.error("Failed to initialize Statsig:", error);
  }
})();
