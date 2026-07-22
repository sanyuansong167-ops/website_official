import { afterEach, describe, expect, it, vi } from "vitest";
import { reportWebVital } from "@/services/portal-observability-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("portal observability api", () => {
  it("sends only the bounded Web Vital payload through sendBeacon when available", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { sendBeacon });

    reportWebVital({ metric: "LCP", rating: "good", route: "home", value: 1_234 });

    expect(sendBeacon).toHaveBeenCalledWith(
      "https://portal.example.com/portal/api/observability/web-vitals",
      expect.any(Blob),
    );
    await expect((sendBeacon.mock.calls[0][1] as Blob).text()).resolves.toBe(
      '{"metric":"LCP","route":"home","value":1234}',
    );
  });

  it("falls back to an anonymous keepalive request without surfacing transport failures", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    vi.stubGlobal("navigator", { sendBeacon: vi.fn().mockReturnValue(false) });
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    reportWebVital({ metric: "CLS", rating: "good", route: "contact", value: 0.01 });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://portal.example.com/portal/api/observability/web-vitals"),
      expect.objectContaining({ credentials: "omit", keepalive: true, method: "POST" }),
    );
    await Promise.resolve();
  });
});
