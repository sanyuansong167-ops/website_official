import { getAdminApiBaseUrl } from "@/lib/environment";
import { homeBlockTemplates, isHomeBlockType } from "@/lib/home-page-template";
import { ApiError, requestApi } from "@/services/http";
import type {
  AdminSession,
  CsrfToken,
  PageDefinition,
  PageLock,
  PageLockConflict,
} from "@/types/admin";
import type {
  ComponentTemplate,
  ControlledSection,
  ForceReleaseResult,
  JsonObject,
  JsonValue,
  PageDraft,
  PageSchema,
  PageSeo,
  PageSlot,
  PageVersion,
  PreviewSession,
} from "@/types/page-builder";

type ServerRequestContext = {
  cookie: string;
};

type SavePageDraftInput = {
  csrf: CsrfToken;
  editorSessionRemark: string;
  lockToken: string;
  pageId: number;
  schemaJson: PageSchema;
  version: number;
};

export function getCurrentAdmin(context: ServerRequestContext) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeAdminSession,
    init: serverGetInit(context),
    path: "/admin/api/auth/me",
  });
}

export function loginAdmin(username: string, password: string, csrf: CsrfToken) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeAdminSession,
    init: clientRequestInit("POST", csrf, { password, username }),
    path: "/admin/api/auth/login",
  });
}

export function getPageDefinitions(context: ServerRequestContext) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageDefinitionList,
    init: serverGetInit(context),
    path: "/admin/api/page-builder/pages",
  });
}

export function getPageDraft(pageId: number) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageDraft,
    init: clientRequestInit("GET"),
    path: `/admin/api/page-builder/drafts/${encodeURIComponent(String(pageId))}`,
  });
}

export function getComponentTemplate(componentCode: string) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeComponentTemplate,
    init: clientRequestInit("GET"),
    path: `/admin/api/page-builder/component-templates/${encodeURIComponent(normalizeServerComponent(componentCode))}`,
  });
}

export function savePageDraft({
  csrf,
  editorSessionRemark,
  lockToken,
  pageId,
  schemaJson,
  version,
}: SavePageDraftInput) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageDraft,
    init: clientRequestInit(
      "PUT",
      csrf,
      {
        editorSessionRemark,
        schemaJson: encodePageSchema(schemaJson),
        version,
      },
      lockToken,
    ),
    path: `/admin/api/page-builder/drafts/${encodeURIComponent(String(pageId))}`,
  });
}

export function createPagePreview(
  pageId: number,
  csrf: CsrfToken,
  lockToken: string,
  schemaHash: string,
) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePreviewSession,
    init: clientRequestInit("POST", csrf, { schemaHash }, lockToken),
    path: `/admin/api/page-builder/drafts/${encodeURIComponent(String(pageId))}/previews`,
  });
}

export function publishPage(
  pageId: number,
  csrf: CsrfToken,
  lockToken: string,
  version: number,
  changeSummary: string,
) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageVersion,
    init: clientRequestInit("POST", csrf, { changeSummary, version }, lockToken),
    path: `/admin/api/page-builder/pages/${encodeURIComponent(String(pageId))}/publish`,
  });
}

export function getPageVersions(pageId: number, pageNo = 1, pageSize = 20) {
  const query = new URLSearchParams({
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageVersionList,
    init: clientRequestInit("GET"),
    path: `/admin/api/page-builder/pages/${encodeURIComponent(String(pageId))}/versions?${query}`,
  });
}

export function rollbackPage(
  pageId: number,
  csrf: CsrfToken,
  lockToken: string,
  versionId: number,
  version: number,
  changeSummary: string,
) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageVersion,
    init: clientRequestInit(
      "POST",
      csrf,
      { changeSummary, version, versionId },
      lockToken,
    ),
    path: `/admin/api/page-builder/pages/${encodeURIComponent(String(pageId))}/rollback`,
  });
}

export function forceReleasePageLock(pageId: number, csrf: CsrfToken, reason: string) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeForceReleaseResult,
    init: clientRequestInit("POST", csrf, { reason }),
    path: `/admin/api/page-builder/pages/${encodeURIComponent(String(pageId))}/lock/force-release`,
  });
}

export function getCsrfToken() {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeCsrfToken,
    init: clientRequestInit("GET"),
    path: "/admin/api/auth/csrf",
  });
}

export function acquirePageLock(pageId: number, csrf: CsrfToken) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageLock,
    init: clientRequestInit("POST", csrf, {
      editorSessionRemark: "官网可视化编辑器",
    }),
    path: `/admin/api/page-builder/pages/${encodeURIComponent(String(pageId))}/lock`,
  });
}

