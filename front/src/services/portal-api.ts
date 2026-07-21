import { getPortalApiBaseUrl } from "@/lib/environment";
import { requestApi } from "@/services/http";
import type {
  ControlledSection,
  JsonObject,
  JsonValue,
  PageSeo,
  PortalPageViewModel,
} from "@/types/page-builder";
import type {
  CaseDetailViewModel,
  ContactInfoViewModel,
  CreateLeadRequest,
  IndustrySolutionDetailViewModel,
  NavigationMenuViewModel,
  PortalChromeViewModel,
  ProductDetailViewModel,
  SiteConfigViewModel,
} from "@/types/portal";

type ServerRequestContext = {
  cookie?: string;
};

export function getPortalPage(routePath: string) {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodePortalPage,
    init: portalGetInit(),
    path: `/portal/api/page-builder/pages?routePath=${encodeURIComponent(routePath)}`,
  });
}

export function getProductDetail(productId: number) {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodeProductDetail,
    init: portalGetInit(),
    path: `/portal/api/products/${encodeURIComponent(String(productId))}`,
  });
}

export function getCaseDetail(caseId: number) {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodeCaseDetail,
    init: portalGetInit(),
    path: `/portal/api/cases/${encodeURIComponent(String(caseId))}`,
  });
}

export function getIndustrySolutionDetail(solutionId: number) {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodeIndustrySolutionDetail,
    init: portalGetInit(),
    path: `/portal/api/industry-solutions/${encodeURIComponent(String(solutionId))}`,
  });
}

export function getPreviewPage(previewToken: string, context: ServerRequestContext) {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodePortalPage,
    init: portalGetInit(context),
    path: `/portal/api/page-builder/previews/${encodeURIComponent(previewToken)}`,
  });
}

export function getPortalChrome(): Promise<PortalChromeViewModel> {
  return Promise.all([
    getOptionalPortalData(getSiteConfig),
    getOptionalPortalData(getNavigationMenus),
    getOptionalPortalData(getContactInfo),
  ]).then(([site, navigation, contact]) => ({ contact, navigation: navigation ?? [], site }));
}

export function getSiteConfig() {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodeSiteConfig,
    init: portalGetInit(),
    path: "/portal/api/site/config",
  });
}

export function getNavigationMenus() {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodeNavigationMenuList,
    init: portalGetInit(),
    path: "/portal/api/site/navigation",
  });
}

export function getContactInfo() {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodeContactInfo,
    init: portalGetInit(),
    path: "/portal/api/contact-info",
  });
}

export function getCooperationDirectionTags() {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: decodeCooperationDirectionTags,
    init: portalGetInit(),
    path: "/portal/api/cooperation-direction-tags",
  });
}

