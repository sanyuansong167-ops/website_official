"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { getSafePortalMediaUrl } from "@/lib/portal-media-url";
import type { ProductDetailViewModel } from "@/types/portal";
import styles from "./ProductDetailPage.module.css";

export function ProductDetailPage({ product }: Readonly<{ product: ProductDetailViewModel }>) {
  const coverUrl = getSafePortalMediaUrl(product.coverUrl);
  const logoUrl = getSafePortalMediaUrl(product.logoUrl);

  return (
    <Container as="main" className={styles.productDetail}>
      <Link className={styles.backLink} href="/products">返回产品矩阵</Link>
      <article>
        <header className={styles.header} data-has-logo={Boolean(logoUrl)}>
          {logoUrl ? <ProductLogo alt={`${product.title}产品标识`} src={logoUrl} /> : null}
          <div className={styles.headerContent}>
            <p className={styles.status}>{getProductStatusLabel(product.status)}</p>
            <h1>{product.title}</h1>
            <p>{product.description}</p>
          </div>
        </header>
        {coverUrl ? <ProductCover alt={`${product.title}封面`} src={coverUrl} /> : null}
      </article>
    </Container>
  );
}

function ProductLogo({ alt, src }: Readonly<{ alt: string; src: string }>) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (failedSrc === src) {
    return <div aria-label={`${alt}（图片暂不可用）`} className={styles.logoFallback} role="img">图片暂不可用</div>;
  }

  return (
    <div className={styles.logo}>
      <Image alt={alt} fill onError={() => setFailedSrc(src)} sizes="6rem" src={src} unoptimized />
    </div>
  );
}

function ProductCover({ alt, src }: Readonly<{ alt: string; src: string }>) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (failedSrc === src) {
    return <div aria-label={`${alt}（图片暂不可用）`} className={styles.coverFallback} role="img">图片暂不可用</div>;
  }

  return (
    <div className={styles.cover}>
      <Image alt={alt} fill onError={() => setFailedSrc(src)} priority sizes="(max-width: 1199px) 100vw, 72rem" src={src} unoptimized />
    </div>
  );
}

function getProductStatusLabel(status: string) {
  if (status === "PUBLISHED" || status === "已发布") return "已发布产品";
  if (status === "COMING_SOON" || status === "即将发布") return "即将发布";
  return "产品信息";
}
