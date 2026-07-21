export type ContactInfoViewModel = {
  businessPhone: string;
  contactAddress: string;
  contactEmail: string;
};

export type CreateLeadRequest = {
  company: string;
  demandDescription?: string;
  email: string;
  name: string;
  phone?: string;
};

export type NavigationMenuViewModel = {
  anchorCode?: string;
  children: NavigationMenuViewModel[];
  externalUrl?: string;
  id: number;
  menuName: string;
  openInNewTab: boolean;
  routePath?: string;
  targetType: "EXTERNAL_LINK" | "GROUP" | "INTERNAL_ROUTE" | "PAGE_ANCHOR";
};

export type PortalChromeViewModel = {
  contact: ContactInfoViewModel | null;
  navigation: NavigationMenuViewModel[];
  site: SiteConfigViewModel | null;
};

export type ProductDetailViewModel = {
  coverUrl?: string;
  description: string;
  id: number;
  logoUrl?: string;
  seoDescription?: string;
  seoTitle?: string;
  status: string;
  title: string;
};

export type CaseDetailViewModel = {
  background?: string;
  coverUrl?: string;
  customerName?: string;
  id: number;
  industry?: string;
  logoUrl?: string;
  result?: string;
  seoDescription?: string;
  seoTitle?: string;
  solution?: string;
  status: string;
  title: string;
};

export type IndustrySolutionDetailViewModel = {
  customerTags: string[];
  description: string;
  iconUrl?: string;
  id: number;
  name: string;
};

export type SiteConfigViewModel = {
  brandSlogan: string;
  brandTagline: string;
  filingNumber?: string;
  filingUrl?: string;
  logoDarkUrl?: string;
  logoLightUrl?: string;
  privacyPolicyPath?: string;
  seoDescription: string;
  seoKeywords: string;
  siteTitle: string;
  termsOfServicePath?: string;
};
