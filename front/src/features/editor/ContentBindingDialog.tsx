import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getBindableContentPage } from "@/services/content-binding-api";
import type {
  BindableContentItem,
  BindableContentPage,
  ContentBindingSource,
} from "@/types/content-binding";
import styles from "./ContentBindingDialog.module.css";

type ContentState =
  | { status: "loading" }
  | { page: BindableContentPage; status: "ready" }
  | { message: string; status: "error" };

export function ContentBindingDialog({
  limit,
  onClose,
  onConfirm,
  selectedIds,
  source,
}: Readonly<{
  limit: number;
  onClose: () => void;
  onConfirm: (ids: number[], items: BindableContentItem[]) => void;
  selectedIds: number[];
  source: ContentBindingSource;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pageNo, setPageNo] = useState(1);
  const [contentState, setContentState] = useState<ContentState>({ status: "loading" });
  const [orderedIds, setOrderedIds] = useState(selectedIds.slice(0, limit));
  const [itemsById, setItemsById] = useState<Map<number, BindableContentItem>>(new Map());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    void getBindableContentPage(source, pageNo)
      .then((page) => {
        if (!active) return;
        setItemsById((current) => {
          const next = new Map(current);
          page.list.forEach((item) => next.set(item.id, item));
          return next;
        });
        setContentState({ page, status: "ready" });
      })
      .catch(() => {
        if (active) setContentState({ message: "暂时无法读取可绑定内容，请稍后重试。", status: "error" });
      });

    return () => {
      active = false;
    };
  }, [pageNo, source]);

  const page = contentState.status === "ready" ? contentState.page : null;
  const hasPrevious = Boolean(page && page.pageNo > 1);
  const hasNext = Boolean(page && page.pageNo * page.pageSize < page.total);

  function toggleItem(item: BindableContentItem) {
    setItemsById((current) => new Map(current).set(item.id, item));
    setOrderedIds((current) => {
      if (current.includes(item.id)) return current.filter((id) => id !== item.id);
      if (!item.visible || current.length >= limit) return current;
      return [...current, item.id];
    });
  }

  function moveSelected(id: number, direction: "down" | "up") {
    setOrderedIds((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + (direction === "up" ? -1 : 1);
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function changePage(nextPage: number) {
    setContentState({ status: "loading" });
    setPageNo(nextPage);
  }

  return (
    <dialog
      aria-labelledby="content-binding-title"
      className={styles.dialog}
      onCancel={onClose}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className={styles.dialogBody}>
        <div className={styles.heading}>
          <div>
            <p>手动内容绑定</p>
            <h2 id="content-binding-title">选择{getSourceLabel(source)}</h2>
          </div>
          <span>已选 {orderedIds.length}/{limit}</span>
        </div>

        {orderedIds.length > 0 ? (
          <section aria-label="已选择内容" className={styles.selectedSection}>
            <h3>展示顺序</h3>
            <ol>
              {orderedIds.map((id, index) => {
                const item = itemsById.get(id);
                return (
                  <li key={id}>
                    <span>{item?.title ?? `内容 ID ${id}`}</span>
                    {!item?.visible && item ? <small>当前不可见，保存或发布可能被后端拒绝</small> : null}
                    <div>
                      <button disabled={index === 0} onClick={() => moveSelected(id, "up")} type="button">上移</button>
                      <button disabled={index === orderedIds.length - 1} onClick={() => moveSelected(id, "down")} type="button">下移</button>
                      <button onClick={() => setOrderedIds((current) => current.filter((itemId) => itemId !== id))} type="button">移除</button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {contentState.status === "loading" ? <p role="status">正在读取内容列表…</p> : null}
        {contentState.status === "error" ? <p className={styles.error} role="alert">{contentState.message}</p> : null}
        {page?.list.length === 0 ? <p>当前没有可供选择的内容。</p> : null}
        {page && page.list.length > 0 ? (
          <div className={styles.contentGrid}>
            {page.list.map((item) => {
              const selected = orderedIds.includes(item.id);
              const disabled = !selected && (!item.visible || orderedIds.length >= limit);
              return (
                <label className={styles.contentCard} data-disabled={disabled} key={item.id}>
                  {item.thumbnailUrl ? (
                    <span className={styles.preview}>
                      <Image alt="" fill sizes="240px" src={item.thumbnailUrl} unoptimized />
                    </span>
                  ) : null}
                  <span className={styles.cardHeading}>
                    <input
                      checked={selected}
                      disabled={disabled}
                      onChange={() => toggleItem(item)}
                      type="checkbox"
                    />
                    <strong>{item.title}</strong>
                  </span>
                  {item.summary ? <small>{item.summary}</small> : null}
                  {!item.visible ? <small className={styles.warning}>当前不可见，不能新增绑定</small> : null}
                </label>
              );
            })}
          </div>
        ) : null}

        <div className={styles.dialogActions}>
          <div>
            <button disabled={!hasPrevious} onClick={() => changePage(pageNo - 1)} type="button">上一页</button>
            <button disabled={!hasNext} onClick={() => changePage(pageNo + 1)} type="button">下一页</button>
          </div>
          <div>
            <button onClick={onClose} type="button">取消</button>
            <button
              className={styles.confirmButton}
              onClick={() => onConfirm(
                orderedIds,
                orderedIds.map((id) => itemsById.get(id)).filter((item): item is BindableContentItem => Boolean(item)),
              )}
              type="button"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function getSourceLabel(source: ContentBindingSource) {
  if (source === "CASE") return "案例";
  if (source === "INDUSTRY_SOLUTION") return "行业方案";
  return "产品";
}
