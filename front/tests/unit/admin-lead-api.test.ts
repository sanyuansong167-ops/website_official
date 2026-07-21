// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exportAdminLeads,
  getAdminLeadDetail,
  getAdminLeadPage,
  updateAdminLeadStatus,
} from "@/services/admin-lead-api";

const csrf = { headerName: "X-CSRF-Token", parameterName: "_csrf", token: "csrf-value" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("admin lead api", () => {
  it("loads a filtered, masked lead page with authenticated Admin access", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({
      code: 0,
      data: { list: [createLeadListItem()], pageNo: 2, pageSize: 20, total: 25 },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAdminLeadPage({
      pageNo: 2,
      pageSize: 20,
      status: 1,
      submitAtStart: "2026-07-01T00:00",
    });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.example.com/admin/api/leads?pageNo=2&pageSize=20&status=1&submitAtStart=2026-07-01T00%3A00");
    expect(init).toEqual(expect.objectContaining({ credentials: "include", method: "GET" }));
    expect(result.list[0]).toMatchObject({ maskedEmail: "a***@example.com", status: 1 });
  });

  it("loads audited full detail and updates its versioned status with csrf", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createJsonResponse({ code: 0, data: createLeadDetail() }))
      .mockResolvedValueOnce(createJsonResponse({ code: 0, message: "操作成功" }));
    vi.stubGlobal("fetch", fetchMock);

    const detail = await getAdminLeadDetail(8);
    await updateAdminLeadStatus(detail.id, 2, detail.version, csrf);

    expect(detail.email).toBe("acceptance@example.com");
    const [url, init] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.example.com/admin/api/leads/8/status");
    expect(init.headers).toEqual(expect.objectContaining({ "Content-Type": "application/json", "X-CSRF-Token": "csrf-value" }));
    expect(JSON.parse(String(init.body))).toEqual({ status: 2, version: 3 });
  });

  it("downloads only explicitly selected records with csrf", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Blob(["xlsx"]), {
      headers: {
        "Content-Disposition": "attachment; filename*=UTF-8''leads_20260721.xlsx",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const file = await exportAdminLeads({ exportMode: "SELECTED", selectedIds: [8] }, csrf);

    expect(file.filename).toBe("leads_20260721.xlsx");
    expect(file.blob.size).toBeGreaterThan(0);
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ exportMode: "SELECTED", selectedIds: [8] });
    expect(init.headers).toEqual(expect.objectContaining({ "X-CSRF-Token": "csrf-value" }));
  });
});

function createLeadListItem() {
  return {
    company: "武汉云台数据",
    demandDescriptionPreview: "联系表单隔离验收记录",
    id: 8,
    maskedEmail: "a***@example.com",
    maskedPhone: "123****8901",
    name: "阶段三验收",
    status: 1,
    statusLabel: "处理中",
    submittedAt: "2026-07-21T10:00:00",
    updatedAt: "2026-07-21T10:00:00",
  };
}

function createLeadDetail() {
  return {
    company: "武汉云台数据",
    demandDescription: "联系表单隔离验收记录",
    email: "acceptance@example.com",
    id: 8,
    name: "阶段三验收",
    phone: "12345678901",
    status: 1,
    statusLabel: "处理中",
    submitIp: "127.0.0.1",
    submittedAt: "2026-07-21T10:00:00",
    updatedAt: "2026-07-21T10:00:00",
    version: 3,
  };
}

function createJsonResponse(value: unknown) {
  return { json: async () => value, ok: true, status: 200 };
}
