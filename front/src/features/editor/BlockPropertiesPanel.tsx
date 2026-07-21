import Image from "next/image";
import { useState } from "react";
import type { BlockDefinition } from "@/components/page-builder/block-registry";
import { ContentBindingDialog } from "@/features/editor/ContentBindingDialog";
import { ContentBindingPreview } from "@/features/editor/ContentBindingPreview";
import { MediaPickerDialog } from "@/features/editor/MediaPickerDialog";
import type { SchemaValidationIssue } from "@/features/editor/validate-page-schema";
import { getBlockConfigValue } from "@/features/editor/block-config";
import type { BlockConfigField } from "@/lib/home-page-template";
import type { ControlledSection, JsonObject, JsonValue } from "@/types/page-builder";
import type { MediaAsset } from "@/types/media";
import type {
  ContentBindingMode,
  ContentBindingSort,
  ContentBindingSource,
} from "@/types/content-binding";
import styles from "./BlockPropertiesPanel.module.css";

type BlockPropertiesPanelProps = {
  definition: BlockDefinition;
  disabled: boolean;
  issues: SchemaValidationIssue[];
  onChange: (path: BlockConfigField["path"], value: JsonValue) => void;
  section: ControlledSection;
};

export function BlockPropertiesPanel({
  definition,
  disabled,
  issues,
  onChange,
  section,
}: Readonly<BlockPropertiesPanelProps>) {
  if (!definition.configFields?.length) {
    return <p>该区块尚未登记可编辑字段。</p>;
  }

  return (
    <div className={styles.fields}>
      {definition.configFields.map((field) => (
        <ConfigField
          disabled={disabled}
          error={getFieldError(issues, field.path)}
          field={field}
          key={`${section.id}-${field.path}`}
          onChange={(value) => onChange(field.path, value)}
          onRelatedChange={onChange}
          section={section}
          value={getBlockConfigValue(section, field.path)}
        />
      ))}
    </div>
  );
}

function ConfigField({
  disabled,
  error,
  field,
  onChange,
  onRelatedChange,
  section,
  value,
}: Readonly<{
  disabled: boolean;
  error?: string;
  field: BlockConfigField;
  onChange: (value: JsonValue) => void;
  onRelatedChange: (path: BlockConfigField["path"], value: JsonValue) => void;
  section: ControlledSection;
  value: JsonValue | undefined;
}>) {
  const id = `block-field-${field.path.replaceAll(".", "-")}`;
  const errorId = `${id}-error`;
  const descriptionId = field.helpText ? `${id}-description` : undefined;
  const describedBy = [descriptionId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  if (field.control === "link") {
    return (
      <LinkConfigField
        disabled={disabled}
        error={error}
        field={field}
        id={id}
        onChange={onChange}
        value={isJsonObject(value) ? value : { enabled: false }}
      />
    );
  }

  if (field.control === "media") {
    return (
      <MediaConfigField
        disabled={disabled}
        field={field}
        onChange={onChange}
        onRelatedChange={onRelatedChange}
        section={section}
        value={value}
      />
    );
  }

  if (field.control === "content-picker") {
    return (
      <ContentConfigField
        disabled={disabled}
        error={error}
        field={field}
        onChange={onChange}
        onRelatedChange={onRelatedChange}
        section={section}
        value={value}
      />
    );
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{field.label}{field.required ? " *" : ""}</label>
      {field.control === "textarea" ? (
        <textarea
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          id={id}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          rows={4}
          value={typeof value === "string" ? value : ""}
        />
      ) : null}
      {field.control === "text" ? (
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          id={id}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          type="text"
          value={typeof value === "string" ? value : ""}
        />
      ) : null}
      {field.control === "number" ? (
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          id={id}
          max={field.max}
          min={field.min}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
          required={field.required}
          type="number"
          value={typeof value === "number" ? value : ""}
        />
      ) : null}
      {field.control === "select" ? (
        <select
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          value={typeof value === "string" ? value : ""}
        >
          {field.options?.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
          ))}
        </select>
      ) : null}
      {field.helpText ? <small id={descriptionId}>{field.helpText}</small> : null}
      {typeof value === "string" && field.maxLength ? <small>{value.length}/{field.maxLength}</small> : null}
      {error ? <small className={styles.error} id={errorId} role="alert">{error}</small> : null}
    </div>
  );
}

