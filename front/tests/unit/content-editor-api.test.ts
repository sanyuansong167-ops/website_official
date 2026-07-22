// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acquireContentLock,
  createContentPreview,
  forceReleaseContentLock,
  getContentDraft,
  getContentVersions,
  offlineContent,
  publishContent,
  rollbackContent,
  saveContentDraft,
} from "@/services/content-editor-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("content editor Admin API", () => {
  it("reads a typed product draft from its protected detail endpoint", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: { draftJson: { summary: "产品摘要", title: "数据治理平台" }, draftHash: "draft-hash", id: 7, updatedAt: "2026-07-16T00:00:00Z", version: 3 },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const draft = await getContentDraft("product", 7);

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://admin.example.com/admin/api/products/7/draft");
    expect(draft).toEqual(expect.objectContaining({ draft: { summary: "产品摘要", title: "数据治理平台" }, draftHash: "draft-hash", id: 7, version: 3 }));
  });

  it("uses CSRF, lock token and version when saving a case draft", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: { draft: { title: "案例" }, id: 21, updatedAt: "2026-07-16T00:00:00Z", version: 4 },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    await saveContentDraft({
      csrf: { headerName: "X-CSRF-Token", parameterName: "csrf", token: "csrf-token" },
      draft: { title: "案例" },
      kind: "case",
      lockToken: "lock-token",
      resourceId: 21,
      version: 3,
    });

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://admin.example.com/admin/api/cases/21/draft");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ draft: { title: "案例" }, version: 3 }),
      headers: expect.objectContaining({ "X-CSRF-Token": "csrf-token", "X-Editor-Lock-Token": "lock-token" }),
      method: "PUT",
    }));
  });

  it("requires an industry-solution lock response to identify the matching resource type", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: {
          acquiredAt: "2026-07-16T00:00:00Z",
          editable: true,
          expiresAt: "2026-07-16T00:10:00Z",
          forceUnlockAllowed: false,
          heartbeatIntervalSeconds: 30,
          lockToken: "lock-token",
          ownerDisplayName: "管理员 A",
          resourceId: 11,
          resourceType: "INDUSTRY_SOLUTION",
        },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const lock = await acquireContentLock(
      "solution",
      11,
      { headerName: "X-CSRF-Token", parameterName: "csrf", token: "csrf-token" },
    );

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://admin.example.com/admin/api/industry-solutions/11/lock");
    expect(lock.resourceType).toBe("INDUSTRY_SOLUTION");
  });

  it("force releases a product lock using CSRF and a mandatory audit reason", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ code: 0, data: { auditId: 93, releasedAt: "2026-07-16T00:00:00Z" } }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await forceReleaseContentLock(
      "product",
      7,
      { headerName: "X-CSRF-Token", parameterName: "csrf", token: "csrf-token" },
      "管理员确认占用会话已失效",
    );

    expect(result.auditId).toBe(93);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://admin.example.com/admin/api/products/7/lock/force-release");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ reason: "管理员确认占用会话已失效" }),
      headers: expect.objectContaining({ "X-CSRF-Token": "csrf-token" }),
      method: "POST",
    }));
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("X-Editor-Lock-Token");
  });

  it("creates a controlled preview from the saved draft hash", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ code: 0, data: "0190c000-0000-4000-8000-000000000001" }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const token = await createContentPreview({
      csrf: { headerName: "X-CSRF-Token", parameterName: "csrf", token: "csrf-token" },
      draftHash: "draft-hash",
      kind: "solution",
      lockToken: "lock-token",
      resourceId: 9,
    });

    expect(token).toContain("0190c000");
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://admin.example.com/admin/api/industry-solutions/9/draft/previews");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ draftHash: "draft-hash" }),
      headers: expect.objectContaining({ "X-Editor-Lock-Token": "lock-token" }),
    }));
  });

  it("publishes, reads and rolls back typed case versions", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin.example.com");
    const version = {
      caseId: 21,
      changeSummary: "正式发布",
      id: 88,
      publishedAt: "2026-07-21T10:00:00",
      publisher: "admin",
      snapshotHash: "snapshot-hash",
      versionNo: 5,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ json: async () => ({ code: 0, data: version }), ok: true, status: 200 })
      .mockResolvedValueOnce({ json: async () => ({ code: 0, data: [version] }), ok: true, status: 200 })
      .mockResolvedValueOnce({ json: async () => ({ code: 0, data: { ...version, id: 89, rollbackSourceVersionId: 88, versionNo: 6 } }), ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const lifecycle = {
      csrf: { headerName: "X-CSRF-Token", parameterName: "csrf", token: "csrf-token" },
      kind: "case" as const,
      lockToken: "lock-token",
      resourceId: 21,
      version: 4,
    };

    expect((await publishContent({ ...lifecycle, changeSummary: "正式发布" })).versionNo).toBe(5);
    expect(await getContentVersions("case", 21)).toEqual([expect.objectContaining({ resourceId: 21, versionNo: 5 })]);
    expect((await rollbackContent({ ...lifecycle, changeSummary: "恢复", targetVersionId: 88 })).rollbackSourceVersionId).toBe(88);
    expect(String(fetchMock.mock.calls[2][0])).toBe("https://admin.example.com/admin/api/cases/21/rollback/88");
  });

  it("offlines content with the current draft version and an audit reason", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin.example.com");
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ code: 0, data: null }), ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await offlineContent({
      csrf: { headerName: "X-CSRF-Token", parameterName: "csrf", token: "csrf-token" },
      kind: "product",
      lockToken: "lock-token",
      reason: "产品停止公开展示",
      resourceId: 7,
      version: 3,
    });

    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ reason: "产品停止公开展示", version: 3 }),
      method: "POST",
    }));
  });
});
