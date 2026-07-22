import { describe, expect, it } from "vitest";
import { getPortalRouteMetric, getWebVitalRating } from "@/lib/web-vitals";

describe("web vitals", () => {
  it("uses bounded route categories instead of dynamic public paths", () => {
    expect(getPortalRouteMetric("/")).toBe("home");
    expect(getPortalRouteMetric("/products/18372")).toBe("product_detail");
    expect(getPortalRouteMetric("/cases/24?campaign=summer")).toBe("case_detail");
    expect(getPortalRouteMetric("/e2e-page")).toBe("other_portal");
  });

  it("rates LCP, CLS, and INP against the published performance thresholds", () => {
    expect(getWebVitalRating("LCP", 2_500)).toBe("good");
    expect(getWebVitalRating("CLS", 0.25)).toBe("needs_improvement");
    expect(getWebVitalRating("INP", 501)).toBe("poor");
  });
});
