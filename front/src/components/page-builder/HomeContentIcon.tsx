"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./HomeContentGridBlock.module.css";

export function HomeContentIcon({ iconUrl, title }: Readonly<{ iconUrl?: string; title: string }>) {
  const [failedUrl, setFailedUrl] = useState<string>();

  if (!iconUrl || failedUrl === iconUrl) {
    return <span aria-hidden="true" className={styles.iconFallback}>{title.slice(0, 1)}</span>;
  }

  return (
    <span className={styles.icon}>
      <Image
        alt=""
        fill
        onError={() => setFailedUrl(iconUrl)}
        sizes="48px"
        src={iconUrl}
        unoptimized
      />
    </span>
  );
}
