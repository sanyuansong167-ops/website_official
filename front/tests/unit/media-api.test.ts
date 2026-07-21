// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { getImageAssets, uploadImageAsset } from "@/services/media-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("media api", () => {
  it("adapts the documented media page and resolves relative public urls", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(createResponse({
      code: 0,
      data: {
        list: [{
          absoluteUrl: null,
          altText: "数据中心",
          contentType: "image/webp",
          createdAt: "2026-07-15T10:00:00",
          fileSize: 2048,
          id: 8,
          mediaType: "IMAGE",
          originalFilename: "hero.webp",
          publicUrl: "/media/public/hero.webp",
          status: "ACTIVE",
          updatedAt: "2026-07-15T10:00:00",
          usageTag: "BANNER",
          version: 1,
        }],
        pageNo: 1,
        pageSize: 24,
        total: 1,
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const page = await getImageAssets();

    expect(page.list[0]).toEqual(expect.objectContaining({
      displayUrl: "https://api.example.com/media/public/hero.webp",
      id: 8,
      mediaType: "IMAGE",
    }));
    expect(String(fetchMock.mock.calls[0][0])).toContain("mediaType=IMAGE");
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ credentials: "include", method: "GET" }));
  });

  it("skips legacy media records whose non-positive IDs cannot be saved in a page schema", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(createResponse({
      code: 0,
      data: {
        list: [
          createMediaAsset(12),
          createMediaAsset(-9101),
        ],
        pageNo: 1,
        pageSize: 24,
        total: 2,
      },
    })));

    const page = await getImageAssets();

    expect(page.list.map((asset) => asset.id)).toEqual([12]);
  });

  it("uploads multipart image data with the server-provided csrf header", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(createResponse({
      code: 0,
      data: {
        absoluteUrl: null,
        contentType: "image/png",
        mediaId: 9,
        mediaType: "IMAGE",
        originalFilename: "upload.png",
        path: "2026/07/upload.png",
        size: 1024,
        url: "/media/public/upload.png",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadImageAsset(
      new File(["image"], "upload.png", { type: "image/png" }),
      { headerName: "X-CSRF-Token", parameterName: "_csrf", token: "csrf-value" },
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(result).toEqual(expect.objectContaining({ id: 9, status: "TEMPORARY" }));
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).toEqual({ Accept: "application/json", "X-CSRF-Token": "csrf-value" });
  });
});

function createResponse(value: unknown) {
  return {
    json: async () => value,
    ok: true,
    status: 200,
  };
}

function createMediaAsset(id: number) {
  return {
    absoluteUrl: null,
    contentType: "image/png",
    createdAt: "2026-07-15T10:00:00",
    fileSize: 1024,
    id,
    mediaType: "IMAGE",
    originalFilename: `asset-${id}.png`,
    publicUrl: `/media/public/asset-${id}.png`,
    status: "ACTIVE",
    updatedAt: "2026-07-15T10:00:00",
    version: 1,
  };
}
