import type { Metadata } from "next";
import { getPortalPage } from "@/services/portal-api";
import type { PortalPageViewModel } from "@/types/page-builder";

export async function getPortalPageMetadata(routePath: string): Promise<Metadata> {
  try {
    return buildPortalPageMetadata(await getPortalPage(routePath));
  } catch {
    return {};
  }
}

export function buildPortalPageMetadata(page: PortalPageViewModel): Metadata {
  const title = page.schema.seo.title?.trim() || page.name.trim();
  const description = page.schema.seo.description?.trim();
  const keywords = page.schema.seo.keywords.map((keyword) => keyword.trim()).filter(Boolean);

  return {
    ...(description ? { description } : {}),
    ...(keywords.length ? { keywords } : {}),
    ...(title ? { title: { absolute: title } } : {}),
  };
}
