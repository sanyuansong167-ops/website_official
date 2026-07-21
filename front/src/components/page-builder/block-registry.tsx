import Image from "next/image";
import type { ComponentType } from "react";
import { ContactCtaBlock } from "@/components/page-builder/ContactCtaBlock";
import { ContactFormBlock } from "@/components/page-builder/ContactFormBlock";
import {
  ControlledActionLink,
  decodeControlledAction,
} from "@/components/page-builder/controlled-action";
import { ImageTextBlock } from "@/components/page-builder/ImageTextBlock";
import { HomeContentGridBlock } from "@/components/page-builder/HomeContentGridBlock";
import { ListingGridBlock } from "@/components/page-builder/ListingGridBlock";
import { LogoWallBlock } from "@/components/page-builder/LogoWallBlock";
import { PromiseBlock } from "@/components/page-builder/PromiseBlock";
import { TimelineBlock } from "@/components/page-builder/TimelineBlock";
import { getAdminApiBaseUrl } from "@/lib/environment";
import { homeBlockTemplates, type BlockConfigField } from "@/lib/home-page-template";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { ControlledSection, JsonObject, PageSlot, RenderMode } from "@/types/page-builder";
import styles from "./block-registry.module.css";

type BlockRendererProps = {
  mode: RenderMode;
  section: ControlledSection;
};

export type BlockDefinition = {
  allowedSlots: readonly PageSlot[];
  configFields?: readonly BlockConfigField[];
  defaultDataBinding?: JsonObject;
  defaultProps: JsonObject;
  defaultStyle?: JsonObject;
  isRepeatable: boolean;
  label?: string;
  renderer: ComponentType<BlockRendererProps>;
};

const mainSlot = ["main"] as const;
const editableHeadingFields: readonly BlockConfigField[] = [
  { control: "text", label: "区块标题", maxLength: 128, path: "props.title", required: true },
  { control: "textarea", label: "区块说明", maxLength: 300, path: "props.summary" },
  { control: "text", label: "空状态说明", maxLength: 120, path: "props.emptyStateText" },
  {
    control: "select",
    label: "区块主题",
    options: [
      { label: "浅色", value: "light" },
      { label: "深色", value: "dark" },
    ],
    path: "style.theme",
    required: true,
  },
  {
    control: "select",
    label: "区块间距",
    options: [
      { label: "紧凑", value: "compact" },
      { label: "标准", value: "standard" },
      { label: "宽松", value: "large" },
    ],
    path: "style.spacing",
    required: true,
  },
];

