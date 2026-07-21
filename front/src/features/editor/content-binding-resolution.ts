import { getBindableContentSnapshot } from "@/services/content-binding-api";
import type {
  BindableContentItem,
  BindableContentSnapshot,
  ContentBindingDependencyIssue,
  ContentBindingMode,
  ContentBindingRequest,
  ContentBindingResolution,
  ContentBindingSort,
  ContentBindingSource,
} from "@/types/content-binding";
import type { ControlledSection, JsonObject, JsonValue, PageSchema } from "@/types/page-builder";

const supportedSources: Readonly<Record<string, ContentBindingSource>> = {
  CaseGridSection: "CASE",
  ProductGridSection: "PRODUCT",
  SolutionGridSection: "INDUSTRY_SOLUTION",
};

export async function validatePageContentDependencies(
  schema: PageSchema,
): Promise<ContentBindingDependencyIssue[]> {
  const requests = getPageContentBindingRequests(schema);
  const sources = [...new Set(requests.map((request) => request.source))];
  const snapshots = new Map<ContentBindingSource, BindableContentSnapshot>();
  const failedSources = new Set<ContentBindingSource>();

  await Promise.all(sources.map(async (source) => {
    try {
      snapshots.set(source, await getBindableContentSnapshot(source));
    } catch {
      failedSources.add(source);
    }
  }));

  return requests.flatMap((request) => {
    if (failedSources.has(request.source)) {
      return [{
        blockId: request.blockId,
        field: "filters" as const,
        message: `无法读取${getSourceLabel(request.source)}依赖，已阻止保存或发布。`,
      }];
    }

    const snapshot = snapshots.get(request.source);
    return snapshot ? resolveContentBinding(request, snapshot).issues : [];
  });
}

export function getPageContentBindingRequests(schema: PageSchema): ContentBindingRequest[] {
  return schema.sections
    .map(getContentBindingRequest)
    .filter((request): request is ContentBindingRequest => request !== null);
}

export function getContentBindingRequest(section: ControlledSection): ContentBindingRequest | null {
  const expectedSource = supportedSources[section.component];
  const binding = section.dataBinding;
  if (!expectedSource || !binding) return null;

  const source = getSource(binding.source);
  const displayMode = getDisplayMode(binding.displayMode);
  const sortBy = getSort(binding.sortBy);
  const limit = getPositiveInteger(binding.limit);
  const selectedIds = getPositiveIntegerList(binding.selectedIds);
  const filters = isJsonObject(binding.filters) ? binding.filters : null;

  if (
    source !== expectedSource ||
    !displayMode ||
    !sortBy ||
    !limit ||
    !selectedIds ||
    !filters ||
    filters.publishedOnly !== true
  ) {
    return null;
  }

  const tagValue = filters.tag;
  if (tagValue !== undefined && typeof tagValue !== "string") return null;

  return {
    blockId: section.id,
    displayMode,
    limit,
    selectedIds,
    sortBy,
    source,
    tag: tagValue?.trim() || undefined,
  };
}

export function resolveContentBinding(
  request: ContentBindingRequest,
  snapshot: BindableContentSnapshot,
): ContentBindingResolution {
  const issues: ContentBindingDependencyIssue[] = [];

  if (!snapshot.complete) {
    issues.push({
      blockId: request.blockId,
      field: "filters",
      message: "内容数量超过前端完整校验范围，已阻止保存或发布，请由后端提供受控绑定查询接口。",
    });
  }

  if (request.displayMode === "MANUAL") {
    const itemsById = new Map(snapshot.items.map((item) => [item.id, item]));
    const items = request.selectedIds.flatMap((id) => {
      const item = itemsById.get(id);
      if (!item) {
        if (snapshot.complete) {
          issues.push({
            blockId: request.blockId,
            field: "selectedIds",
            message: `${getSourceLabel(request.source)} ID ${id} 不存在或已删除。`,
          });
        }
        return [];
      }

      if (!item.visible) {
        issues.push({
          blockId: request.blockId,
          field: "selectedIds",
          message: `${getSourceLabel(request.source)}“${item.title}”已隐藏或不满足公开展示条件。`,
        });
      }
      return [item];
    });

    return { issues, items };
  }

  const normalizedTag = request.tag?.trim().toLocaleLowerCase("zh-CN");
  const candidates = snapshot.items.filter((item) =>
    item.visible && (!normalizedTag || item.tags.some((tag) => tag.trim().toLocaleLowerCase("zh-CN") === normalizedTag)),
  );

  if (request.sortBy === "UPDATED_AT_DESC" && candidates.some((item) => getTimestamp(item.updatedAt) === null)) {
    issues.push({
      blockId: request.blockId,
      field: "sortBy",
      message: `${getSourceLabel(request.source)}列表没有为全部候选内容提供有效更新时间，不能可靠使用“最近更新优先”。`,
    });
  }

  return {
    issues,
    items: sortItems(candidates, request.sortBy).slice(0, request.limit),
  };
}

function sortItems(items: BindableContentItem[], sortBy: ContentBindingSort) {
  return [...items].sort((left, right) => {
    if (sortBy === "UPDATED_AT_DESC") {
      const timestampDifference = (getTimestamp(right.updatedAt) ?? 0) - (getTimestamp(left.updatedAt) ?? 0);
      if (timestampDifference !== 0) return timestampDifference;
    }

    return left.sortOrder - right.sortOrder || left.id - right.id;
  });
}

function getTimestamp(value?: string) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getSource(value: JsonValue | undefined): ContentBindingSource | null {
  if (value === "CASE" || value === "INDUSTRY_SOLUTION" || value === "PRODUCT") return value;
  return null;
}

function getDisplayMode(value: JsonValue | undefined): ContentBindingMode | null {
  return value === "AUTO" || value === "MANUAL" ? value : null;
}

function getSort(value: JsonValue | undefined): ContentBindingSort | null {
  return value === "SORT_ORDER_ASC" || value === "UPDATED_AT_DESC" ? value : null;
}

function getPositiveInteger(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function getPositiveIntegerList(value: JsonValue | undefined) {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === "number" && Number.isSafeInteger(item) && item > 0)
    ? value.filter((item): item is number => typeof item === "number")
    : null;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSourceLabel(source: ContentBindingSource) {
  if (source === "CASE") return "案例";
  if (source === "INDUSTRY_SOLUTION") return "行业方案";
  return "产品";
}
