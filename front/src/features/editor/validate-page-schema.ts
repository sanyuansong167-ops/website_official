import { getBlockDefinition } from "@/components/page-builder/block-registry";
import { getAdminApiBaseUrl } from "@/lib/environment";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { BlockConfigField } from "@/lib/home-page-template";
import type { NavigationTargetInput } from "@/lib/navigation-target";
import type { JsonObject, JsonValue, PageSchema } from "@/types/page-builder";

export type SchemaValidationField = string;

export type SchemaValidationIssue = {
  blockId?: string;
  field?: SchemaValidationField;
  message: string;
};

export function validatePageSchema(schema: PageSchema): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const blockIds = new Set<string>();
  const componentCounts = new Map<string, number>();

  for (const section of schema.sections) {
    if (!section.id.trim()) {
      issues.push({ message: "区块 ID 不能为空。" });
    } else if (blockIds.has(section.id)) {
      issues.push({ blockId: section.id, message: `区块 ID ${section.id} 重复。` });
    }
    blockIds.add(section.id);

    if (!Number.isInteger(section.sortOrder) || section.sortOrder < 0) {
      issues.push({ blockId: section.id, message: "区块排序值必须是非负整数。" });
    }

    const definition = getBlockDefinition(section.component);
    if (!definition) {
      issues.push({ blockId: section.id, message: `区块 ${section.component} 未在前端受控注册表中登记。` });
    } else {
      componentCounts.set(section.component, (componentCounts.get(section.component) ?? 0) + 1);

      if (!definition.allowedSlots.includes(section.slot)) {
        issues.push({
          blockId: section.id,
          message: `区块 ${section.component} 不允许放在 ${section.slot} 插槽。`,
        });
      }

      validateConfiguredFields(section.id, section, definition.configFields ?? [], issues);
      validateExternalContentBinding(section, issues);
    }

    if (section.component === "HeroSection") {
      validateHeroSection(section.id, section.props, issues);
    }

    if (section.component === "RichTextSection") {
      issues.push({
        blockId: section.id,
        field: "content",
        message: "RichTextSection 尚未配置批准的字段 Schema 与白名单净化器，当前不能保存。",
      });
    }
  }

  for (const [component, count] of componentCounts) {
    const definition = getBlockDefinition(component);
    if (definition && !definition.isRepeatable && count > 1) {
      issues.push({ message: `区块 ${component} 不允许重复添加。` });
    }
  }

  return issues;
}

function validateHeroSection(blockId: string, props: JsonObject, issues: SchemaValidationIssue[]) {
  validateHeroMedia(blockId, props.backgroundImageMediaId, props.backgroundImageUrl, issues);
  validateHeroButton(blockId, "primaryButton", props.primaryButton, issues);
  validateHeroButton(blockId, "secondaryButton", props.secondaryButton, issues);
}

function validateConfiguredFields(
  blockId: string,
  section: { dataBinding?: JsonObject; props: JsonObject; style: JsonObject },
  fields: readonly BlockConfigField[],
  issues: SchemaValidationIssue[],
) {
  for (const field of fields) {
    if (field.control === "link") continue;

    const value = getConfiguredValue(section, field.path);
    const fieldName = field.path.split(".").at(-1) ?? field.path;

    if (field.control === "content-picker") {
      validateContentSelection(blockId, section, fieldName, value, issues);
      continue;
    }

    if (field.control === "media") {
      validateConfiguredMedia(blockId, section, field, value, issues);
      continue;
    }

    if (field.required && isEmptyConfiguredValue(value)) {
      issues.push({ blockId, field: fieldName, message: `${field.label}不能为空。` });
      continue;
    }

    if (value === undefined || value === null || value === "") continue;

    if (field.control === "text" || field.control === "textarea") {
      if (typeof value !== "string") {
        issues.push({ blockId, field: fieldName, message: `${field.label}必须是文本。` });
      } else if (field.maxLength !== undefined && value.length > field.maxLength) {
        issues.push({ blockId, field: fieldName, message: `${field.label}不能超过 ${field.maxLength} 个字符。` });
      }
    }

    if (field.control === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        issues.push({ blockId, field: fieldName, message: `${field.label}必须是有效数字。` });
      } else if (field.min !== undefined && value < field.min) {
        issues.push({ blockId, field: fieldName, message: `${field.label}不能小于 ${field.min}。` });
      } else if (field.max !== undefined && value > field.max) {
        issues.push({ blockId, field: fieldName, message: `${field.label}不能大于 ${field.max}。` });
      }
    }

    if (
      field.control === "select" &&
      field.options?.length &&
      !field.options.some((option) => option.value === value)
    ) {
      issues.push({ blockId, field: fieldName, message: `${field.label}使用了未批准的选项。` });
    }
  }
}