export function heartbeatPageLock(pageId: number, csrf: CsrfToken, lockToken: string) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodePageLock,
    init: clientRequestInit("POST", csrf, undefined, lockToken),
    path: `/admin/api/page-builder/pages/${encodeURIComponent(String(pageId))}/lock/heartbeat`,
  });
}

export function releasePageLock(pageId: number, csrf: CsrfToken, lockToken: string) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeNull,
    init: {
      ...clientRequestInit("DELETE", csrf, undefined, lockToken),
      keepalive: true,
    },
    path: `/admin/api/page-builder/pages/${encodeURIComponent(String(pageId))}/lock`,
  });
}

export function getPageLockConflict(error: unknown): PageLockConflict | null {
  if (!(error instanceof ApiError) || error.kind !== "conflict") {
    return null;
  }

  const details = isRecord(error.details) ? error.details : {};

  return {
    expiresAt: optionalString(details.expiresAt),
    forceUnlockAllowed: optionalBoolean(details.forceUnlockAllowed) ?? false,
    ownerDisplayName: optionalString(details.ownerDisplayName),
  };
}

function serverGetInit({ cookie }: ServerRequestContext): RequestInit {
  return {
    cache: "no-store",
    credentials: "include",
    headers: cookie ? { Cookie: cookie } : undefined,
    method: "GET",
  };
}

function clientRequestInit(
  method: "DELETE" | "GET" | "POST" | "PUT",
  csrf?: CsrfToken,
  body?: object,
  lockToken?: string,
): RequestInit {
  const headers: Record<string, string> = {};

  if (csrf) {
    headers[csrf.headerName] = csrf.token;
  }

  if (lockToken) {
    headers["X-Editor-Lock-Token"] = lockToken;
  }

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  return {
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    credentials: "include",
    headers,
    method,
  };
}

function decodeAdminSession(value: unknown): AdminSession {
  const record = requiredRecord(value);

  return {
    displayName: requiredString(record.displayName),
    roleCode: requiredString(record.roleCode),
    userId: requiredNumber(record.userId),
    username: requiredString(record.username),
  };
}

function decodeCsrfToken(value: unknown): CsrfToken {
  const record = requiredRecord(value);

  return {
    headerName: requiredString(record.headerName),
    parameterName: requiredString(record.parameterName),
    token: requiredString(record.token),
  };
}

function decodePageDefinitionList(value: unknown): PageDefinition[] {
  if (!Array.isArray(value)) throw new Error("Expected a page definition list.");
  return value.map(decodePageDefinition);
}

function decodePageDefinition(value: unknown): PageDefinition {
  const record = requiredRecord(value);
  const status = requiredString(record.status);

  if (status !== "ENABLED" && status !== "DISABLED") {
    throw new Error("Unexpected page status.");
  }

  return {
    id: requiredNumber(record.id),
    name: requiredString(record.name),
    pageKey: requiredString(record.pageKey),
    pageType: requiredString(record.pageType),
    routePath: requiredString(record.routePath),
    sortOrder: requiredNumber(record.sortOrder),
    status,
    version: requiredNumber(record.version),
    visible: requiredBoolean(record.visible),
  };
}

function decodePageLock(value: unknown): PageLock {
  const record = requiredRecord(value);
  const resourceType = requiredString(record.resourceType);

  if (resourceType !== "PAGE") throw new Error("Unexpected lock resource type.");

  return {
    acquiredAt: requiredString(record.acquiredAt),
    editable: requiredBoolean(record.editable),
    expiresAt: requiredString(record.expiresAt),
    forceUnlockAllowed: requiredBoolean(record.forceUnlockAllowed),
    heartbeatIntervalSeconds: requiredNumber(record.heartbeatIntervalSeconds),
    lockToken: optionalString(record.lockToken),
    ownerDisplayName: requiredString(record.ownerDisplayName),
    resourceId: requiredNumber(record.resourceId),
    resourceType,
  };
}

function decodePageDraft(value: unknown): PageDraft {
  const record = requiredRecord(value);

  return {
    editorSessionRemark: optionalString(record.editorSessionRemark),
    id: requiredNumber(record.id),
    pageId: requiredNumber(record.pageId),
    schemaHash: optionalString(record.schemaHash),
    schemaJson: record.schemaJson === null ? null : decodePageSchema(record.schemaJson),
    updatedAt: requiredString(record.updatedAt),
    version: requiredNumber(record.version),
  };
}

