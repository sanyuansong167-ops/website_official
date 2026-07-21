import type {
  ControlledSection,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  PageSchema,
  PageSlot,
} from "@/types/page-builder";

export const homeBlockOrder = [
  "HeroSection",
  "MetricsSection",
  "ImageTextSection",
  "AiCardSection",
  "CapabilitySection",
  "ProductGridSection",
  "SolutionGridSection",
  "CaseGridSection",
  "ContactCtaSection",
] as const;

export type HomeBlockType = (typeof homeBlockOrder)[number];

export function isHomeBlockType(value: string): value is HomeBlockType {
  return homeBlockOrder.some((component) => component === value);
}

export type BlockConfigControl =
  | "content-picker"
  | "link"
  | "media"
  | "number"
  | "select"
  | "text"
  | "textarea";

export type BlockConfigField = {
  control: BlockConfigControl;
  helpText?: string;
  label: string;
  max?: number;
  maxLength?: number;
  mediaAltPath?: `props.${string}`;
  mediaAltRequired?: boolean;
  mediaUrlPath?: `props.${string}`;
  min?: number;
  options?: readonly { label: string; value: JsonPrimitive }[];
  path: `dataBinding.${string}` | `props.${string}` | `style.${string}`;
  required?: boolean;
};

export type HomeBlockTemplate = {
  allowedSlots: readonly PageSlot[];
  configFields: readonly BlockConfigField[];
  defaultDataBinding?: JsonObject;
  defaultProps: JsonObject;
  defaultStyle: JsonObject;
  isRepeatable: boolean;
  label: string;
};

const mainSlot = ["main"] as const;
const themeOptions = [
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" },
] as const;
const spacingOptions = [
  { label: "紧凑", value: "compact" },
  { label: "标准", value: "standard" },
  { label: "宽松", value: "large" },
] as const;
const bindingModeOptions = [
  { label: "自动选择", value: "AUTO" },
  { label: "手动选择", value: "MANUAL" },
] as const;
const sortingOptions = [
  { label: "后台排序优先", value: "SORT_ORDER_ASC" },
  { label: "最近更新优先", value: "UPDATED_AT_DESC" },
] as const;

function createListTemplate({
  defaultLimit,
  defaultLayout,
  isRepeatable,
  label,
  layoutOptions,
  source,
  summary,
  title,
}: {
  defaultLimit: number;
  defaultLayout: string;
  isRepeatable: boolean;
  label: string;
  layoutOptions: readonly { label: string; value: string }[];
  source: string;
  summary: string;
  title: string;
}): HomeBlockTemplate {
  return {
    allowedSlots: mainSlot,
    configFields: [
      { control: "text", label: "区块标题", maxLength: 80, path: "props.title", required: true },
      { control: "textarea", label: "区块摘要", maxLength: 300, path: "props.summary" },
      { control: "number", label: "展示数量", max: 12, min: 1, path: "dataBinding.limit", required: true },
      {
        control: "select",
        label: "内容选择方式",
        options: bindingModeOptions,
        path: "dataBinding.displayMode",
        required: true,
      },
      {
        control: "content-picker",
        helpText: "仅保存内容 ID 与顺序，不复制内容详情。",
        label: "手动选择内容",
        path: "dataBinding.selectedIds",
      },
      {
        control: "select",
        label: "排序策略",
        options: sortingOptions,
        path: "dataBinding.sortBy",
        required: true,
      },
      { control: "text", label: "空状态说明", maxLength: 120, path: "props.emptyStateText" },
      { control: "select", label: "卡片布局", options: layoutOptions, path: "style.layout", required: true },
      { control: "select", label: "区块主题", options: themeOptions, path: "style.theme", required: true },
      { control: "select", label: "区块间距", options: spacingOptions, path: "style.spacing", required: true },
    ],
    defaultDataBinding: {
      displayMode: "AUTO",
      filters: { publishedOnly: true, tag: "" },
      limit: defaultLimit,
      selectedIds: [],
      sortBy: "SORT_ORDER_ASC",
      source,
    },
    defaultProps: {
      emptyStateText: "暂无可展示内容",
      summary,
      title,
    },
    defaultStyle: { layout: defaultLayout, spacing: "standard", theme: "light" },
    isRepeatable,
    label,
  };
}