function ContentConfigField({
  disabled,
  error,
  field,
  onChange,
  onRelatedChange,
  section,
  value,
}: Readonly<{
  disabled: boolean;
  error?: string;
  field: BlockConfigField;
  onChange: (value: JsonValue) => void;
  onRelatedChange: (path: BlockConfigField["path"], value: JsonValue) => void;
  section: ControlledSection;
  value: JsonValue | undefined;
}>) {
  const [open, setOpen] = useState(false);
  const selectedIds = Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number" && Number.isSafeInteger(item) && item > 0)
    : [];
  const sourceValue = getBlockConfigValue(section, "dataBinding.source");
  const source = getContentBindingSource(sourceValue);
  const displayMode = getContentBindingMode(getBlockConfigValue(section, "dataBinding.displayMode"));
  const sortBy = getContentBindingSort(getBlockConfigValue(section, "dataBinding.sortBy"));
  const limitValue = getBlockConfigValue(section, "dataBinding.limit");
  const limit = typeof limitValue === "number" && Number.isSafeInteger(limitValue)
    ? Math.min(Math.max(limitValue, 1), 12)
    : 6;
  const filtersValue = getBlockConfigValue(section, "dataBinding.filters");
  const filters = isJsonObject(filtersValue) ? filtersValue : { publishedOnly: true, tag: "" };
  const tag = typeof filters.tag === "string" ? filters.tag : "";
  const selectorDisabled = disabled || displayMode !== "MANUAL" || source === null;

  function confirmSelection(ids: number[]) {
    onChange(ids);
    setOpen(false);
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>
        {displayMode === "AUTO" ? "自动选择条件" : field.label}{field.required ? " *" : ""}
      </span>
      {displayMode === "AUTO" && source ? (
        <>
          <label htmlFor={`binding-tag-${section.id}`}>标签筛选</label>
          <input
            disabled={disabled}
            id={`binding-tag-${section.id}`}
            maxLength={64}
            onChange={(event) => onRelatedChange("dataBinding.filters", {
              ...filters,
              publishedOnly: true,
              tag: event.target.value,
            })}
            placeholder="留空表示不限制标签"
            type="text"
            value={tag}
          />
          <small>自动模式固定只选择可公开展示内容，并按展示数量与排序策略生成结果。</small>
        </>
      ) : null}
      {displayMode === "MANUAL" ? (
        <>
          <button disabled={selectorDisabled} onClick={() => setOpen(true)} type="button">
            {selectedIds.length > 0 ? "调整已选内容" : "选择内容"}
          </button>
          <small>手动模式仅保存内容 ID 和展示顺序，不复制详情数据。</small>
        </>
      ) : null}
      {source && displayMode && sortBy ? (
        <ContentBindingPreview
          blockId={section.id}
          displayMode={displayMode}
          key={`${displayMode}-${limit}-${sortBy}-${tag}-${selectedIds.join(",")}`}
          limit={limit}
          selectedIds={selectedIds}
          sortBy={sortBy}
          source={source}
          tag={tag.trim() || undefined}
        />
      ) : (
        <small>该数据源的自动选择与依赖预览尚未接入。</small>
      )}
      {error ? <small className={styles.error} role="alert">{error}</small> : null}
      {open && source ? (
        <ContentBindingDialog
          limit={limit}
          onClose={() => setOpen(false)}
          onConfirm={confirmSelection}
          selectedIds={selectedIds}
          source={source}
        />
      ) : null}
    </div>
  );
}

function MediaConfigField({
  disabled,
  field,
  onChange,
  onRelatedChange,
  section,
  value,
}: Readonly<{
  disabled: boolean;
  field: BlockConfigField;
  onChange: (value: JsonValue) => void;
  onRelatedChange: (path: BlockConfigField["path"], value: JsonValue) => void;
  section: ControlledSection;
  value: JsonValue | undefined;
}>) {
  const [open, setOpen] = useState(false);
  const mediaId = typeof value === "number" ? value : undefined;
  const mediaUrlValue = field.mediaUrlPath ? getBlockConfigValue(section, field.mediaUrlPath) : undefined;
  const mediaUrl = typeof mediaUrlValue === "string" ? mediaUrlValue : "";

  function selectAsset(asset: MediaAsset) {
    onChange(asset.id);
    if (field.mediaUrlPath) onRelatedChange(field.mediaUrlPath, asset.displayUrl);
    if (field.mediaAltPath && asset.altText) onRelatedChange(field.mediaAltPath, asset.altText);
    setOpen(false);
  }

  function clearAsset() {
    onChange(null);
    if (field.mediaUrlPath) onRelatedChange(field.mediaUrlPath, "");
    if (field.mediaAltPath) onRelatedChange(field.mediaAltPath, "");
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{field.label}{field.required ? " *" : ""}</span>
      {mediaUrl ? (
        <span className={styles.mediaPreview}>
          <Image alt="" fill sizes="280px" src={mediaUrl} unoptimized />
        </span>
      ) : null}
      <span className={styles.mediaActions}>
        <button disabled={disabled} onClick={() => setOpen(true)} type="button">
          {mediaId ? "替换图片" : "选择图片"}
        </button>
        {mediaId ? <button disabled={disabled} onClick={clearAsset} type="button">移除图片</button> : null}
      </span>
      {mediaId ? <small>当前媒体 ID：{mediaId}</small> : <small>当前未选择</small>}
      <MediaPickerDialog
        currentMediaId={mediaId}
        onClose={() => setOpen(false)}
        onSelect={selectAsset}
        open={open}
      />
    </div>
  );
}