function decodeComponentTemplate(value: unknown): ComponentTemplate {
  const record = requiredRecord(value);

  return {
    bindingCapabilityJson: decodeJsonObject(record.bindingCapabilityJson),
    category: requiredString(record.category),
    componentCode: normalizeEditorComponent(requiredString(record.componentCode)),
    defaultPropsJson: decodeJsonObject(record.defaultPropsJson),
    id: requiredNumber(record.id),
    name: requiredString(record.name),
    schemaDefinitionJson: decodeJsonObject(record.schemaDefinitionJson),
    sortOrder: requiredNumber(record.sortOrder),
    status: requiredString(record.status),
    version: requiredNumber(record.version),
  };
}

function decodePreviewSession(value: unknown): PreviewSession {
  const record = requiredRecord(value);

  return {
    expiresAt: requiredString(record.expiresAt),
    previewToken: requiredString(record.previewToken),
    previewUrl: requiredString(record.previewUrl),
  };
}

function decodePageVersionList(value: unknown): PageVersion[] {
  const list = Array.isArray(value) ? value : requiredRecord(value).list;
  if (!Array.isArray(list)) throw new Error("Expected a page version list.");
  return list.map(decodePageVersion);
}

function decodePageVersion(value: unknown): PageVersion {
  const record = requiredRecord(value);

  return {
    changeSummary: optionalString(record.changeSummary),
    createdAt: optionalString(record.createdAt),
    id: requiredNumber(record.id),
    pageId: requiredNumber(record.pageId),
    schemaHash: optionalString(record.schemaHash),
    sourceType: requiredString(record.sourceType),
    version: optionalNumber(record.version),
    versionNo: requiredNumber(record.versionNo),
  };
}

function decodeForceReleaseResult(value: unknown): ForceReleaseResult {
  const record = requiredRecord(value);

  return {
    auditId: requiredNumber(record.auditId),
    releasedAt: requiredString(record.releasedAt),
  };
}

function decodePageSchema(value: unknown): PageSchema {
  const record = requiredRecord(value);
  const sections = record.sections;

  if (!Array.isArray(sections)) throw new Error("Expected a section list.");

  return {
    layout: decodeJsonObject(record.layout),
    name: optionalString(record.name),
    pageKey: optionalString(record.pageKey),
    sections: sections.map(decodeControlledSection),
    seo: decodePageSeo(record.seo),
  };
}

function decodeControlledSection(value: unknown, sortOrder: number): ControlledSection {
  const record = requiredRecord(value);
  const serverComponent = requiredString(record.component);
  const component = normalizeEditorComponent(serverComponent);
  const defaults = getEditorSectionDefaults(component);
  const dataBinding = record.dataBinding ?? record.binding;

  return {
    component,
    dataBinding: decodeEditorDataBinding(component, dataBinding, record.props) ?? defaults.dataBinding,
    id: requiredString(record.id),
    props: { ...defaults.props, ...decodeEditorProps(serverComponent, record.props) },
    slot: decodePageSlot(record.slot),
    sortOrder: optionalNumber(record.sortOrder) ?? sortOrder,
    style: {
      ...defaults.style,
      ...(record.style === undefined || record.style === null ? {} : decodeJsonObject(record.style)),
    },
    visible: optionalBoolean(record.visible) ?? true,
  };
}

function encodePageSchema(schema: PageSchema): JsonObject {
  return {
    ...(schema.name ? { name: schema.name } : {}),
    ...(schema.pageKey ? { pageKey: schema.pageKey } : {}),
    layout: schema.layout,
    sections: schema.sections.map(({ component, dataBinding, id, props, style, visible }) => ({
      ...(encodeServerBinding(dataBinding) ? { binding: encodeServerBinding(dataBinding) } : {}),
      component: normalizeServerComponent(component),
      id,
      props: encodeServerProps(component, props, dataBinding),
      style,
      visible,
    })),
    seo: schema.seo,
  };
}

function normalizeEditorComponent(component: string) {
  const componentMap: Record<string, string> = {
    CaseGrid: "CaseGridSection",
    HeroBanner: "HeroSection",
    IndustrySolutionGrid: "SolutionGridSection",
    ProductGrid: "ProductGridSection",
  };

  return componentMap[component] ?? component;
}

function normalizeServerComponent(component: string) {
  const componentMap: Record<string, string> = {
    CaseGridSection: "CaseGrid",
    HeroSection: "HeroBanner",
    ProductGridSection: "ProductGrid",
    SolutionGridSection: "IndustrySolutionGrid",
  };

  return componentMap[component] ?? component;
}

function getEditorSectionDefaults(component: string) {
  if (!isHomeBlockType(component)) return { dataBinding: undefined, props: {}, style: {} };

  const template = homeBlockTemplates[component];
  return {
    dataBinding: template.defaultDataBinding ? decodeJsonObject(template.defaultDataBinding) : undefined,
    props: decodeJsonObject(template.defaultProps),
    style: decodeJsonObject(template.defaultStyle),
  };
}

