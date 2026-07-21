import { describe, expect, it } from "vitest";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { NavigationMenuViewModel } from "@/types/portal";

function createMenu(overrides: Partial<NavigationMenuViewModel>): NavigationMenuViewModel {
  return {
    children: [],
    id: 1,
    menuName: "测试导航",
    openInNewTab: false,
    targetType: "INTERNAL_ROUTE",
    ...overrides,
  };
}

describe("getNavigationTarget", () => {
  it("returns a safe internal route", () => {
    expect(getNavigationTarget(createMenu({ routePath: "/solutions" }))).toEqual({
      href: "/solutions",
      kind: "internal",
    });
  });

  it("rejects protocol-relative internal routes", () => {
    expect(getNavigationTarget(createMenu({ routePath: "//unsafe.example" }))).toBeNull();
  });

  it("returns an https external link with its target setting", () => {
    expect(
      getNavigationTarget(
        createMenu({ externalUrl: "https://example.com", openInNewTab: true, targetType: "EXTERNAL_LINK" }),
      ),
    ).toEqual({ href: "https://example.com", kind: "external", openInNewTab: true });
  });

  it("rejects unsafe external protocols and invalid anchors", () => {
    expect(
      getNavigationTarget(createMenu({ externalUrl: "javascript:alert(1)", targetType: "EXTERNAL_LINK" })),
    ).toBeNull();
    expect(getNavigationTarget(createMenu({ anchorCode: "bad anchor", targetType: "PAGE_ANCHOR" }))).toBeNull();
  });

  it("rejects local, private, credentialed, and backslash-based targets", () => {
    expect(
      getNavigationTarget(createMenu({ externalUrl: "http://127.0.0.1/admin", targetType: "EXTERNAL_LINK" })),
    ).toBeNull();
    expect(
      getNavigationTarget(createMenu({ externalUrl: "http://192.168.1.10", targetType: "EXTERNAL_LINK" })),
    ).toBeNull();
    expect(
      getNavigationTarget(createMenu({ externalUrl: "https://user:pass@example.com", targetType: "EXTERNAL_LINK" })),
    ).toBeNull();
    expect(getNavigationTarget(createMenu({ routePath: "/\\unsafe.example", targetType: "INTERNAL_ROUTE" }))).toBeNull();
  });
});