const blockRegistry = {
  AiCardSection: { ...homeBlockTemplates.AiCardSection, renderer: AiCardRenderer },
  CapabilitySection: { ...homeBlockTemplates.CapabilitySection, renderer: CapabilityRenderer },
  CaseGridSection: { ...homeBlockTemplates.CaseGridSection, renderer: CaseGridRenderer },
  ContactCtaSection: { ...homeBlockTemplates.ContactCtaSection, renderer: ContactCtaBlock },
  ContactFormSection: {
    allowedSlots: mainSlot,
    configFields: editableHeadingFields,
    defaultDataBinding: { source: "CONTACT_PAGE" },
    defaultProps: { summary: "留下您的合作需求，我们会尽快与您沟通。", title: "预约交流" },
    defaultStyle: { spacing: "large", theme: "light" },
    isRepeatable: false,
    label: "联系信息与预约表单",
    renderer: ContactFormBlock,
  },
  DividerSection: { allowedSlots: mainSlot, defaultProps: {}, isRepeatable: true, renderer: PendingBlockRenderer },
  FaqSection: { allowedSlots: mainSlot, defaultProps: {}, isRepeatable: true, renderer: PendingBlockRenderer },
  HeroSection: {
    ...homeBlockTemplates.HeroSection,
    renderer: HeroBlockRenderer,
  },
  ImageTextSection: { ...homeBlockTemplates.ImageTextSection, renderer: ImageTextBlock },
  LogoWallSection: {
    allowedSlots: mainSlot,
    configFields: [
      { control: "text", label: "区块标题", maxLength: 80, path: "props.title", required: true },
      { control: "textarea", label: "区块摘要", maxLength: 300, path: "props.summary" },
      { control: "number", label: "展示数量", max: 24, min: 1, path: "props.displayLimit", required: true },
      { control: "text", label: "空状态说明", maxLength: 120, path: "props.emptyStateText" },
      {
        control: "select",
        label: "展示方式",
        options: [
          { label: "客户 Logo 墙", value: "logo-wall" },
          { label: "荣誉卡片", value: "honor-grid" },
        ],
        path: "style.layout",
        required: true,
      },
      {
        control: "select",
        label: "区块主题",
        options: [
          { label: "浅色", value: "light" },
          { label: "深色", value: "dark" },
        ],
        path: "style.theme",
        required: true,
      },
      {
        control: "select",
        label: "区块间距",
        options: [
          { label: "紧凑", value: "compact" },
          { label: "标准", value: "standard" },
          { label: "宽松", value: "large" },
        ],
        path: "style.spacing",
        required: true,
      },
    ],
    defaultProps: {
      displayLimit: 12,
      emptyStateText: "暂无可展示内容",
      summary: "",
      title: "客户与伙伴",
    },
    defaultStyle: { layout: "logo-wall", spacing: "standard", theme: "light" },
    isRepeatable: true,
    renderer: LogoWallBlock,
  },
  MetricsSection: { ...homeBlockTemplates.MetricsSection, renderer: MetricsRenderer },
  PromiseSection: {
    allowedSlots: mainSlot,
    configFields: editableHeadingFields,
    defaultDataBinding: { source: "PROMISE" },
    defaultProps: { summary: "以清晰边界、可靠交付和持续服务回应每一次合作。", title: "我们的承诺" },
    defaultStyle: { spacing: "large", theme: "light" },
    isRepeatable: true,
    label: "我们的承诺",
    renderer: PromiseBlock,
  },
  ProductGridSection: { ...homeBlockTemplates.ProductGridSection, renderer: ProductGridRenderer },
  RichTextSection: { allowedSlots: mainSlot, defaultProps: {}, isRepeatable: true, renderer: PendingBlockRenderer },
  SolutionGridSection: { ...homeBlockTemplates.SolutionGridSection, renderer: SolutionGridRenderer },
  ResearchDirectionSection: {
    allowedSlots: mainSlot,
    configFields: editableHeadingFields,
    defaultDataBinding: { source: "RESEARCH_DIRECTION" },
    defaultProps: { emptyStateText: "暂无可展示研发方向", summary: "围绕真实业务需求持续推进关键技术研究与产品化。", title: "重点研发方向" },
    defaultStyle: { layout: "three-columns", spacing: "standard", theme: "dark" },
    isRepeatable: true,
    label: "研发方向",
    renderer: ResearchDirectionRenderer,
  },
  TimelineSection: {
    allowedSlots: mainSlot,
    configFields: [
      { control: "text", label: "区块标题", maxLength: 80, path: "props.title", required: true },
      { control: "textarea", label: "区块摘要", maxLength: 300, path: "props.summary" },
      { control: "number", label: "展示数量", max: 24, min: 1, path: "props.displayLimit", required: true },
      { control: "text", label: "空状态说明", maxLength: 120, path: "props.emptyStateText" },
      {
        control: "select",
        label: "区块主题",
        options: [
          { label: "浅色", value: "light" },
          { label: "深色", value: "dark" },
        ],
        path: "style.theme",
        required: true,
      },
      {
        control: "select",
        label: "区块间距",
        options: [
          { label: "紧凑", value: "compact" },
          { label: "标准", value: "standard" },
          { label: "宽松", value: "large" },
        ],
        path: "style.spacing",
        required: true,
      },
    ],
    defaultProps: {
      displayLimit: 12,
      emptyStateText: "暂无可展示历程",
      summary: "",
      title: "发展历程",
    },
    defaultStyle: { spacing: "standard", theme: "light" },
    isRepeatable: true,
    renderer: TimelineBlock,
  },
  ValueCardSection: {
    allowedSlots: mainSlot,
    configFields: editableHeadingFields,
    defaultDataBinding: { source: "VALUE_CARD" },
    defaultProps: { emptyStateText: "暂无可展示价值观", summary: "以长期主义建设产品、技术与客户关系。", title: "核心价值观" },
    defaultStyle: { layout: "three-columns", spacing: "standard", theme: "light" },
    isRepeatable: true,
    label: "价值观卡片",
    renderer: ValueCardRenderer,
  },
} as const;

