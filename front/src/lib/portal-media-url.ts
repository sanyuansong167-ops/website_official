import { getPortalApiBaseUrl } from "@/lib/environment";
import { getNavigationTarget } from "@/lib/navigation-target";

export function getSafePortalMediaUrl(value: string | undefined) {
  if (!value) return undefined;

  try {
    const portalApiUrl = getConfiguredPortalApiUrl();
    const mediaUrl = portalApiUrl ? new URL(value, portalApiUrl) : new URL(value);

    if (
      (mediaUrl.protocol !== "http:" && mediaUrl.protocol !== "https:") ||
      mediaUrl.username ||
      mediaUrl.password
    ) {
      return undefined;
    }

    if (portalApiUrl && mediaUrl.origin === portalApiUrl.origin) {
      return mediaUrl.toString();
    }

    const target = getNavigationTarget({
      externalUrl: mediaUrl.toString(),
      openInNewTab: false,
      targetType: "EXTERNAL_LINK",
    });
    return target?.kind === "external" ? target.href : undefined;
  } catch {
    return undefined;
  }
}

function getConfiguredPortalApiUrl() {
  try {
    return new URL(`${getPortalApiBaseUrl()}/`);
  } catch {
    return undefined;
  }
}
