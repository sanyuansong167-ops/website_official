"use client";

import { useState } from "react";
import type { ContentDraftForm } from "@/features/content-editor/content-draft-form";
import { ContentBindingDialog } from "@/features/editor/ContentBindingDialog";
import { MediaPickerDialog } from "@/features/editor/MediaPickerDialog";
import type { ContentBindingSource } from "@/types/content-binding";
import type { ContentResourceKind } from "@/types/content-editor";
import type { MediaAsset } from "@/types/media";
import styles from "./ContentEditorShell.module.css";

type FormValue = ContentDraftForm[keyof ContentDraftForm];
type MediaTarget = "cover" | "gallery" | "hero" | "primary";
type RelationField = "relatedCaseIds" | "relatedIndustrySolutionIds" | "relatedProductIds";

type RelationDefinition = {
  field: RelationField;
  label: string;
  source: ContentBindingSource;
};

export function ContentDraftPanels({
  disabled,
  form,
  onChange,
  resourceId,
  resourceKind,
}: Readonly<{
  disabled: boolean;
  form: ContentDraftForm;
  onChange: (field: keyof ContentDraftForm, value: FormValue) => void;
  resourceId: number;
  resourceKind: ContentResourceKind;
}>) {
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const [relation, setRelation] = useState<RelationDefinition | null>(null);
  const relationDefinitions = getRelationDefinitions(resourceKind);

  function selectMedia(asset: MediaAsset) {
    if (mediaTarget === "primary") {
      onChange("primaryMediaId", asset.id);
      if (asset.altText) onChange("primaryMediaAltText", asset.altText);
    } else if (mediaTarget === "cover") {
      onChange("coverMediaId", asset.id);
      if (asset.altText) onChange("coverAltText", asset.altText);
    } else if (mediaTarget === "hero") {
      onChange("heroMediaId", asset.id);
      if (asset.altText) onChange("heroAltText", asset.altText);
    } else if (mediaTarget === "gallery" && !form.galleryMediaIds.includes(asset.id)) {
      onChange("galleryMediaIds", [...form.galleryMediaIds, asset.id]);
    }
    setMediaTarget(null);
  }

  return (
    <>
      <section className={styles.panel} aria-labelledby="base-info-title">
        <PanelHeading eyebrow="内容实体" id="base-info-title" title="基本信息" />
        <TextField disabled={disabled} id="content-title" label={resourceKind === "solution" ? "方案名称 *" : resourceKind === "product" ? "产品名称 *" : "案例标题 *"} onChange={(value) => onChange("title", value)} value={form.title} />
        {resourceKind === "product" ? <TextField disabled={disabled} id="content-short-title" label="短标题" onChange={(value) => onChange("shortTitle", value)} value={form.shortTitle} /> : null}
        <TextField area disabled={disabled} id="content-summary" label="摘要 *" onChange={(value) => onChange("summary", value)} rows={4} value={form.summary} />
        {resourceKind === "case" ? (
          <div className={styles.fieldGrid}>
            <TextField disabled={disabled} id="content-customer" label="客户名称" onChange={(value) => onChange("customerName", value)} value={form.customerName} />
            <TextField disabled={disabled} id="content-industry" label="所属行业" onChange={(value) => onChange("industry", value)} value={form.industry} />
          </div>
        ) : null}
        {resourceKind === "solution" ? <TextField area description="每行一个客户或行业标签。" disabled={disabled} id="content-customer-tags" label="行业与客户标签" onChange={(value) => onChange("customerTags", value)} rows={4} value={form.customerTags} /> : null}
      </section>

      <section className={styles.panel} aria-labelledby="detail-content-title">
        <PanelHeading eyebrow="服务端白名单净化" id="detail-content-title" title="正文内容" />
        {resourceKind === "case" ? (
          <>
            <TextField area disabled={disabled} id="content-background" label="项目背景" onChange={(value) => onChange("background", value)} rows={4} value={form.background} />
            <TextField area disabled={disabled} id="content-solution" label="解决方案" onChange={(value) => onChange("solution", value)} rows={4} value={form.solution} />
            <TextField area disabled={disabled} id="content-result" label="项目成果" onChange={(value) => onChange("result", value)} rows={4} value={form.result} />
          </>
        ) : null}
        {resourceKind === "product" ? (
          <>
            <TextField area description="每行一项。" disabled={disabled} id="content-highlights" label="能力亮点" onChange={(value) => onChange("highlights", value)} rows={4} value={form.highlights} />
            <TextField area description="每行一个行业。" disabled={disabled} id="content-industries" label="适用行业" onChange={(value) => onChange("applicationScenarios", value)} rows={4} value={form.applicationScenarios} />
            <TextField area description="每行一项。" disabled={disabled} id="content-features" label="功能描述" onChange={(value) => onChange("features", value)} rows={5} value={form.features} />
          </>
        ) : null}
        {resourceKind === "solution" ? (
          <>
            <TextField area description="每行一项。" disabled={disabled} id="content-pain-points" label="行业痛点" onChange={(value) => onChange("painPoints", value)} rows={4} value={form.painPoints} />
            <TextField area description="每行一项。" disabled={disabled} id="content-approach" label="解决思路" onChange={(value) => onChange("solutionApproach", value)} rows={4} value={form.solutionApproach} />
            <TextField area description="每行一项。" disabled={disabled} id="content-capabilities" label="核心能力" onChange={(value) => onChange("coreCapabilities", value)} rows={4} value={form.coreCapabilities} />
            <TextField area description="每行一项。" disabled={disabled} id="content-scenarios" label="应用场景" onChange={(value) => onChange("applicationScenarios", value)} rows={4} value={form.applicationScenarios} />
          </>
        ) : null}
        <TextField
          area
          description="支持经过后台白名单净化的富文本 HTML；禁止脚本、事件属性和危险链接协议。"
          disabled={disabled}
          id="content-rich-text"
          label="详情正文"
          onChange={(value) => onChange("content", value)}
          rows={10}
          value={form.content}
        />
      </section>

      <section className={styles.panel} aria-labelledby="content-media-title">
        <PanelHeading eyebrow="受保护媒体库" id="content-media-title" title="媒体资源" />
        <div className={styles.mediaGrid}>
          <MediaField disabled={disabled} id="primary-media" label={getPrimaryMediaLabel(resourceKind)} mediaId={form.primaryMediaId} onClear={() => onChange("primaryMediaId", null)} onSelect={() => setMediaTarget("primary")} />
          <MediaField disabled={disabled} id="cover-media" label="封面" mediaId={form.coverMediaId} onClear={() => onChange("coverMediaId", null)} onSelect={() => setMediaTarget("cover")} />
          <MediaField disabled={disabled} id="hero-media" label="头图" mediaId={form.heroMediaId} onClear={() => onChange("heroMediaId", null)} onSelect={() => setMediaTarget("hero")} />
        </div>
        <div className={styles.fieldGrid}>
          <TextField disabled={disabled} id="primary-media-alt" label={`${getPrimaryMediaLabel(resourceKind)} 替代文本`} onChange={(value) => onChange("primaryMediaAltText", value)} value={form.primaryMediaAltText} />
          <TextField disabled={disabled} id="cover-media-alt" label="封面替代文本" onChange={(value) => onChange("coverAltText", value)} value={form.coverAltText} />
          <TextField disabled={disabled} id="hero-media-alt" label="头图替代文本" onChange={(value) => onChange("heroAltText", value)} value={form.heroAltText} />
        </div>
        <div className={styles.mediaField}>
          <strong>图集</strong>
          <div className={styles.selectedIds} aria-label="已选图集媒体">
            {form.galleryMediaIds.length === 0 ? <span>尚未选择图片</span> : form.galleryMediaIds.map((id) => (
              <button disabled={disabled} key={id} onClick={() => onChange("galleryMediaIds", form.galleryMediaIds.filter((item) => item !== id))} type="button">ID {id} · 移除</button>
            ))}
          </div>
          <button className={styles.inlineButton} disabled={disabled} onClick={() => setMediaTarget("gallery")} type="button">添加图集图片</button>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="content-relations-title">
        <PanelHeading eyebrow="只保存实体 ID 与顺序" id="content-relations-title" title="关联内容" />
        <p className={styles.panelDescription}>关联选择器只允许绑定后台返回的可用内容，不复制对方详情正文。</p>
        <div className={styles.relationGrid}>
          {relationDefinitions.map((definition) => {
            const ids = form[definition.field];
            return (
              <div className={styles.relationField} key={definition.field}>
                <strong>{definition.label}</strong>
                <span>{ids.length > 0 ? ids.map((id) => `#${id}`).join("、") : "尚未绑定"}</span>
                <button className={styles.inlineButton} disabled={disabled} onClick={() => setRelation(definition)} type="button">选择并排序</button>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="seo-title">
        <PanelHeading eyebrow="SEO" id="seo-title" title="搜索信息" />
        <TextField disabled={disabled} id="content-seo-title" label="SEO 标题" onChange={(value) => onChange("seoTitle", value)} value={form.seoTitle} />
        <TextField description="使用中文或英文逗号分隔。" disabled={disabled} id="content-seo-keywords" label="SEO 关键词" onChange={(value) => onChange("seoKeywords", value)} value={form.seoKeywords} />
        <TextField area disabled={disabled} id="content-seo-description" label="SEO 描述" onChange={(value) => onChange("seoDescription", value)} rows={4} value={form.seoDescription} />
      </section>

      {mediaTarget ? (
        <MediaPickerDialog
          currentMediaId={getCurrentMediaId(form, mediaTarget)}
          onClose={() => setMediaTarget(null)}
          onSelect={selectMedia}
          open
        />
      ) : null}
      {relation ? (
        <ContentBindingDialog
          limit={12}
          onClose={() => setRelation(null)}
          onConfirm={(ids) => {
            const sameSource = getResourceSource(resourceKind) === relation.source;
            onChange(relation.field, sameSource ? ids.filter((id) => id !== resourceId) : ids);
            setRelation(null);
          }}
          selectedIds={form[relation.field]}
          source={relation.source}
        />
      ) : null}
    </>
  );
}

function PanelHeading({ eyebrow, id, title }: Readonly<{ eyebrow: string; id: string; title: string }>) {
  return <div className={styles.panelHeading}><p className={styles.eyebrow}>{eyebrow}</p><h2 id={id}>{title}</h2></div>;
}

function TextField({ area = false, description, disabled, id, label, onChange, rows = 1, value }: Readonly<{
  area?: boolean;
  description?: string;
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}>) {
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      {area
        ? <textarea aria-describedby={descriptionId} disabled={disabled} id={id} onChange={(event) => onChange(event.target.value)} rows={rows} value={value} />
        : <input aria-describedby={descriptionId} disabled={disabled} id={id} onChange={(event) => onChange(event.target.value)} value={value} />}
      {description ? <small className={styles.fieldDescription} id={descriptionId}>{description}</small> : null}
    </label>
  );
}

function MediaField({ disabled, id, label, mediaId, onClear, onSelect }: Readonly<{
  disabled: boolean;
  id: string;
  label: string;
  mediaId: number | null;
  onClear: () => void;
  onSelect: () => void;
}>) {
  return (
    <div className={styles.mediaField} id={id}>
      <strong>{label}</strong>
      <span>{mediaId ? `媒体 ID ${mediaId}` : "尚未选择"}</span>
      <div>
        <button className={styles.inlineButton} disabled={disabled} onClick={onSelect} type="button">选择图片</button>
        {mediaId ? <button className={styles.textButton} disabled={disabled} onClick={onClear} type="button">清除</button> : null}
      </div>
    </div>
  );
}

function getPrimaryMediaLabel(kind: ContentResourceKind) {
  return kind === "solution" ? "方案图标" : kind === "case" ? "客户 Logo" : "产品 Logo";
}

function getCurrentMediaId(form: ContentDraftForm, target: MediaTarget) {
  if (target === "primary") return form.primaryMediaId ?? undefined;
  if (target === "cover") return form.coverMediaId ?? undefined;
  if (target === "hero") return form.heroMediaId ?? undefined;
  return undefined;
}

function getResourceSource(kind: ContentResourceKind): ContentBindingSource {
  if (kind === "case") return "CASE";
  if (kind === "solution") return "INDUSTRY_SOLUTION";
  return "PRODUCT";
}

function getRelationDefinitions(kind: ContentResourceKind): RelationDefinition[] {
  if (kind === "product") {
    return [
      { field: "relatedCaseIds", label: "关联案例", source: "CASE" },
      { field: "relatedIndustrySolutionIds", label: "关联行业方案", source: "INDUSTRY_SOLUTION" },
    ];
  }
  if (kind === "case") {
    return [
      { field: "relatedProductIds", label: "关联产品", source: "PRODUCT" },
      { field: "relatedCaseIds", label: "推荐案例", source: "CASE" },
    ];
  }
  return [
    { field: "relatedProductIds", label: "关联产品", source: "PRODUCT" },
    { field: "relatedCaseIds", label: "关联案例", source: "CASE" },
    { field: "relatedIndustrySolutionIds", label: "推荐方案", source: "INDUSTRY_SOLUTION" },
  ];
}
