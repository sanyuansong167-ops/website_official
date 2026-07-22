import { getPortalApiBaseUrl } from "@/lib/environment";
import type { WebVitalMeasurement } from "@/lib/web-vitals";

/**
 * Sends anonymous browser performance data on a best-effort basis; it intentionally has no response handling or user-facing errors.
 */
export function reportWebVital({ metric, route, value }: WebVitalMeasurement) {
  try {
    const url = new URL("/portal/api/observability/web-vitals", `${getPortalApiBaseUrl()}/`);
    const body = JSON.stringify({ metric, route, value });

    if (trySendBeacon(url.toString(), body)) return;

    void fetch(url, {
      body,
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => undefined);
  } catch {
    // API configuration and telemetry transport failures must not affect Portal rendering.
  }
}

function trySendBeacon(url: string, body: string) {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return false;

  try {
    return navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } catch {
    return false;
  }
}
