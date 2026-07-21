"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { getSafePortalMediaUrl } from "@/lib/portal-media-url";
import type { IndustrySolutionDetailViewModel } from "@/types/portal";
import styles from "./IndustrySolutionDetailPage.module.css";

export function IndustrySolutionDetailPage({
  solution,
}: Readonly<{ solution: IndustrySolutionDetailViewModel }>) {
  const iconUrl = getSafePortalMediaUrl(solution.iconUrl);

  return (
    <Container as="main" className={styles.solutionDetail}>
      <Link className={styles.backLink} href="/solutions">返回解决方案</Link>
      <article>
        <header className={styles.header} data-has-icon={Boolean(iconUrl)}>
          {iconUrl ? <SolutionIcon alt={`${solution.name}图标`} src={iconUrl} /> : null}
          <div>
            <p className={styles.eyebrow}>行业解决方案</p>
            <h1>{solution.name}</h1>
            <p>{solution.description}</p>
          </div>
        </header>
        {solution.customerTags.length > 0 ? (
          <section aria-labelledby="solution-customers-title" className={styles.customers}>
            <h2 id="solution-customers-title">适用客户</h2>
            <ul>
              {solution.customerTags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          </section>
        ) : null}
        <section aria-labelledby="solution-contact-title" className={styles.contact}>
          <div>
            <h2 id="solution-contact-title">需要进一步了解实施路径？</h2>
            <p>联系我们，结合您的业务场景进一步交流。</p>
          </div>
          <Link href={`/contact?direction=${encodeURIComponent(solution.name)}`}>咨询方案</Link>
        </section>
      </article>
    </Container>
  );
}

function SolutionIcon({ alt, src }: Readonly<{ alt: string; src: string }>) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (failedSrc === src) {
    return <div aria-label={`${alt}（图片暂不可用）`} className={styles.iconFallback} role="img">图片暂不可用</div>;
  }

  return (
    <div className={styles.icon}>
      <Image alt={alt} fill onError={() => setFailedSrc(src)} sizes="6rem" src={src} unoptimized />
    </div>
  );
}
