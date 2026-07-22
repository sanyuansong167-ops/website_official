export const WEB_VITAL_NAMES = ["LCP", "CLS", "INP"] as const;

export type WebVitalName = (typeof WEB_VITAL_NAMES)[number];

export type PortalRouteMetric =
  | "home"
  | "contact"
  | "product_detail"
  | "case_detail"
  | "solution_detail"
  | "ai_strategy"
  | "enterprise_strength"
  | "core_capability"
  | "about"
  | "other_portal";

export type WebVitalRating = "good" | "needs_improvement" | "poor";

export type WebVitalMeasurement = {
  metric: WebVitalName;
  rating: WebVitalRating;
  route: PortalRouteMetric;
  value: number;
};

type LayoutShiftEntry = PerformanceEntry & {
  hadRecentInput?: boolean;
  value?: number;
};

type EventTimingEntry = PerformanceEntry & {
  duration: number;
  interactionId?: number;
};

/**
 * Collapses public paths into a fixed metric label set, so analytics never receives IDs, slugs, queries, or hashes.
 */
export function getPortalRouteMetric(pathname: string): PortalRouteMetric {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/") return "home";
  if (normalizedPath === "/contact") return "contact";
  if (normalizedPath.startsWith("/products/")) return "product_detail";
  if (normalizedPath.startsWith("/cases/")) return "case_detail";
  if (normalizedPath.startsWith("/solutions/")) return "solution_detail";
  if (normalizedPath === "/ai-strategy") return "ai_strategy";
  if (normalizedPath === "/enterprise-strength") return "enterprise_strength";
  if (normalizedPath === "/core-capability") return "core_capability";
  if (normalizedPath === "/about") return "about";

  return "other_portal";
}

export function getWebVitalRating(metric: WebVitalName, value: number): WebVitalRating {
  if (metric === "CLS") return value <= 0.1 ? "good" : value <= 0.25 ? "needs_improvement" : "poor";
  if (metric === "LCP") return value <= 2_500 ? "good" : value <= 4_000 ? "needs_improvement" : "poor";
  return value <= 200 ? "good" : value <= 500 ? "needs_improvement" : "poor";
}

/**
 * Uses native PerformanceObserver so the Portal does not add a client dependency for three small measurements.
 */
export function observeWebVitals(
  report: (measurement: WebVitalMeasurement) => void,
  pathname: string,
): () => void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return () => undefined;

  const route = getPortalRouteMetric(pathname);
  const observers: PerformanceObserver[] = [];
  const sentMetrics = new Set<WebVitalName>();
  let largestContentfulPaint = 0;
  let cumulativeLayoutShift = 0;
  let interactionToNextPaint = 0;
  let finalized = false;

  const send = (metric: WebVitalName, value: number) => {
    if (sentMetrics.has(metric) || !Number.isFinite(value) || value < 0) return;
    sentMetrics.add(metric);
    const normalizedValue = Math.round(value * 1_000) / 1_000;

    try {
      report({
        metric,
        rating: getWebVitalRating(metric, normalizedValue),
        route,
        value: normalizedValue,
      });
    } catch {
      // Browser telemetry must never change the public page interaction flow.
    }
  };

  const finalize = () => {
    if (finalized) return;
    finalized = true;
    if (largestContentfulPaint > 0) send("LCP", largestContentfulPaint);
    send("CLS", cumulativeLayoutShift);
    if (interactionToNextPaint > 0) send("INP", interactionToNextPaint);
  };

  observe("largest-contentful-paint", (entries) => {
    const entry = entries.at(-1);
    if (entry) largestContentfulPaint = entry.startTime;
  });
  observe("layout-shift", (entries) => {
    for (const entry of entries as LayoutShiftEntry[]) {
      if (!entry.hadRecentInput && typeof entry.value === "number") cumulativeLayoutShift += entry.value;
    }
  });
  observe("event", (entries) => {
    for (const entry of entries as EventTimingEntry[]) {
      if (entry.interactionId && entry.interactionId > 0) {
        interactionToNextPaint = Math.max(interactionToNextPaint, entry.duration);
      }
    }
  }, { durationThreshold: 40 });

  const onPageHide = () => finalize();
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") finalize();
  };

  window.addEventListener("pagehide", onPageHide, { once: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    finalize();
    for (const observer of observers) observer.disconnect();
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };

  function observe(
    type: string,
    callback: (entries: PerformanceEntry[]) => void,
    options: Record<string, number> = {},
  ) {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe({ buffered: true, type, ...options } as PerformanceObserverInit);
      observers.push(observer);
    } catch {
      // Older browsers may not implement all performance entry types.
    }
  }
}
