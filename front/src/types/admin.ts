export type AdminSession = {
  displayName: string;
  roleCode: string;
  userId: number;
  username: string;
};

export type CsrfToken = {
  headerName: string;
  parameterName: string;
  token: string;
};

export type PageDefinition = {
  id: number;
  name: string;
  pageKey: string;
  pageType: string;
  routePath: string;
  sortOrder: number;
  status: "DISABLED" | "ENABLED";
  version: number;
  visible: boolean;
};

export type PageLock = {
  acquiredAt: string;
  editable: boolean;
  expiresAt: string;
  forceUnlockAllowed: boolean;
  heartbeatIntervalSeconds: number;
  lockToken?: string;
  ownerDisplayName: string;
  resourceId: number;
  resourceType: "PAGE";
};

export type PageLockConflict = {
  expiresAt?: string;
  forceUnlockAllowed: boolean;
  ownerDisplayName?: string;
};
