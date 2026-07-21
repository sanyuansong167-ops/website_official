import type { NavigationMenuViewModel } from "@/types/portal";

export type NavigationTargetInput = Pick<
  NavigationMenuViewModel,
  "anchorCode" | "externalUrl" | "openInNewTab" | "routePath" | "targetType"
>;

export type NavigationTarget =
  | { href: string; kind: "anchor" | "internal" }
  | { href: string; kind: "external"; openInNewTab: boolean };

export function getNavigationTarget(menu: NavigationTargetInput): NavigationTarget | null {
  if (menu.targetType === "INTERNAL_ROUTE" && isSafeInternalRoute(menu.routePath)) {
    return { href: menu.routePath, kind: "internal" };
  }

  if (menu.targetType === "PAGE_ANCHOR" && isSafeAnchor(menu.anchorCode)) {
    return { href: `#${menu.anchorCode}`, kind: "anchor" };
  }

  if (menu.targetType === "EXTERNAL_LINK" && isSafeExternalUrl(menu.externalUrl)) {
    return { href: menu.externalUrl, kind: "external", openInNewTab: menu.openInNewTab };
  }

  return null;
}

function isSafeInternalRoute(value: string | undefined): value is string {
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("\\") &&
      !/[\u0000-\u001f]/.test(value),
  );
}

function isSafeAnchor(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value));
}

function isSafeExternalUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      !isPrivateHostname(url.hostname)
    );
  } catch {
    return false;
  }
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;
  if (
    normalized === "::1" ||
    (normalized.includes(":") && (/^f[cd]/.test(normalized) || normalized.startsWith("fe80:")))
  ) {
    return true;
  }

  const octets = normalized.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}
