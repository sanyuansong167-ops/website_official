import type { Metadata } from "next";
import { PortalPage } from "@/features/portal-page/PortalPage";
import { getPortalPageMetadata } from "@/features/portal-page/portal-page-metadata";

export function generateMetadata(): Promise<Metadata> {
  return getPortalPageMetadata("/");
}

export default async function PortalHomePage() {
  return <PortalPage routePath="/" />;
}