export const homeBlockTemplates: Readonly<Record<HomeBlockType, HomeBlockTemplate>> = {
  HeroSection: {
    allowedSlots: mainSlot,
    configFields: [
      { control: "text", label: "眉题", maxLength: 40, path: "props.eyebrow" },
      { control: "text", label: "主标题", maxLength: 120, path: "props.mainTitle", required: true },
      { control: "textarea", label: "副标题", maxLength: 500, path: "props.subTitle" },
      {
        control: "media",
        label: "背景媒体",
        mediaAltPath: "props.backgroundImageAlt",
        mediaUrlPath: "props.backgroundImageUrl",
        path: "props.backgroundImageMediaId",
      },
      { control: "text", label: "背景图替代文本", maxLength: 160, path: "props.backgroundImageAlt" },
      { control: "link", label: "主按钮", path: "props.primaryButton" },
      { control: "link", label: "次按钮", path: "props.secondaryButton" },
      {
        control: "select",
        label: "内容布局",
        options: [
          { label: "左对齐", value: "left" },
          { label: "居中", value: "centered" },
        ],
        path: "style.layout",
        required: true,
      },
      { control: "select", label: "区块主题", options: themeOptions, path: "style.theme", required: true },
      { control: "select", label: "区块间距", options: spacingOptions, path: "style.spacing", required: true },
    ],
    defaultProps: {
      backgroundImageAlt: "",
      backgroundImageMediaId: null,
      backgroundImageUrl: "",
      eyebrow: "数据智能服务",
      mainTitle: "让数据智能更可靠地服务业务增长",
      primaryButton: {
        enabled: true,
        openInNewTab: false,
        routePath: "/contact",
        targetType: "INTERNAL_ROUTE",
        text: "预约交流",
      },
      secondaryButton: {
        enabled: false,
        openInNewTab: false,
        routePath: "/products",
        targetType: "INTERNAL_ROUTE",
        text: "了解产品",
      },
      subTitle: "以可信的数据基础和可落地的智能能力，连接业务场景与持续增长。",
    },
    defaultStyle: { layout: "left", spacing: "large", theme: "dark" },
    isRepeatable: false,
    label: "首页首屏",
  },
  MetricsSection: createListTemplate({
    defaultLayout: "four-columns",
    defaultLimit: 4,
    isRepeatable: true,
    label: "核心指标",
    layoutOptions: [
      { label: "四列", value: "four-columns" },
      { label: "三列", value: "three-columns" },
    ],
    source: "HOME_METRIC",
    summary: "用可验证的数据展示服务能力与实践积累。",
    title: "以成果建立信任",
  }),
  ImageTextSection: {
    allowedSlots: mainSlot,
    configFields: [
      { control: "text", label: "区块标题", maxLength: 80, path: "props.title", required: true },
      { control: "textarea", label: "区块摘要", maxLength: 300, path: "props.summary" },
      { control: "textarea", label: "正文", maxLength: 1200, path: "props.body" },
      {
        control: "media",
        label: "展示图片",
        mediaAltPath: "props.imageAlt",
        mediaAltRequired: true,
        mediaUrlPath: "props.imageUrl",
        path: "props.imageMediaId",
      },
      { control: "text", label: "图片替代文本", maxLength: 160, path: "props.imageAlt" },
      { control: "link", label: "行动按钮", path: "props.action" },
      {
        control: "select",
        label: "图文布局",
        options: [
          { label: "图片在左", value: "image-left" },
          { label: "图片在右", value: "image-right" },
        ],
        path: "style.layout",
        required: true,
      },
      { control: "select", label: "区块主题", options: themeOptions, path: "style.theme", required: true },
      { control: "select", label: "区块间距", options: spacingOptions, path: "style.spacing", required: true },
    ],
    defaultProps: {
      action: { enabled: false, openInNewTab: false, routePath: "/about", targetType: "INTERNAL_ROUTE", text: "了解我们" },
      body: "",
      imageAlt: "",
      imageMediaId: null,
      imageUrl: "",
      summary: "围绕数据基础、行业理解和工程交付，构建长期可持续的服务能力。",
      title: "可靠的交付来自系统能力",
    },
    defaultStyle: { layout: "image-right", spacing: "large", theme: "light" },
    isRepeatable: true,
    label: "图文介绍",
  },
  AiCardSection: createListTemplate({
    defaultLayout: "three-columns",
    defaultLimit: 3,
    isRepeatable: true,
    label: "AI 能力卡片",
    layoutOptions: [
      { label: "三列", value: "three-columns" },
      { label: "两列", value: "two-columns" },
    ],
    source: "AI_CARD",
    summary: "将模型、数据和业务流程连接为可持续运行的智能应用。",
    title: "AI 战略与实践",
  }),
  CapabilitySection: createListTemplate({
    defaultLayout: "three-columns",
    defaultLimit: 6,
    isRepeatable: true,
    label: "核心能力",
    layoutOptions: [
      { label: "三列", value: "three-columns" },
      { label: "两列", value: "two-columns" },
    ],
    source: "CAPABILITY",
    summary: "从数据治理到智能应用，形成贯穿全链路的技术与交付能力。",
    title: "核心能力",
  }),
  ProductGridSection: createListTemplate({
    defaultLayout: "three-columns",
    defaultLimit: 6,
    isRepeatable: false,
    label: "产品矩阵",
    layoutOptions: [
      { label: "三列", value: "three-columns" },
      { label: "两列", value: "two-columns" },
    ],
    source: "PRODUCT",
    summary: "面向多行业场景提供可组合、可持续演进的数据智能产品。",
    title: "产品矩阵",
  }),
  SolutionGridSection: createListTemplate({
    defaultLayout: "three-columns",
    defaultLimit: 3,
    isRepeatable: false,
    label: "行业方案",
    layoutOptions: [
      { label: "三列", value: "three-columns" },
      { label: "两列", value: "two-columns" },
    ],
    source: "INDUSTRY_SOLUTION",
    summary: "结合行业特点，把技术能力转化为清晰、可执行的解决路径。",
    title: "行业解决方案",
  }),
  CaseGridSection: createListTemplate({
    defaultLayout: "three-columns",
    defaultLimit: 3,
    isRepeatable: true,
    label: "客户案例",
    layoutOptions: [
      { label: "三列", value: "three-columns" },
      { label: "重点案例", value: "featured" },
    ],
    source: "CASE",
    summary: "以真实业务成果验证产品、方案与服务能力。",
    title: "客户实践",
  }),
  ContactCtaSection: {
    allowedSlots: mainSlot,
    configFields: [
      { control: "text", label: "区块标题", maxLength: 80, path: "props.title", required: true },
      { control: "textarea", label: "说明", maxLength: 300, path: "props.summary" },
      { control: "link", label: "行动按钮", path: "props.action", required: true },
      { control: "select", label: "区块主题", options: themeOptions, path: "style.theme", required: true },
      { control: "select", label: "区块间距", options: spacingOptions, path: "style.spacing", required: true },
    ],
    defaultProps: {
      action: {
        enabled: true,
        openInNewTab: false,
        routePath: "/contact",
        targetType: "INTERNAL_ROUTE",
        text: "联系我们",
      },
      summary: "告诉我们你的业务目标，一起梳理合适的数据智能落地路径。",
      title: "从一次交流开始",
    },
    defaultStyle: { layout: "centered", spacing: "large", theme: "dark" },
    isRepeatable: true,
    label: "联系引导",
  },
};

