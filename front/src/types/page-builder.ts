export type RenderMode = "portal" | "preview" | "editor";

export type PageSlot = "footer" | "header" | "main";

export type JsonPrimitive = boolean | null | number | string;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export type ControlledSection = {
  component: string;
  data?: JsonObject;
  dataBinding?: JsonObject;
  id: string;
  props: JsonObject;
  slot: PageSlot;
  sortOrder: number;
  style: JsonObject;
  visible: boolean;
};

export type PageSeo = {
  description?: string;
  keywords: string[];
  title?: string;
};

export type PageSchema = {
  layout: JsonObject;
  name?: string;
  pageKey?: string;
  sections: ControlledSection[];
  seo: PageSeo;
};

export type PageDraft = {
  editorSessionRemark?: string;
  id: number;
  pageId: number;
  schemaHash?: string;
  schemaJson: PageSchema | null;
  updatedAt: string;
  version: number;
};

export type PageVersion = {
  changeSummary?: string;
  createdAt?: string;
  id: number;
  pageId: number;
  schemaHash?: string;
  sourceType: string;
  version?: number;
  versionNo: number;
};

export type ComponentTemplate = {
  bindingCapabilityJson: JsonObject;
  category: string;
  componentCode: string;
  defaultPropsJson: JsonObject;
  id: number;
  name: string;
  schemaDefinitionJson: JsonObject;
  sortOrder: number;
  status: string;
  version: number;
};

export type PortalPageViewModel = {
  name: string;
  pageKey: string;
  schema: PageSchema;
};

export type PreviewSession = {
  expiresAt: string;
  previewToken: string;
  previewUrl: string;
};

export type ForceReleaseResult = {
  auditId: number;
  releasedAt: string;
};