type RegisteredBlockType = keyof typeof blockRegistry;

export function getBlockRenderer(component: string): ComponentType<BlockRendererProps> | null {
  return getBlockDefinition(component)?.renderer ?? null;
}

export function getBlockDefinition(component: string): BlockDefinition | null {
  return isRegisteredBlockType(component) ? blockRegistry[component] : null;
}

export function isBlockSlotAllowed(component: string, slot: PageSlot) {
  return getBlockDefinition(component)?.allowedSlots.includes(slot) ?? false;
}

function HeroBlockRenderer({ section }: BlockRendererProps) {
  const title = getText(section.props.mainTitle) ?? "未设置首屏标题";
  const description = getText(section.props.subTitle);
  const backgroundImageUrl = getSafeImageUrl(section.props.backgroundImageUrl);
  const actions = [
    decodeControlledAction(section.props.primaryButton),
    decodeControlledAction(section.props.secondaryButton),
  ].filter(
    (action): action is NonNullable<typeof action> => action !== null,
  );

  return (
    <div className={styles.hero}>
      {backgroundImageUrl ? (
        <Image
          alt=""
          className={styles.heroMedia}
          fill
          priority
          sizes="100vw"
          src={backgroundImageUrl}
          unoptimized
        />
      ) : null}
      <div className={styles.heroContent}>
        <h1>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
        {actions.length > 0 ? (
          <div className={styles.heroActions}>
            {actions.map((action, index) => (
              <ControlledActionLink
                action={action}
                className={index > 0 ? styles.secondaryAction : styles.primaryAction}
                key={`${action.text}-${index}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProductGridRenderer({ mode, section }: BlockRendererProps) {
  return <ListingGridBlock kind="product" mode={mode} section={section} />;
}

function CaseGridRenderer({ mode, section }: BlockRendererProps) {
  return <ListingGridBlock kind="case" mode={mode} section={section} />;
}

function SolutionGridRenderer({ mode, section }: BlockRendererProps) {
  return <ListingGridBlock kind="solution" mode={mode} section={section} />;
}

function MetricsRenderer({ mode, section }: BlockRendererProps) {
  return <HomeContentGridBlock kind="metric" mode={mode} section={section} />;
}

function AiCardRenderer({ mode, section }: BlockRendererProps) {
  return <HomeContentGridBlock kind="ai" mode={mode} section={section} />;
}

function CapabilityRenderer({ mode, section }: BlockRendererProps) {
  return <HomeContentGridBlock kind="capability" mode={mode} section={section} />;
}

function ResearchDirectionRenderer({ mode, section }: BlockRendererProps) {
  return <HomeContentGridBlock kind="ai" mode={mode} section={section} />;
}

function ValueCardRenderer({ mode, section }: BlockRendererProps) {
  return <HomeContentGridBlock kind="capability" mode={mode} section={section} />;
}

function PendingBlockRenderer({ mode, section }: BlockRendererProps) {
  if (mode !== "editor") return null;

  return (
    <div className={styles.pendingBlock}>
      <strong>{section.component}</strong>
      <span>区块已登记，属性 DTO 与正式渲染器待后续步骤接入。</span>
    </div>
  );
}

export function isRegisteredBlockType(value: string): value is RegisteredBlockType {
  return value in blockRegistry;
}

function getText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getSafeImageUrl(value: unknown) {
  if (typeof value !== "string") return undefined;

  if (getNavigationTarget({ externalUrl: value, openInNewTab: false, targetType: "EXTERNAL_LINK" })) {
    return value;
  }

  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return undefined;
    return url.origin === new URL(getAdminApiBaseUrl()).origin ? value : undefined;
  } catch {
    return undefined;
  }
}
