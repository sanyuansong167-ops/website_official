import type { Metadata } from "next";
import { PortalPage } from "@/features/portal-page/PortalPage";
import { getPortalPageMetadata } from "@/features/portal-page/portal-page-metadata";

export function generateMetadata(): Promise<Metadata> {
  return getPortalPageMetadata("/contact");
}

export default function ContactRoute() {
  return <PortalPage routePath="/contact" />;
}
