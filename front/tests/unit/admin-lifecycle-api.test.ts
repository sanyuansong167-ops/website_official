// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPageDraft,
  getPageVersions,
  getComponentTemplate,
  heartbeatPageLock,
  publishPage,
  releasePageLock,
  rollbackPage,
  savePageDraft,
} from "@/services/admin-api";

const csrf = {
  headerName: "X-CSRF-Token",
  parameterName: "_csrf",
  token: "csrf-value",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("admin page lifecycle api", () => {
  it("publishes with csrf, lock token, draft version and change summary", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(createResponse({
      code: 0,
      data: createVersion({ versionNo: 4 }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishPage(7, csrf, "lock-value", 12, "更新首页内容");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.example.com/admin/api/page-builder/pages/7/publish");
    expect(init).toEqual(expect.objectContaining({ credentials: "include", method: "POST" }));
    expect(init.headers).toEqual(expect.objectContaining({
      "Content-Type": "application/json",
      "X-CSRF-Token": "csrf-value",
      "X-Editor-Lock-Token": "lock-value",
    }));
    expect(JSON.parse(String(init.body))).toEqual({ changeSummary: "更新首页内容", version: 12 });
    expect(result.versionNo).toBe(4);
  });

  it("adapts both paged and direct version lists", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createResponse({ code: 0, data: { list: [createVersion()] } }))
      .mockResolvedValueOnce(createResponse({ code: 0, data: [createVersion({ id: 22 })] }));
    vi.stubGlobal("fetch", fetchMock);

    const paged = await getPageVersions(7, 2, 50);
    const direct = await getPageVersions(7);

    expect(paged).toHaveLength(1);
    expect(direct[0].id).toBe(22);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.example.com/admin/api/page-builder/pages/7/versions?pageNo=2&pageSize=50",
    );
  });

  it("rolls back through the locked body contract", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(createResponse({
      code: 0,
      data: createVersion({ sourceType: "ROLLBACK", versionNo: 5 }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await rollbackPage(7, csrf, "lock-value", 18, 12, "恢复稳定版本");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.example.com/admin/api/page-builder/pages/7/rollback");
    expect(init.headers).toEqual(expect.objectContaining({
      "X-CSRF-Token": "csrf-value",
      "X-Editor-Lock-Token": "lock-value",
    }));
    expect(JSON.parse(String(init.body))).toEqual({
      changeSummary: "恢复稳定版本",
      version: 12,
      versionId: 18,
    });
  });

  it("keeps the editor lock token on heartbeat and release", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createResponse({ code: 0, data: createLock() }))
      .mockResolvedValueOnce(createResponse({ code: 0, data: null }));
    vi.stubGlobal("fetch", fetchMock);

    await heartbeatPageLock(7, csrf, "lock-value");
    await releasePageLock(7, csrf, "lock-value");

    expect(fetchMock.mock.calls[0][1].headers).toEqual(expect.objectContaining({
      "X-CSRF-Token": "csrf-value",
      "X-Editor-Lock-Token": "lock-value",
    }));
    expect(fetchMock.mock.calls[1][1].headers).toEqual(expect.objectContaining({
      "X-CSRF-Token": "csrf-value",
      "X-Editor-Lock-Token": "lock-value",
    }));
  });

  it("adapts legacy server component and binding codes for editor round trips", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createResponse({ code: 0, data: createLegacyDraft() }))
      .mockResolvedValueOnce(createResponse({ code: 0, data: createLegacyDraft({ version: 2 }) }));
    vi.stubGlobal("fetch", fetchMock);

    const draft = await getPageDraft(2);
    expect(draft.schemaJson?.sections).toMatchObject([
      { component: "HeroSection", props: { mainTitle: "Welcome", subTitle: "Hello" } },
      {
        component: "ProductGridSection",
        dataBinding: { displayMode: "MANUAL", selectedIds: [1], source: "PRODUCT" },
      },
    ]);

    await savePageDraft({
      csrf,
      editorSessionRemark: "round trip",
      lockToken: "lock-value",
      pageId: 2,
      schemaJson: draft.schemaJson!,
      version: draft.version,
    });

    const [, init] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(JSON.parse(String(init.body)).schemaJson.sections).toMatchObject([
      { component: "HeroBanner", props: { title: "Welcome", subtitle: "Hello" } },
      { binding: { mode: "ENTITY", query: { ids: [1] }, source: "product" }, component: "ProductGrid" },
    ]);
  });

  it("loads legacy component templates with the editor component code", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(createResponse({
      code: 0,
      data: createLegacyTemplate(),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const template = await getComponentTemplate("HeroSection");

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.example.com/admin/api/page-builder/component-templates/HeroBanner",
    );
    expect(template.componentCode).toBe("HeroSection");
  });
});

function createLock() {
  return {
    acquiredAt: "2026-07-17T09:30:00",
    editable: true,
    expiresAt: "2026-07-17T09:35:00",
    forceUnlockAllowed: false,
    heartbeatIntervalSeconds: 30,
    lockToken: "lock-value",
    ownerDisplayName: "admin",
    resourceId: 7,
    resourceType: "PAGE",
  };
}

function createVersion(overrides: Record<string, unknown> = {}) {
  return {
    changeSummary: "首次发布",
    createdAt: "2026-07-15T10:00:00",
    id: 18,
    pageId: 7,
    schemaHash: "schema-hash",
    sourceType: "PUBLISH",
    version: 3,
    versionNo: 3,
    ...overrides,
  };
}

function createLegacyDraft(overrides: Record<string, unknown> = {}) {
  return {
    editorSessionRemark: "legacy schema",
    id: 2,
    pageId: 2,
    schemaHash: "schema-hash",
    schemaJson: {
      layout: { type: "default" },
      name: "Home",
      pageKey: "home",
      sections: [
        {
          component: "HeroBanner",
          id: "hero",
          props: { primaryButtonLink: "/contact", primaryButtonText: "Contact", subtitle: "Hello", title: "Welcome" },
        },
        {
          binding: { mode: "ENTITY", query: { ids: [1] }, source: "product" },
          component: "ProductGrid",
          id: "products",
          props: { limit: 1, title: "Products" },
        },
      ],
      seo: { keywords: [] },
    },
    updatedAt: "2026-07-17T10:00:00",
    version: 1,
    ...overrides,
  };
}

function createLegacyTemplate(overrides: Record<string, unknown> = {}) {
  return {
    bindingCapabilityJson: { supportedModes: ["STATIC"] },
    category: "SHOW",
    componentCode: "HeroBanner",
    defaultPropsJson: { title: "Welcome" },
    id: 1,
    name: "Hero banner",
    schemaDefinitionJson: { fields: [] },
    sortOrder: 10,
    status: "ACTIVE",
    version: 1,
    ...overrides,
  };
}

function createResponse(value: unknown) {
  return {
    json: async () => value,
    ok: true,
    status: 200,
  };
}
