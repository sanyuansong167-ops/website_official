import { afterEach, describe, expect, it, vi } from "vitest";
import { getSafePortalMediaUrl } from "@/lib/portal-media-url";

describe("getSafePortalMediaUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows media served by the configured local Portal API", () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "http://localhost:8080");

    expect(getSafePortalMediaUrl("/media/public/example.png")).toBe(
      "http://localhost:8080/media/public/example.png",
    );
    expect(getSafePortalMediaUrl("http://localhost:8080/media/public/example.png")).toBe(
      "http://localhost:8080/media/public/example.png",
    );
  });

  it("allows safe public media but rejects untrusted private and unsafe URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "http://localhost:8080");

    expect(getSafePortalMediaUrl("https://cdn.example.com/example.png")).toBe(
      "https://cdn.example.com/example.png",
    );
    expect(getSafePortalMediaUrl("http://127.0.0.1/private.png")).toBeUndefined();
    expect(getSafePortalMediaUrl("javascript:alert(1)")).toBeUndefined();
  });
});
