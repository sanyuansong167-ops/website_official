import Image from "next/image";
import Link from "next/link";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { ControlledSection, JsonObject, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./ListingGridBlock.module.css";

export type ListingGridKind = "case" | "product" | "solution";

type ListingCard = {
  actionLabel: string;
  altText: string;
  href?: string;
  id: number;
  imageUrl?: string;
  summary?: string;
  tags: string[];
  title: string;
};

export function ListingGridBlock({
  kind,
  mode,
  section,
}: Readonly<{
  kind: ListingGridKind;
  mode: RenderMode;
  section: ControlledSection;
}>) {
  const title = getString(section.props.title) ?? getDefaultTitle(kind);
  const summary = getString(section.props.summary);
  const emptyStateText = getString(section.props.emptyStateText) ?? "暂无可展示内容";
  const status = getString(section.data?.status);
  const items = decodeItems(section.data, kind);
  const issues = mode === "editor" ? getStringList(section.data?.issues) : [];
  const layout = getLayout(section.style.layout);
  const spacing = getSpacing(section.style.spacing);
  const theme = getTheme(section.style.theme);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.listingGridBlock}
      data-layout={layout}
      data-spacing={spacing}
      data-theme={theme}
    >
      <div className={styles.inner}>
        <header className={styles.heading}>
          <h2 id={`${section.id}-title`}>{title}</h2>
          {summary ? <p>{summary}</p> : null}
        </header>

        {status === "loading" ? <p className={styles.state} role="status">正在加载绑定内容…</p> : null}
        {status === "error" ? (
          <p className={styles.error} role="alert">
            {mode === "editor" ? getString(section.data?.message) ?? "绑定内容加载失败。" : emptyStateText}
          </p>
        ) : null}
        {issues.length > 0 ? (
          <ul className={styles.issueList}>
            {issues.map((issue) => <li key={issue} role="alert">{issue}</li>)}
          </ul>
        ) : null}
        {status !== "loading" && status !== "error" && items.length === 0 ? (
          <p className={styles.state}>{emptyStateText}</p>
        ) : null}
        {items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((item) => (
              <article className={styles.card} key={item.id}>
                {item.imageUrl ? (
                  <span className={styles.media}>
                    <Image
                      alt={item.altText}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                      src={item.imageUrl}
                      unoptimized
                    />
                  </span>
                ) : (
                  <span aria-hidden="true" className={styles.placeholder}>{item.title.slice(0, 1)}</span>
                )}
                <div className={styles.cardBody}>
                  {item.tags.length > 0 ? (
                    <ul aria-label="内容标签" className={styles.tags}>
                      {item.tags.slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}
                    </ul>
                  ) : null}
                  <h3>{item.title}</h3>
                  {item.summary ? <p>{item.summary}</p> : null}
                  {item.href ? <Link href={item.href}>{item.actionLabel}</Link> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function decodeItems(data: JsonObject | undefined, kind: ListingGridKind) {
  const value = data?.items ?? data?.list;
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => decodeItem(item, kind))
    .filter((item): item is ListingCard => item !== null)
    .slice(0, 12);
}

function decodeItem(value: JsonValue, kind: ListingGridKind): ListingCard | null {
  if (!isJsonObject(value)) return null;
  const id = getPositiveInteger(value.id);
  const title = getString(value.title) ?? getString(value.name);
  if (!id || !title) return null;

  const imageUrl = getSafeImageUrl(
    getString(value.thumbnailUrl) ??
    getString(value.logoUrl) ??
    getString(value.iconUrl) ??
    getNestedString(value.logo, "url"),
  );
  const summary = getString(value.summary) ?? getString(value.abstractText) ??
    getString(value.description) ?? getString(value.subTitle);
  const routePath = getString(value.routePath) ?? getString(value.detailLink) ?? getDefaultDetailRoute(kind, id);
  const target = getNavigationTarget({
    openInNewTab: false,
    routePath,
    targetType: "INTERNAL_ROUTE",
  });
  const href = target?.kind === "internal" ? target.href : undefined;

  return {
    actionLabel: "查看详情",
    altText: getString(value.altText) ?? getString(value.imageAlt) ?? `${title}${getKindLabel(kind)}图片`,
    href,
    id,
    imageUrl,
    summary,
    tags: getItemTags(value, kind),
    title,
  };
}

function getDefaultDetailRoute(kind: ListingGridKind, id: number) {
  if (kind === "case") return `/cases/${id}`;
  if (kind === "solution") return `/solutions/${id}`;
  return `/products/${id}`;
}

function getItemTags(value: JsonObject, kind: ListingGridKind) {
  const tags = getStringList(value.tags);
  if (tags.length > 0) return tags;
  if (kind === "case") return getStringList(value.keywords);
  if (kind === "solution") return getStringList(value.customerTags);
  const statusTag = getString(value.statusTag) ?? (kind === "product" ? getProductStatusLabel(getString(value.status)) : undefined);
  return statusTag ? [statusTag] : [];
}

function getProductStatusLabel(status: string | undefined) {
  if (status === "PUBLISHED") return "已发布";
  if (status === "COMING_SOON") return "即将发布";
  return status ? "其他状态" : undefined;
}

function getSafeImageUrl(value?: string) {
  if (!value) return undefined;
  const internal = getNavigationTarget({ openInNewTab: false, routePath: value, targetType: "INTERNAL_ROUTE" });
  if (internal) return internal.href;
  const external = getNavigationTarget({ externalUrl: value, openInNewTab: false, targetType: "EXTERNAL_LINK" });
  return external?.kind === "external" ? external.href : undefined;
}

function getNestedString(value: JsonValue | undefined, key: string) {
  return isJsonObject(value) ? getString(value[key]) : undefined;
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getStringList(value: JsonValue | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim())
    : [];
}

function getPositiveInteger(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getLayout(value: JsonValue | undefined) {
  return value === "two-columns" || value === "featured" ? value : "three-columns";
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}

function getTheme(value: JsonValue | undefined) {
  return value === "dark" ? value : "light";
}

function getDefaultTitle(kind: ListingGridKind) {
  if (kind === "case") return "客户案例";
  if (kind === "solution") return "行业解决方案";
  return "产品矩阵";
}

function getKindLabel(kind: ListingGridKind) {
  if (kind === "case") return "案例";
  if (kind === "solution") return "方案";
  return "产品";
}
