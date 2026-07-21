import Link from "next/link";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { NavigationMenuViewModel } from "@/types/portal";

type SiteNavigationLinkProps = {
  className?: string;
  menu: NavigationMenuViewModel;
  onNavigate?: () => void;
};

export function SiteNavigationLink({ className, menu, onNavigate }: Readonly<SiteNavigationLinkProps>) {
  const target = getNavigationTarget(menu);
  if (!target) return <span className={className}>{menu.menuName}</span>;

  if (target.kind === "external") {
    return (
      <a
        className={className}
        href={target.href}
        onClick={onNavigate}
        rel={target.openInNewTab ? "noopener noreferrer" : undefined}
        target={target.openInNewTab ? "_blank" : undefined}
      >
        {menu.menuName}
      </a>
    );
  }

  return (
    <Link className={className} href={target.href} onClick={onNavigate}>
      {menu.menuName}
    </Link>
  );
}
