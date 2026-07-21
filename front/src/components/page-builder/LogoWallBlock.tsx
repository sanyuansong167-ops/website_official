"use client";

import Image from "next/image";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { ControlledSection, JsonObject, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./LogoWallBlock.module.css";

type LogoWallItem = {
  description?: string;
  imageUrl?: string;
  industry?: string;
  key: string;
  name: string;
};

export function LogoWallBlock({ section }: Readonly<{ mode: RenderMode; section: ControlledSection }>) {
  const title = getString(section.props.title) ?? "客户与伙伴";
  const summary = getString(section.props.summary);
  const emptyStateText = getString(section.props.emptyStateText) ?? "暂无可展示内容";
  const displayMode = section.style.layout === "honor-grid" ? "honor-grid" : "logo-wall";
  const theme = section.style.theme === "dark" ? "dark" : "light";
  const spacing = getSpacing(section.style.spacing);
  const displayLimit = getPositiveNumber(section.props.displayLimit) ?? 12;
  const items = decodeItems(section.data).slice(0, displayLimit);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.logoWallBlock}
      data-display-mode={displayMode}
      data-spacing={spacing}
      data-theme={theme}
    >
      <Container>
        <header className={styles.heading}>
          <h2 id={`${section.id}-title`}>{title}</h2>
          {summary ? <p>{summary}</p> : null}
        </header>
        {items.length === 0 ? <p className={styles.state}>{emptyStateText}</p> : null}
        {items.length > 0 ? (
          <ul className={styles.grid} aria-label={title}>
            {items.map((item) => (
              <li className={styles.item} key={item.key}>
                {item.imageUrl ? (
                  <ItemImage alt={item.name} src={item.imageUrl} />
                ) : (
                  <span aria-hidden="true" className={styles.initial}>{item.name.slice(0, 1)}</span>
                )}
                <div>
                  <h3>{item.name}</h3>
                  {item.description ?? (displayMode === "logo-wall" ? item.industry : undefined) ? (
                    <p>{item.description ?? item.industry}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

function ItemImage({ alt, src }: Readonly<{ alt: string; src: string }>) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (failedSrc === src) {
    return <span aria-label={`${alt}（图片暂不可用）`} className={styles.imageFallback} role="img">图片暂不可用</span>;
  }

  return (
    <span className={styles.image}>
      <Image alt={alt} fill onError={() => setFailedSrc(src)} sizes="(max-width: 767px) 45vw, 12rem" src={src} unoptimized />
    </span>
  );
}

function decodeItems(data: JsonObject | undefined) {
  const value = data?.items ?? data?.list;
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index): LogoWallItem[] => {
    if (!isJsonObject(item)) return [];
    const name = getString(item.name);
    if (!name) return [];

    return [{
      description: getString(item.description) ?? getString(item.summary) ?? getString(item.fullName),
      imageUrl: getSafeImageUrl(item.logoUrl) ?? getSafeImageUrl(item.iconUrl),
      industry: getString(item.industry),
      key: getItemKey(item, index, name),
      name,
    }];
  });
}

function getSafeImageUrl(value: JsonValue | undefined) {
  const url = getString(value);
  if (!url) return undefined;

  const target = getNavigationTarget({ externalUrl: url, openInNewTab: false, targetType: "EXTERNAL_LINK" });
  return target?.kind === "external" ? target.href : undefined;
}

function getItemKey(item: JsonObject, index: number, fallback: string) {
  const id = item.id;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? String(id) : `${fallback}-${index}`;
}

function getPositiveNumber(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