export function createLead(input: CreateLeadRequest) {
  return requestApi({
    allowMissingData: true,
    baseUrl: getPortalApiBaseUrl(),
    decode: () => undefined,
    init: {
      body: JSON.stringify(input),
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    path: "/portal/api/leads",
  });
}

function portalGetInit(context?: ServerRequestContext): RequestInit {
  return {
    cache: "no-store",
    credentials: "include",
    headers: context?.cookie ? { Cookie: context.cookie } : undefined,
    method: "GET",
  };
}

async function getOptionalPortalData<T>(request: () => Promise<T>) {
  try {
    return await request();
  } catch {
    return null;
  }
}

function decodeSiteConfig(value: unknown): SiteConfigViewModel {
  const record = requiredRecord(value);

  return {
    brandSlogan: requiredString(record.brandSlogan),
    brandTagline: requiredString(record.brandTagline),
    filingNumber: optionalString(record.filingNumber),
    filingUrl: optionalString(record.filingUrl),
    logoDarkUrl: optionalPortalMediaUrl(record.logoDarkUrl),
    logoLightUrl: optionalPortalMediaUrl(record.logoLightUrl),
    privacyPolicyPath: optionalString(record.privacyPolicyPath),
    seoDescription: requiredString(record.seoDescription),
    seoKeywords: requiredString(record.seoKeywords),
    siteTitle: requiredString(record.siteTitle),
    termsOfServicePath: optionalString(record.termsOfServicePath),
  };
}

function decodeNavigationMenuList(value: unknown): NavigationMenuViewModel[] {
  if (!Array.isArray(value)) throw new Error("Expected a navigation menu list.");
  return value.map(decodeNavigationMenu);
}

function decodeNavigationMenu(value: unknown): NavigationMenuViewModel {
  const record = requiredRecord(value);
  const targetType = requiredString(record.targetType);

  if (!isNavigationTargetType(targetType)) throw new Error("Unexpected navigation target type.");
  if (!Array.isArray(record.children)) throw new Error("Expected navigation children.");

  return {
    anchorCode: optionalString(record.anchorCode),
    children: record.children.map(decodeNavigationMenu),
    externalUrl: optionalString(record.externalUrl),
    id: requiredNumber(record.id),
    menuName: requiredString(record.menuName),
    openInNewTab: requiredBoolean(record.openInNewTab),
    routePath: optionalString(record.routePath),
    targetType,
  };
}

function decodeContactInfo(value: unknown): ContactInfoViewModel {
  const record = requiredRecord(value);

  return {
    businessPhone: requiredString(record.businessPhone),
    contactAddress: requiredString(record.contactAddress),
    contactEmail: requiredString(record.contactEmail),
  };
}

function decodeCooperationDirectionTags(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Expected a cooperation direction list.");

  return value.map((item) => requiredString(requiredRecord(item).tagText));
}

function decodeProductDetail(value: unknown): ProductDetailViewModel {
  const record = requiredRecord(value);

  return {
    coverUrl: optionalPortalMediaUrl(record.coverUrl),
    description: requiredString(record.description),
    id: requiredNumber(record.id),
    logoUrl: optionalPortalMediaUrl(record.logoUrl),
    seoDescription: optionalString(record.seoDescription),
    seoTitle: optionalString(record.seoTitle),
    status: requiredString(record.status),
    title: requiredString(record.title),
  };
}

function decodeCaseDetail(value: unknown): CaseDetailViewModel {
  const record = requiredRecord(value);

  return {
    background: optionalString(record.background),
    coverUrl: optionalPortalMediaUrl(record.coverUrl),
    customerName: optionalString(record.customerName),
    id: requiredNumber(record.id),
    industry: optionalString(record.industry),
    logoUrl: optionalPortalMediaUrl(record.logoUrl),
    result: optionalString(record.result),
    seoDescription: optionalString(record.seoDescription),
    seoTitle: optionalString(record.seoTitle),
    solution: optionalString(record.solution),
    status: requiredString(record.status),
    title: requiredString(record.title),
  };
}

function decodeIndustrySolutionDetail(value: unknown): IndustrySolutionDetailViewModel {
  const record = requiredRecord(value);
  if (!Array.isArray(record.customerTags)) throw new Error("Expected industry solution customer tags.");

  return {
    customerTags: record.customerTags.map(requiredString),
    description: requiredString(record.description),
    iconUrl: optionalPortalMediaUrl(record.iconUrl),
    id: requiredNumber(record.id),
    name: requiredString(record.name),
  };
}

function decodePortalPage(value: unknown): PortalPageViewModel {
  const record = requiredRecord(value);
  const sections = record.sections;

  if (!Array.isArray(sections)) throw new Error("Expected a portal section list.");

  return {
    name: requiredString(record.name),
    pageKey: requiredString(record.pageKey),
    schema: {
      layout: decodeJsonObject(record.layout),
      // The Portal contract returns sections in server-defined display order and does not expose
      // editor-only slot or binding metadata. They are adapted to the main slot for rendering.
      sections: sections.map((section, index) => decodePortalSection(section, index)),
      seo: decodePageSeo(record.seo),
    },
  };
}

function decodePortalSection(value: unknown, sortOrder: number): ControlledSection {
  const record = requiredRecord(value);
  const bindingData = record.data ?? record.bindingData;
  const portalComponent = requiredString(record.component);

  return {
    component: normalizePortalComponent(portalComponent),
    data: decodePortalBindingData(bindingData),
    id: requiredString(record.id),
    props: decodePortalProps(portalComponent, record.props),
    slot: "main",
    sortOrder,
    style: decodeOptionalJsonObject(record.style),
    visible: record.visible === undefined ? true : requiredBoolean(record.visible),
  };
}

function normalizePortalComponent(component: string) {
  const componentMap: Record<string, string> = {
    CaseGrid: "CaseGridSection",
    HeroBanner: "HeroSection",
    IndustrySolutionGrid: "SolutionGridSection",
    ProductGrid: "ProductGridSection",
  };

  return componentMap[component] ?? component;
}

function decodePortalProps(component: string, value: unknown): JsonObject {
  const props = decodeJsonObject(value);
  if (component !== "HeroBanner") return props;

  const buttonText = optionalString(props.primaryButtonText);
  const buttonLink = optionalString(props.primaryButtonLink);

  return {
    ...props,
    mainTitle: optionalString(props.title) ?? optionalString(props.mainTitle) ?? "",
    primaryButton: buttonText && buttonLink
      ? { enabled: true, openInNewTab: false, routePath: buttonLink, targetType: "INTERNAL_ROUTE", text: buttonText }
      : props.primaryButton,
    subTitle: optionalString(props.subtitle) ?? optionalString(props.subTitle) ?? "",
  };
}

function decodePortalBindingData(value: unknown): JsonObject | undefined {
  if (value === undefined || value === null) return undefined;

  if (Array.isArray(value)) {
    return { items: value.map(decodeJsonValue) };
  }

  return decodeJsonObject(value);
}

function decodePageSeo(value: unknown): PageSeo {
  const record = requiredRecord(value);
  const keywords = record.keywords;

  if (keywords !== undefined && (!Array.isArray(keywords) || !keywords.every((item) => typeof item === "string"))) {
    throw new Error("Expected SEO keywords to be strings.");
  }

  return {
    description: optionalString(record.description),
    keywords: keywords ?? [],
    title: optionalString(record.title),
  };
}

function decodeJsonObject(value: unknown): JsonObject {
  const record = requiredRecord(value);
  const result: JsonObject = {};

  for (const [key, item] of Object.entries(record)) {
    result[key] = decodeJsonValue(item);
  }

  return result;
}

function decodeOptionalJsonObject(value: unknown): JsonObject {
  return value === undefined || value === null ? {} : decodeJsonObject(value);
}

function decodeJsonValue(value: unknown): JsonValue {
  if (typeof value === "string") return resolvePortalMediaUrl(value);

  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) return value.map(decodeJsonValue);
  return decodeJsonObject(value);
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected an object.");
  return value;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string") throw new Error("Expected a string.");
  return value;
}

function requiredNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Expected a number.");
  return value;
}

function requiredBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Expected a boolean.");
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalPortalMediaUrl(value: unknown): string | undefined {
  const url = optionalString(value);
  return url === undefined ? undefined : resolvePortalMediaUrl(url);
}

function resolvePortalMediaUrl(value: string): string {
  if (!value.startsWith("/media/")) return value;

  return new URL(value, `${getPortalApiBaseUrl()}/`).toString();
}

function isNavigationTargetType(
  value: string,
): value is NavigationMenuViewModel["targetType"] {
  return value === "EXTERNAL_LINK" || value === "GROUP" || value === "INTERNAL_ROUTE" || value === "PAGE_ANCHOR";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