function decodeEditorProps(component: string, value: unknown): JsonObject {
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

function decodeEditorDataBinding(
  component: string,
  value: unknown,
  propsValue: unknown,
): JsonObject | undefined {
  if (value === undefined || value === null) return undefined;

  const binding = decodeJsonObject(value);
  const query = binding.query === undefined || binding.query === null ? {} : decodeJsonObject(binding.query);
  const selectedIds = decodePositiveIdList(query.ids ?? query.id);
  const defaults = getEditorSectionDefaults(component).dataBinding;
  if (!defaults) return binding;

  const props = decodeJsonObject(propsValue);
  const defaultLimit = optionalNumber(defaults.limit) ?? 1;
  return {
    ...defaults,
    displayMode: selectedIds.length ? "MANUAL" : "AUTO",
    limit: optionalNumber(props.limit) ?? defaultLimit,
    selectedIds,
    source: normalizeEditorBindingSource(optionalString(binding.source)) ?? defaults.source,
  };
}

function encodeServerProps(component: string, props: JsonObject, dataBinding?: JsonObject): JsonObject {
  if (component !== "HeroSection") {
    return dataBinding && typeof dataBinding.limit === "number" ? { ...props, limit: dataBinding.limit } : props;
  }

  const { mainTitle, primaryButton, subTitle, ...legacyProps } = props;
  const button = isRecord(primaryButton) ? primaryButton : undefined;

  return {
    ...legacyProps,
    ...(typeof mainTitle === "string" ? { title: mainTitle } : {}),
    ...(typeof subTitle === "string" ? { subtitle: subTitle } : {}),
    ...(button?.enabled === true && typeof button.text === "string" && typeof button.routePath === "string"
      ? { primaryButtonLink: button.routePath, primaryButtonText: button.text }
      : {}),
  };
}

function encodeServerBinding(dataBinding?: JsonObject): JsonObject | undefined {
  if (!dataBinding) return undefined;

  const source = normalizeServerBindingSource(optionalString(dataBinding.source));
  if (!source) return undefined;

  const selectedIds = decodePositiveIdList(dataBinding.selectedIds);
  return {
    mode: "ENTITY",
    query: selectedIds.length ? { ids: selectedIds } : {},
    source,
  };
}

function normalizeEditorBindingSource(source?: string) {
  const sourceMap: Record<string, string> = {
    ai_card: "AI_CARD",
    capability: "CAPABILITY",
    case: "CASE",
    client_logo: "CLIENT_LOGO",
    contact_page: "CONTACT_PAGE",
    home_metric_card: "HOME_METRIC",
    honor: "HONOR",
    industry_solution: "INDUSTRY_SOLUTION",
    partner_university: "PARTNER_UNIVERSITY",
    product: "PRODUCT",
    promise_tag: "PROMISE",
    research_direction: "RESEARCH_DIRECTION",
    strength_metric: "STRENGTH_METRIC",
    timeline_event: "TIMELINE",
    value_card: "VALUE_CARD",
  };

  return source ? sourceMap[source.toLowerCase()] : undefined;
}

function normalizeServerBindingSource(source?: string) {
  const sourceMap: Record<string, string> = {
    AI_CARD: "ai_card",
    CAPABILITY: "capability",
    CASE: "case",
    CLIENT_LOGO: "client_logo",
    CONTACT_PAGE: "contact_page",
    HOME_METRIC: "home_metric_card",
    HONOR: "honor",
    INDUSTRY_SOLUTION: "industry_solution",
    PARTNER_UNIVERSITY: "partner_university",
    PRODUCT: "product",
    PROMISE: "promise_tag",
    RESEARCH_DIRECTION: "research_direction",
    STRENGTH_METRIC: "strength_metric",
    TIMELINE: "timeline_event",
    VALUE_CARD: "value_card",
  };

  return source ? sourceMap[source.toUpperCase()] : undefined;
}

function decodePositiveIdList(value: unknown): number[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.filter((item): item is number =>
    typeof item === "number" && Number.isSafeInteger(item) && item > 0,
  );
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

function decodePageSlot(value: unknown): PageSlot {
  if (value === undefined) return "main";
  if (value === "header" || value === "main" || value === "footer") return value;
  throw new Error("Unexpected page slot.");
}

function decodeJsonObject(value: unknown): JsonObject {
  const record = requiredRecord(value);
  const result: JsonObject = {};

  for (const [key, item] of Object.entries(record)) {
    result[key] = decodeJsonValue(item);
  }

  return result;
}

function decodeJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) return value.map(decodeJsonValue);
  return decodeJsonObject(value);
}

function decodeNull(value: unknown): null {
  if (value !== null) throw new Error("Expected an empty response.");
  return null;
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

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
