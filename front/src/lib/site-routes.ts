export const siteRoutes = {
  home: "/",
  strength: "/strength",
  aiStrategy: "/ai-strategy",
  capabilities: "/capabilities",
  products: "/products",
  solutions: "/solutions",
  cases: "/cases",
  about: "/about",
  contact: "/contact",
  e2ePage: "/e2e-page",
} as const;

export type PortalRoute = (typeof siteRoutes)[keyof typeof siteRoutes];

const editorRoutes = new Set<PortalRoute>(Object.values(siteRoutes));

export function isPortalRoute(routePath: string): routePath is PortalRoute {
  return editorRoutes.has(routePath as PortalRoute);
}

export function getPortalRouteFromSegments(segments: readonly string[]): string | null {
  if (segments.length === 0 || segments.some((segment) => !isSafeRouteSegment(segment))) return null;

  const routePath = `/${segments.join("/")}`;
  return routePath.length <= 255 ? routePath : null;
}

export function isAllowedEditorRoute(routePath: string): routePath is PortalRoute {
  return isPortalRoute(routePath);
}

function isSafeRouteSegment(segment: string) {
  return Boolean(
    segment &&
      segment !== "." &&
      segment !== ".." &&
      segment.length <= 100 &&
      !segment.includes("/") &&
      !segment.includes("\\") &&
      !/[\u0000-\u001f\u007f]/.test(segment),
  );
}
