"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { getSafePortalMediaUrl } from "@/lib/portal-media-url";
import type { CaseDetailViewModel } from "@/types/portal";
import styles from "./CaseDetailPage.module.css";

export function CaseDetailPage({ caseDetail }: Readonly<{ caseDetail: CaseDetailViewModel }>) {
  const coverUrl = getSafePortalMediaUrl(caseDetail.coverUrl);
  const logoUrl = getSafePortalMediaUrl(caseDetail.logoUrl);
  const overview = [
    { label: "客户", value: caseDetail.customerName },
    { label: "行业", value: caseDetail.industry },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  const sections = [
    { title: "项目背景", value: caseDetail.background },
    { title: "解决方案", value: caseDetail.solution },
    { title: "项目成果", value: caseDetail.result },
  ].filter((item): item is { title: string; value: string } => Boolean(item.value));

  return (
    <Container as="main" className={styles.caseDetail}>
      <Link className={styles.backLink} href="/cases">返回客户案例</Link>
      <article>
        <header className={styles.header} data-has-logo={Boolean(logoUrl)}>
          {logoUrl ? <CaseLogo alt={`${caseDetail.title}客户标识`} src={logoUrl} /> : null}
          <div>
            <p className={styles.status}>{getCaseStatusLabel(caseDetail.status)}</p>
            <h1>{caseDetail.title}</h1>
            {overview.length > 0 ? (
              <dl className={styles.overview}>
                {overview.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </header>
        {coverUrl ? <CaseCover alt={`${caseDetail.title}封面`} src={coverUrl} /> : null}
        {sections.length > 0 ? (
          <div className={styles.sections}>
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.value}</p>
              </section>
            ))}
          </div>
        ) : null}
      </article>
    </Container>
  );
}

function CaseLogo({ alt, src }: Readonly<{ alt: string; src: string }>) {
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

function CaseCover({ alt, src }: Readonly<{ alt: string; src: string }>) {
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

function getCaseStatusLabel(status: string) {
  return status === "PUBLISHED" || status === "已发布" ? "已发布案例" : "客户案例";
}
