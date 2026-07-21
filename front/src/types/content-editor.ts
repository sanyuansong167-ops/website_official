import type { JsonObject } from "@/types/page-builder";

export type ContentResourceKind = "case" | "product" | "solution";

export type ContentResourceType = "CASE" | "INDUSTRY_SOLUTION" | "PRODUCT";

export type ContentEditorLock = {
  acquiredAt: string;
  editable: boolean;
  expiresAt: string;
  forceUnlockAllowed: boolean;
  heartbeatIntervalSeconds: number;
  lockToken?: string;
  ownerDisplayName: string;
  resourceId: number;
  resourceType: ContentResourceType;
};

export type ContentLockConflict = {
  expiresAt?: string;
  forceUnlockAllowed: boolean;
  ownerDisplayName?: string;
};

export type ContentForceReleaseResult = {
  auditId: number;
  releasedAt: string;
};

export type ContentDraft = {
  draft: JsonObject;
  draftHash?: string;
  id: number;
  updatedAt: string;
  version: number;
};
