import { useEffect, useState } from "react";
import { resolveContentBinding } from "@/features/editor/content-binding-resolution";
import { getBindableContentSnapshot } from "@/services/content-binding-api";
import type {
  ContentBindingMode,
  ContentBindingResolution,
  ContentBindingSort,
  ContentBindingSource,
} from "@/types/content-binding";
import styles from "./ContentBindingPreview.module.css";

type PreviewState =
  | { status: "loading" }
  | { resolution: ContentBindingResolution; status: "ready" }
  | { message: string; status: "error" };

const previewDebounceMilliseconds = 250;

export function ContentBindingPreview({
  blockId,
  displayMode,
  limit,
  selectedIds,
  sortBy,
  source,
  tag,
}: Readonly<{
  blockId: string;
  displayMode: ContentBindingMode;
  limit: number;
  selectedIds: number[];
  sortBy: ContentBindingSort;
  source: ContentBindingSource;
  tag?: string;
}>) {
  const selectedIdsKey = selectedIds.join(",");
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void getBindableContentSnapshot(source)
        .then((snapshot) => {
          if (!active) return;
          setPreviewState({
            resolution: resolveContentBinding({
              blockId,
              displayMode,
              limit,
              selectedIds: parseSelectedIds(selectedIdsKey),
              sortBy,
              source,
              tag,
            }, snapshot),
            status: "ready",
          });
        })
        .catch(() => {
          if (active) {
            setPreviewState({
              message: "暂时无法读取绑定结果，保存或发布时会再次校验。",
              status: "error",
            });
          }
        });
    }, previewDebounceMilliseconds);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [blockId, displayMode, limit, selectedIdsKey, sortBy, source, tag]);

  if (previewState.status === "loading") {
    return <p className={styles.status} role="status">正在计算绑定结果…</p>;
  }

  if (previewState.status === "error") {
    return <p className={styles.error} role="alert">{previewState.message}</p>;
  }

  const { resolution } = previewState;

  return (
    <section aria-label="绑定结果预览" className={styles.contentBindingPreview}>
      <div className={styles.heading}>
        <strong>绑定结果预览</strong>
        <span>{resolution.items.length} 项</span>
      </div>
      {resolution.issues.length > 0 ? (
        <ul className={styles.issueList}>
          {resolution.issues.map((issue, index) => (
            <li key={`${issue.field}-${index}`} role="alert">{issue.message}</li>
          ))}
        </ul>
      ) : null}
      {resolution.items.length === 0 ? (
        <p className={styles.status}>当前条件没有匹配到可展示内容。</p>
      ) : (
        <ol className={styles.resultList}>
          {resolution.items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              {item.summary ? <small>{item.summary}</small> : null}
              <small>ID {item.id}{item.visible ? "" : " · 当前不可见"}</small>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function parseSelectedIds(value: string) {
  if (!value) return [];
  return value.split(",").map((item) => Number(item));
}
