import { StatsigClient, StatsigOptions, StatsigUser } from "@statsig/js-client";
import { useEffect, useState } from "react";

import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";

function getStatsig() {
  const client = window.Statsig.StatsigClient.instance(
    process.env.MINTLIFY_STATSIG_SDK_KEY,
    {
      environment:
        process.env.NODE_ENV === "development" ? "development" : "production",
    }
  );
  client.initializeAsync().catch((e) => console.error(e));
  return client;
}

export function useExperiment(name) {
  const statsig = getStatsig();
  const [exp, setExp] = useState(
    statsig.loadingState === "Ready" ? statsig.getExperiment(name) : null
  );
  useEffect(() => {
    function handler() {
      setExp(statsig.getExperiment(name));
    }

    statsig.on("values_updated", handler);
    return () => {
      statsig.off("values_updated", handler);
    };
  }, [name, statsig]);
  return exp;
}

export function useDynamicConfig(name) {
  const statsig = getStatsig();
  const [config, setConfig] = useState(
    statsig.loadingState === "Ready" ? statsig.getDynamicConfig(name) : null
  );
  useEffect(() => {
    function handler() {
      setConfig(statsig.getDynamicConfig(name));
    }

    statsig.on("values_updated", handler);
    return () => {
      statsig.off("values_updated", handler);
    };
  }, [name, statsig]);
  return config;
}
