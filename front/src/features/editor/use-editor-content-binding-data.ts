"use client";

import { useEffect, useState } from "react";
import {
  getPageContentBindingRequests,
  resolveContentBinding,
} from "@/features/editor/content-binding-resolution";
import { getBindableContentSnapshot } from "@/services/content-binding-api";
import type {
  BindableContentItem,
  BindableContentSnapshot,
  ContentBindingRequest,
  ContentBindingSource,
} from "@/types/content-binding";
import type { JsonObject, PageSchema } from "@/types/page-builder";

type ResolvedDataState = {
  data: Record<string, JsonObject>;
  requestKey: string;
};

const editorBindingDebounceMilliseconds = 250;

export function useEditorContentBindingData(schema: PageSchema | null) {
  const requests = schema ? getPageContentBindingRequests(schema) : [];
  const requestKey = JSON.stringify(requests);
  const [resolvedState, setResolvedState] = useState<ResolvedDataState>({ data: {}, requestKey: "" });

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const currentRequests = decodeRequestKey(requestKey);
      void loadEditorBindingData(currentRequests).then((data) => {
        if (active) setResolvedState({ data, requestKey });
      });
    }, editorBindingDebounceMilliseconds);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [requestKey]);

  return resolvedState.requestKey === requestKey
    ? resolvedState.data
    : createLoadingData(requests);
}

function decodeRequestKey(value: string): ContentBindingRequest[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];
  return parsed.map(decodeRequest).filter((request): request is ContentBindingRequest => request !== null);
}

function decodeRequest(value: unknown): ContentBindingRequest | null {
  if (!isRecord(value)) return null;
  const source = value.source;
  const displayMode = value.displayMode;
  const sortBy = value.sortBy;
  const selectedIds = value.selectedIds;

  if (
    typeof value.blockId !== "string" ||
    (source !== "CASE" && source !== "INDUSTRY_SOLUTION" && source !== "PRODUCT") ||
    (displayMode !== "AUTO" && displayMode !== "MANUAL") ||
    (sortBy !== "SORT_ORDER_ASC" && sortBy !== "UPDATED_AT_DESC") ||
    typeof value.limit !== "number" ||
    !Number.isSafeInteger(value.limit) ||
    value.limit <= 0 ||
    !Array.isArray(selectedIds) ||
    !selectedIds.every((id) => typeof id === "number" && Number.isSafeInteger(id) && id > 0) ||
    (value.tag !== undefined && typeof value.tag !== "string")
  ) {
    return null;
  }

  return {
    blockId: value.blockId,
    displayMode,
    limit: value.limit,
    selectedIds: selectedIds.filter((id): id is number => typeof id === "number"),
    sortBy,
    source,
    tag: value.tag,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadEditorBindingData(requests: ContentBindingRequest[]) {
  const snapshots = new Map<ContentBindingSource, BindableContentSnapshot>();
  const failedSources = new Set<ContentBindingSource>();
  const sources = [...new Set(requests.map((request) => request.source))];

  await Promise.all(sources.map(async (source) => {
    try {
      snapshots.set(source, await getBindableContentSnapshot(source));
    } catch {
      failedSources.add(source);
    }
  }));

  const data: Record<string, JsonObject> = {};
  for (const request of requests) {
    if (failedSources.has(request.source)) {
      data[request.blockId] = {
        message: "暂时无法读取绑定内容，请稍后重试。",
        status: "error",
      };
      continue;
    }

    const snapshot = snapshots.get(request.source);
    if (!snapshot) continue;
    const resolution = resolveContentBinding(request, snapshot);
    data[request.blockId] = {
      issues: resolution.issues.map((issue) => issue.message),
      items: resolution.items.map(toRenderItem),
      status: "ready",
    };
  }
  return data;
}

function createLoadingData(requests: ContentBindingRequest[]) {
  const data: Record<string, JsonObject> = {};
  for (const request of requests) data[request.blockId] = { status: "loading" };
  return data;
}

function toRenderItem(item: BindableContentItem): JsonObject {
  const result: JsonObject = {
    id: item.id,
    sortOrder: item.sortOrder,
    summary: item.summary,
    tags: item.tags,
    title: item.title,
    visible: item.visible,
  };

  if (item.thumbnailUrl) result.thumbnailUrl = item.thumbnailUrl;
  if (item.updatedAt) result.updatedAt = item.updatedAt;
  return result;
}
