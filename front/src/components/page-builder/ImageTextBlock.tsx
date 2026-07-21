"use client";

import Image from "next/image";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import {
  ControlledActionLink,
  decodeControlledAction,
} from "@/components/page-builder/controlled-action";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { ControlledSection, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./ImageTextBlock.module.css";

export function ImageTextBlock({
  mode,
  section,
}: Readonly<{
  mode: RenderMode;
  section: ControlledSection;
}>) {
  const title = getString(section.props.title) ?? "图文介绍";
  const summary = getString(section.props.summary);
  const body = getString(section.props.body);
  const imageAlt = getString(section.props.imageAlt);
  const imageUrl = imageAlt ? getSafeImageUrl(section.props.imageUrl) : undefined;
  const action = decodeControlledAction(section.props.action);
  const layout = section.style.layout === "image-left" ? "image-left" : "image-right";
  const spacing = getSpacing(section.style.spacing);
  const theme = section.style.theme === "dark" ? "dark" : "light";
  const hasConfiguredMedia = Boolean(imageUrl && imageAlt);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.imageTextBlock}
      data-has-media={hasConfiguredMedia || mode === "editor" ? "true" : "false"}
      data-layout={layout}
      data-spacing={spacing}
      data-theme={theme}
    >
      <Container className={styles.inner}>
        <div className={styles.copy}>
          <h2 id={`${section.id}-title`}>{title}</h2>
          {summary ? <p className={styles.summary}>{summary}</p> : null}
          {body ? <p className={styles.body}>{body}</p> : null}
          {action ? <ControlledActionLink action={action} className={styles.action} /> : null}
        </div>

        {imageUrl && imageAlt ? (
          <ImageMedia alt={imageAlt} src={imageUrl} />
        ) : mode === "editor" ? (
          <div className={styles.mediaPlaceholder} role="status">
            {getString(section.props.imageUrl) && !imageAlt ? "请补充图片替代文本" : "请选择展示图片"}
          </div>
        ) : null}
      </Container>
    </section>
  );
}

function ImageMedia({ alt, src }: Readonly<{ alt: string; src: string }>) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (failedSrc === src) {
    return (
      <div aria-label={`${alt}（图片暂不可用）`} className={styles.mediaPlaceholder} role="img">
        图片暂不可用
      </div>
    );
  }

  return (
    <div className={styles.media}>
      <Image
        alt={alt}
        fill
        onError={() => setFailedSrc(src)}
        sizes="(max-width: 767px) 100vw, 50vw"
        src={src}
        unoptimized
      />
    </div>
  );
}

function getSafeImageUrl(value: JsonValue | undefined) {
  const url = getString(value);
  if (!url) return undefined;

  const internal = getNavigationTarget({ openInNewTab: false, routePath: url, targetType: "INTERNAL_ROUTE" });
  if (internal) return internal.href;
  const external = getNavigationTarget({ externalUrl: url, openInNewTab: false, targetType: "EXTERNAL_LINK" });
  return external?.kind === "external" ? external.href : undefined;
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}
