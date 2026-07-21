import type { ReactNode } from "react";
import type { PortalChromeViewModel } from "@/types/portal";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type PortalChromeProps = {
  children: ReactNode;
  chrome: PortalChromeViewModel;
};

export function PortalChrome({ children, chrome }: Readonly<PortalChromeProps>) {
  return (
    <>
      <SiteHeader navigation={chrome.navigation} site={chrome.site} />
      {children}
      <SiteFooter contact={chrome.contact} navigation={chrome.navigation} site={chrome.site} />
    </>
  );
}