function LinkConfigField({
  disabled,
  error,
  field,
  id,
  onChange,
  value,
}: Readonly<{
  disabled: boolean;
  error?: string;
  field: BlockConfigField;
  id: string;
  onChange: (value: JsonValue) => void;
  value: JsonObject;
}>) {
  const enabled = value.enabled === true;
  const targetType = getTargetType(value.targetType);
  const update = (key: string, nextValue: JsonValue) => onChange({ ...value, [key]: nextValue });

  return (
    <fieldset className={styles.linkField} disabled={disabled}>
      <legend>{field.label}{field.required ? " *" : ""}</legend>
      <label className={styles.checkbox}>
        <input checked={enabled} onChange={(event) => update("enabled", event.target.checked)} type="checkbox" />
        启用按钮
      </label>
      {enabled ? (
        <>
          <label htmlFor={`${id}-text`}>按钮文案</label>
          <input
            id={`${id}-text`}
            maxLength={32}
            onChange={(event) => update("text", event.target.value)}
            required
            type="text"
            value={typeof value.text === "string" ? value.text : ""}
          />
          <label htmlFor={`${id}-target-type`}>跳转类型</label>
          <select
            id={`${id}-target-type`}
            onChange={(event) => {
              const nextTargetType = getTargetType(event.target.value);
              onChange({
                ...value,
                openInNewTab: nextTargetType === "EXTERNAL_LINK" && value.openInNewTab === true,
                targetType: nextTargetType,
              });
            }}
            value={targetType}
          >
            <option value="INTERNAL_ROUTE">站内页面</option>
            <option value="PAGE_ANCHOR">页面锚点</option>
            <option value="EXTERNAL_LINK">外部链接</option>
          </select>
          <label htmlFor={`${id}-target`}>{getTargetLabel(targetType)}</label>
          <input
            id={`${id}-target`}
            onChange={(event) => update(getTargetKey(targetType), event.target.value)}
            required
            type={targetType === "EXTERNAL_LINK" ? "url" : "text"}
            value={getTargetValue(value, targetType)}
          />
          {targetType === "EXTERNAL_LINK" ? (
            <label className={styles.checkbox}>
              <input
                checked={value.openInNewTab === true}
                onChange={(event) => update("openInNewTab", event.target.checked)}
                type="checkbox"
              />
              在新窗口打开
            </label>
          ) : null}
        </>
      ) : null}
      {error ? <small className={styles.error} role="alert">{error}</small> : null}
    </fieldset>
  );
}

function getFieldError(issues: SchemaValidationIssue[], path: BlockConfigField["path"]) {
  const fieldName = path.split(".").at(-1);
  return issues.find((issue) => issue.field === fieldName)?.message;
}

function getTargetType(value: JsonValue | undefined) {
  return value === "EXTERNAL_LINK" || value === "PAGE_ANCHOR" ? value : "INTERNAL_ROUTE";
}

function getTargetKey(targetType: ReturnType<typeof getTargetType>) {
  if (targetType === "EXTERNAL_LINK") return "externalUrl";
  if (targetType === "PAGE_ANCHOR") return "anchorCode";
  return "routePath";
}

function getTargetLabel(targetType: ReturnType<typeof getTargetType>) {
  if (targetType === "EXTERNAL_LINK") return "外部链接";
  if (targetType === "PAGE_ANCHOR") return "锚点编码";
  return "站内路径";
}

function getTargetValue(value: JsonObject, targetType: ReturnType<typeof getTargetType>) {
  const target = value[getTargetKey(targetType)];
  return typeof target === "string" ? target : "";
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getContentBindingSource(value: JsonValue | undefined): ContentBindingSource | null {
  if (value === "CASE" || value === "INDUSTRY_SOLUTION" || value === "PRODUCT") return value;
  return null;
}

function getContentBindingMode(value: JsonValue | undefined): ContentBindingMode | null {
  return value === "AUTO" || value === "MANUAL" ? value : null;
}

function getContentBindingSort(value: JsonValue | undefined): ContentBindingSort | null {
  return value === "SORT_ORDER_ASC" || value === "UPDATED_AT_DESC" ? value : null;
}
