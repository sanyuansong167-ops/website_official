import { describe, expect, it } from "vitest";
import { getPortalRouteFromSegments, isPortalRoute } from "@/lib/site-routes";

describe("portal route registry", () => {
  it("maps registered first-level route segments to Portal routes", () => {
    expect(getPortalRouteFromSegments(["strength"])).toBe("/strength");
    expect(getPortalRouteFromSegments(["ai-strategy"])).toBe("/ai-strategy");
    expect(getPortalRouteFromSegments(["products"])).toBe("/products");
  });

  it("accepts safe published paths for the page-builder catch-all", () => {
    expect(getPortalRouteFromSegments(["unknown"])).toBe("/unknown");
    expect(getPortalRouteFromSegments(["legal", "privacy"])).toBe("/legal/privacy");
  });

  it("rejects unsafe and empty catch-all paths", () => {
    expect(getPortalRouteFromSegments(["..", "admin"])).toBeNull();
    expect(getPortalRouteFromSegments(["legal\\privacy"])).toBeNull();
    expect(getPortalRouteFromSegments([])).toBeNull();
  });

  it("keeps the Portal and editor route allowlists on the same controlled route set", () => {
    expect(isPortalRoute("/about")).toBe(true);
    expect(isPortalRoute("/admin/editor")).toBe(false);
  });
});