function validateContentSelection(
  blockId: string,
  section: { dataBinding?: JsonObject; props: JsonObject; style: JsonObject },
  fieldName: string,
  value: JsonValue | undefined,
  issues: SchemaValidationIssue[],
) {
  if (!Array.isArray(value)) {
    issues.push({ blockId, field: fieldName, message: "手动选择内容必须使用 ID 数组。" });
    return;
  }

  const ids = value.filter((item): item is number => typeof item === "number");
  if (ids.length !== value.length || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    issues.push({ blockId, field: fieldName, message: "手动选择内容只能包含正整数 ID。" });
    return;
  }

  if (new Set(ids).size !== ids.length) {
    issues.push({ blockId, field: fieldName, message: "手动选择内容不能包含重复 ID。" });
  }

  const displayMode = getConfiguredValue(section, "dataBinding.displayMode");
  if (displayMode !== "MANUAL") return;

  const limit = getConfiguredValue(section, "dataBinding.limit");
  if (typeof limit === "number" && ids.length > limit) {
    issues.push({ blockId, field: fieldName, message: `手动选择内容不能超过展示数量 ${limit}。` });
  }
}

function validateExternalContentBinding(
  section: { component: string; dataBinding?: JsonObject; id: string; props: JsonObject; style: JsonObject },
  issues: SchemaValidationIssue[],
) {
  const expectedSource = getExpectedContentSource(section.component);
  if (!expectedSource) return;

  const binding = section.dataBinding;
  if (!binding) {
    issues.push({ blockId: section.id, field: "source", message: "内容绑定配置不能为空。" });
    return;
  }

  if (binding.source !== expectedSource) {
    issues.push({
      blockId: section.id,
      field: "source",
      message: `${section.component} 只能使用 ${expectedSource} 数据源。`,
    });
  }

  if (!isJsonObject(binding.filters) || binding.filters.publishedOnly !== true) {
    issues.push({
      blockId: section.id,
      field: "filters",
      message: "自动内容绑定必须固定为仅选择可公开展示内容。",
    });
    return;
  }

  const tag = binding.filters.tag;
  if (tag !== undefined && (typeof tag !== "string" || tag.length > 64)) {
    issues.push({
      blockId: section.id,
      field: "filters",
      message: "自动内容绑定的标签筛选必须是最长 64 个字符的文本。",
    });
  }
}

function getExpectedContentSource(component: string) {
  if (component === "ProductGridSection") return "PRODUCT";
  if (component === "CaseGridSection") return "CASE";
  if (component === "SolutionGridSection") return "INDUSTRY_SOLUTION";
  return null;
}

function validateConfiguredMedia(
  blockId: string,
  section: { dataBinding?: JsonObject; props: JsonObject; style: JsonObject },
  field: BlockConfigField,
  value: JsonValue | undefined,
  issues: SchemaValidationIssue[],
) {
  if (value === undefined || value === null) return;
  const fieldName = field.path.split(".").at(-1) ?? field.path;

  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    issues.push({ blockId, field: fieldName, message: `${field.label} ID 必须是正整数。` });
    return;
  }

  if (field.mediaUrlPath) {
    const mediaUrl = getConfiguredValue(section, field.mediaUrlPath);
    if (mediaUrl !== undefined && mediaUrl !== null && mediaUrl !== "" &&
      (typeof mediaUrl !== "string" || !isSafeMediaUrl(mediaUrl))) {
      const urlField = field.mediaUrlPath.split(".").at(-1) ?? field.mediaUrlPath;
      issues.push({ blockId, field: urlField, message: `${field.label}地址必须是安全的 HTTP 或 HTTPS 地址。` });
    }
  }

  if (field.mediaAltRequired && field.mediaAltPath) {
    const altText = getConfiguredValue(section, field.mediaAltPath);
    if (typeof altText !== "string" || !altText.trim()) {
      const altField = field.mediaAltPath.split(".").at(-1) ?? field.mediaAltPath;
      issues.push({ blockId, field: altField, message: `${field.label}必须填写有意义的替代文本。` });
    }
  }
}

