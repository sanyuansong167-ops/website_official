"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { NavigationMenuViewModel, SiteConfigViewModel } from "@/types/portal";
import { Container } from "./Container";
import { SiteNavigationLink } from "./SiteNavigationLink";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  navigation: NavigationMenuViewModel[];
  site: SiteConfigViewModel | null;
};

export function SiteHeader({ navigation, site }: Readonly<SiteHeaderProps>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const siteTitle = site?.siteTitle || "官网";
  const logoUrl = site?.logoLightUrl;

  useEffect(() => {
    if (!mobileOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      mobileToggleRef.current?.focus();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <header className={styles.siteHeader}>
      <Container className={styles.headerContent}>
        <Link aria-label={`${siteTitle}首页`} className={styles.brand} href="/">
          {logoUrl && !logoFailed ? (
            <Image
              alt={siteTitle}
              className={styles.logo}
              height={40}
              onError={() => setLogoFailed(true)}
              src={logoUrl}
              unoptimized
              width={160}
            />
          ) : (
            <span>{siteTitle}</span>
          )}
        </Link>

        <nav aria-label="主导航" className={styles.desktopNavigation}>
          <NavigationList currentPath={pathname} menus={navigation} />
        </nav>
        <Link className={styles.contactLink} href="/contact">
          预约交流
        </Link>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={mobileOpen}
          className={styles.mobileToggle}
          onClick={() => setMobileOpen((current) => !current)}
          ref={mobileToggleRef}
          type="button"
        >
          {mobileOpen ? "关闭菜单" : "打开菜单"}
        </button>
      </Container>

      {mobileOpen ? (
        <nav aria-label="移动端主导航" className={styles.mobileNavigation} id="mobile-navigation">
          <Container>
            <NavigationList currentPath={pathname} menus={navigation} onNavigate={() => setMobileOpen(false)} />
          </Container>
        </nav>
      ) : null}
    </header>
  );
}

type NavigationListProps = {
  currentPath: string;
  menus: NavigationMenuViewModel[];
  onNavigate?: () => void;
};

function NavigationList({ currentPath, menus, onNavigate }: Readonly<NavigationListProps>) {
  return (
    <ul className={styles.navigationList}>
      {menus.map((menu) => {
        const target = getNavigationTarget(menu);
        const hasChildren = menu.children.length > 0;
        const isCurrent = target?.kind === "internal" && target.href === currentPath;

        if (menu.targetType === "GROUP" && hasChildren) {
          return (
            <li key={menu.id}>
              <details className={styles.menuGroup}>
                <summary>{menu.menuName}</summary>
                <ul>
                  {menu.children.map((child) => (
                    <li key={child.id}>
                      <SiteNavigationLink menu={child} onNavigate={onNavigate} />
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        }

        return (
          <li key={menu.id}>
            <SiteNavigationLink
              className={isCurrent ? styles.currentLink : undefined}
              menu={menu}
              onNavigate={onNavigate}
            />
          </li>
        );
      })}
    </ul>
  );
}
