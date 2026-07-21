import { describe, expect, it, vi } from "vitest";
import { requestApi } from "@/services/http";

describe("http api envelope", () => {
  it("preserves a business error when its envelope omits a null data field", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ code: 10006, message: "该资源已被其他管理员锁定", traceId: "trace-1" }),
      { headers: { "Content-Type": "application/json" }, status: 409 },
    ));

    await expect(requestApi({
      baseUrl: "https://api.example.com",
      decode: (value) => value,
      path: "/admin/api/page-builder/pages/1/lock",
    })).rejects.toMatchObject({
      code: 10006,
      kind: "conflict",
      requestId: "trace-1",
    });

    fetchMock.mockRestore();
  });

  it("still rejects a successful response that omits data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ code: 0, message: "ok" }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    ));

    await expect(requestApi({
      baseUrl: "https://api.example.com",
      decode: (value) => value,
      path: "/portal/api/pages/by-route",
    })).rejects.toMatchObject({ kind: "unexpected-response" });

    fetchMock.mockRestore();
  });

  it("allows an explicitly declared no-content success response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ code: 0, message: "ok" }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    ));

    await expect(requestApi({
      allowMissingData: true,
      baseUrl: "https://api.example.com",
      decode: () => undefined,
      path: "/portal/api/leads",
    })).resolves.toBeUndefined();

    fetchMock.mockRestore();
  });
});