function getConfiguredValue(
  section: { dataBinding?: JsonObject; props: JsonObject; style: JsonObject },
  path: BlockConfigField["path"],
) {
  const [root, ...segments] = path.split(".");
  let current: JsonValue | undefined;

  if (root === "dataBinding") current = section.dataBinding;
  if (root === "props") current = section.props;
  if (root === "style") current = section.style;

  for (const segment of segments) {
    if (!isJsonObject(current)) return undefined;
    current = current[segment];
  }

  return current;
}

function isEmptyConfiguredValue(value: JsonValue | undefined) {
  return value === undefined || value === null || (typeof value === "string" && !value.trim());
}

function validateHeroMedia(
  blockId: string,
  mediaId: JsonValue | undefined,
  mediaUrl: JsonValue | undefined,
  issues: SchemaValidationIssue[],
) {
  if (
    mediaId !== undefined &&
    mediaId !== null &&
    (typeof mediaId !== "number" || !Number.isSafeInteger(mediaId) || mediaId <= 0)
  ) {
    issues.push({ blockId, field: "backgroundImageMediaId", message: "背景媒体 ID 必须是正整数。" });
  }

  if (mediaUrl === undefined || mediaUrl === null || mediaUrl === "") return;
  if (typeof mediaUrl !== "string" || !isSafeMediaUrl(mediaUrl)) {
    issues.push({
      blockId,
      field: "backgroundImageUrl",
      message: "背景媒体 URL 必须是安全的 HTTP 或 HTTPS 地址。",
    });
  }
}

function validateHeroButton(
  blockId: string,
  field: "primaryButton" | "secondaryButton",
  value: JsonValue | undefined,
  issues: SchemaValidationIssue[],
) {
  if (value === undefined || value === null) return;
  if (!isJsonObject(value) || typeof value.enabled !== "boolean") {
    issues.push({ blockId, field, message: `${getButtonLabel(field)}配置格式无效。` });
    return;
  }

  if (!value.enabled) return;

  if (typeof value.text !== "string" || !value.text.trim() || value.text.length > 32) {
    issues.push({ blockId, field, message: `${getButtonLabel(field)}文案必填且不能超过 32 个字符。` });
  }

  if (!isNavigationTargetInput(value) || !getNavigationTarget(value)) {
    issues.push({ blockId, field, message: `${getButtonLabel(field)}跳转目标无效或使用了不安全地址。` });
    return;
  }

  if (value.targetType !== "EXTERNAL_LINK" && value.openInNewTab) {
    issues.push({ blockId, field, message: `${getButtonLabel(field)}只有外部链接可以在新窗口打开。` });
  }
}

function isSafeMediaUrl(value: string) {
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return false;

    if (getNavigationTarget({
      externalUrl: value,
      openInNewTab: false,
      targetType: "EXTERNAL_LINK",
    }) !== null) {
      return true;
    }

    // Development and intranet deployments commonly serve managed media from
    // the Admin API itself (for example http://localhost:8080). That trusted
    // origin is not a user-controlled navigation target.
    return url.origin === new URL(getAdminApiBaseUrl()).origin;
  } catch {
    return false;
  }
}

function isNavigationTargetInput(value: JsonObject): value is JsonObject & NavigationTargetInput {
  return (
    typeof value.targetType === "string" &&
    (value.targetType === "EXTERNAL_LINK" ||
      value.targetType === "INTERNAL_ROUTE" ||
      value.targetType === "PAGE_ANCHOR") &&
    typeof value.openInNewTab === "boolean" &&
    (value.routePath === undefined || typeof value.routePath === "string") &&
    (value.anchorCode === undefined || typeof value.anchorCode === "string") &&
    (value.externalUrl === undefined || typeof value.externalUrl === "string")
  );
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getButtonLabel(field: "primaryButton" | "secondaryButton") {
  return field === "primaryButton" ? "主按钮" : "次按钮";
}
