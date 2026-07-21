import Link from "next/link";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { NavigationTarget } from "@/lib/navigation-target";
import type { JsonValue } from "@/types/page-builder";

export type ControlledAction = {
  target: NavigationTarget;
  text: string;
};

export function ControlledActionLink({
  action,
  className,
}: Readonly<{
  action: ControlledAction;
  className: string;
}>) {
  if (action.target.kind === "external") {
    return (
      <a
        className={className}
        href={action.target.href}
        rel={action.target.openInNewTab ? "noopener noreferrer" : undefined}
        target={action.target.openInNewTab ? "_blank" : undefined}
      >
        {action.text}
      </a>
    );
  }

  return <Link className={className} href={action.target.href}>{action.text}</Link>;
}

export function decodeControlledAction(value: JsonValue | undefined): ControlledAction | null {
  if (!isJsonObject(value) || value.enabled !== true) return null;

  const text = getString(value.text);
  const targetType = value.targetType;
  const openInNewTab = value.openInNewTab;
  if (!text || typeof targetType !== "string" || typeof openInNewTab !== "boolean") return null;
  if (targetType !== "EXTERNAL_LINK" && targetType !== "INTERNAL_ROUTE" && targetType !== "PAGE_ANCHOR") {
    return null;
  }

  const target = getNavigationTarget({
    anchorCode: getString(value.anchorCode),
    externalUrl: getString(value.externalUrl),
    openInNewTab,
    routePath: getString(value.routePath),
    targetType,
  });

  return target ? { target, text } : null;
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isJsonObject(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
