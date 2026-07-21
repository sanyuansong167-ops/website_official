import { Container } from "@/components/layout/Container";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { PortalChromeViewModel } from "@/types/portal";
import { SiteNavigationLink } from "./SiteNavigationLink";
import styles from "./SiteFooter.module.css";

type SiteFooterProps = Pick<PortalChromeViewModel, "contact" | "navigation" | "site">;

export function SiteFooter({ contact, navigation, site }: Readonly<SiteFooterProps>) {
  const siteTitle = site?.siteTitle || "官网";
  const description = site?.brandSlogan || site?.brandTagline;
  const quickLinks = navigation.filter((menu) => menu.targetType !== "GROUP");
  const navigationGroups = navigation.filter((menu) => menu.targetType === "GROUP" && menu.children.length > 0);
  const privacyTarget = getInternalTarget(site?.privacyPolicyPath);
  const termsTarget = getInternalTarget(site?.termsOfServicePath);
  const filingTarget = getExternalTarget(site?.filingUrl);

  return (
    <footer className={styles.siteFooter}>
      <Container className={styles.footerContent}>
        <section>
          <h2>{siteTitle}</h2>
          {description ? <p>{description}</p> : null}
        </section>
        {quickLinks.length > 0 ? (
          <section>
            <h2>快捷导航</h2>
            <ul>
              {quickLinks.map((menu) => (
                <li key={menu.id}>
                  <SiteNavigationLink menu={menu} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {navigationGroups.map((group) => (
          <section key={group.id}>
            <h2>{group.menuName}</h2>
            <ul>
              {group.children.map((menu) => (
                <li key={menu.id}>
                  <SiteNavigationLink menu={menu} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {contact ? (
          <section>
            <h2>联系我们</h2>
            <ul>
              {contact.businessPhone ? <li>{contact.businessPhone}</li> : null}
              {contact.contactEmail ? <li>{contact.contactEmail}</li> : null}
              {contact.contactAddress ? <li>{contact.contactAddress}</li> : null}
            </ul>
          </section>
        ) : null}
      </Container>
      <Container className={styles.footerMeta}>
        <p>© {new Date().getFullYear()} {siteTitle}</p>
        {privacyTarget || termsTarget || site?.filingNumber ? (
          <nav aria-label="页脚法务信息">
            <ul>
              {privacyTarget ? <li><a href={privacyTarget}>隐私政策</a></li> : null}
              {termsTarget ? <li><a href={termsTarget}>服务条款</a></li> : null}
              {site?.filingNumber ? (
                <li>
                  {filingTarget ? (
                    <a href={filingTarget} rel="noopener noreferrer" target="_blank">{site.filingNumber}</a>
                  ) : <span>{site.filingNumber}</span>}
                </li>
              ) : null}
            </ul>
          </nav>
        ) : null}
      </Container>
    </footer>
  );
}

function getInternalTarget(routePath: string | undefined) {
  if (!routePath) return undefined;
  const target = getNavigationTarget({ openInNewTab: false, routePath, targetType: "INTERNAL_ROUTE" });
  return target?.kind === "internal" ? target.href : undefined;
}

function getExternalTarget(externalUrl: string | undefined) {
  if (!externalUrl) return undefined;
  const target = getNavigationTarget({ externalUrl, openInNewTab: true, targetType: "EXTERNAL_LINK" });
  return target?.kind === "external" ? target.href : undefined;
}
