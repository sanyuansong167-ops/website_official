import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalPage } from "@/features/portal-page/PortalPage";
import { getPortalPageMetadata } from "@/features/portal-page/portal-page-metadata";
import { getPortalRouteFromSegments } from "@/lib/site-routes";

type PortalRoutePageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Readonly<PortalRoutePageProps>): Promise<Metadata> {
  const routePath = getPortalRouteFromSegments((await params).slug);
  return routePath ? getPortalPageMetadata(routePath) : {};
}

export default async function PortalRoutePage({ params }: Readonly<PortalRoutePageProps>) {
  const routePath = getPortalRouteFromSegments((await params).slug);

  if (!routePath) notFound();

  return <PortalPage routePath={routePath} />;
}