export function createDefaultHomePageSchema(): PageSchema {
  return {
    layout: { pageType: "HOME", schemaVersion: 1 },
    sections: homeBlockOrder.map((component, index) =>
      createHomeBlockSection(component, `home-${toKebabCase(component)}`, index * 10),
    ),
    seo: {
      description: "武汉云台数据为企业提供可信、可落地的数据智能产品与解决方案。",
      keywords: ["数据智能", "数据治理", "人工智能", "行业解决方案"],
      title: "武汉云台数据｜数据智能产品与解决方案",
    },
  };
}

export function createHomeBlockSection(
  component: HomeBlockType,
  id: string,
  sortOrder: number,
): ControlledSection {
  const template = homeBlockTemplates[component];

  return {
    component,
    dataBinding: template.defaultDataBinding ? cloneJsonObject(template.defaultDataBinding) : undefined,
    id,
    props: cloneJsonObject(template.defaultProps),
    slot: "main",
    sortOrder,
    style: cloneJsonObject(template.defaultStyle),
    visible: true,
  };
}

function cloneJsonObject(value: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJsonValue(item)]));
}

function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(cloneJsonValue);
  if (typeof value === "object" && value !== null) return cloneJsonObject(value);
  return value;
}

function toKebabCase(value: string) {
  return value.replace(/Section$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
