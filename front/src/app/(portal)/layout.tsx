import type { ReactNode } from "react";
import { PortalChrome } from "@/components/layout/PortalChrome";
import { getPortalChrome } from "@/services/portal-api";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: Readonly<{ children: ReactNode }>) {
  const chrome = await getPortalChrome();

  return <PortalChrome chrome={chrome}>{children}</PortalChrome>;
}
