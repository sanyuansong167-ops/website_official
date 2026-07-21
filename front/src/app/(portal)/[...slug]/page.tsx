import { notFound } from "next/navigation";
import { PortalPage } from "@/features/portal-page/PortalPage";
import { getPortalRouteFromSegments } from "@/lib/site-routes";

type PortalRoutePageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function PortalRoutePage({ params }: Readonly<PortalRoutePageProps>) {
  const routePath = getPortalRouteFromSegments((await params).slug);

  if (!routePath) notFound();

  return <PortalPage routePath={routePath} />;
}
