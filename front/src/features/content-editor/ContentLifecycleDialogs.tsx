"use client";

import { useEffect, useRef, useState } from "react";
import { getContentVersions } from "@/services/content-editor-api";
import type { ContentResourceKind, ContentVersion } from "@/types/content-editor";
import styles from "@/features/editor/PageLifecycleDialogs.module.css";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { message: string; status: "error" };

export function PublishContentDialog({
  label,
  onClose,
  onPublish,
}: Readonly<{
  label: string;
  onClose: () => void;
  onPublish: (changeSummary: string) => Promise<void>;
}>) {
  return (
    <ReasonDialog
      description="发布成功后将立即更新官网公开内容，并保留一条新的历史版本。"
      eyebrow="受保护发布操作"
      label="发布说明"
      onClose={onClose}
      onSubmit={onPublish}
      pendingText="正在发布…"
      submitText="确认发布"
      title={`发布${label}`}
    />
  );
}

export function OfflineContentDialog({
  label,
  onClose,
  onOffline,
}: Readonly<{
  label: string;
  onClose: () => void;
  onOffline: (reason: string) => Promise<void>;
}>) {
  return (
    <ReasonDialog
      description="下线后公开详情将不可访问；如果仍被已发布页面引用，服务端会拒绝本次操作。"
      eyebrow="受保护下线操作"
      label="下线原因"
      onClose={onClose}
      onSubmit={onOffline}
      pendingText="正在下线…"
      submitText="确认下线"
      title={`下线${label}`}
    />
  );
}

function ReasonDialog({
  description,
  eyebrow,
  label,
  onClose,
  onSubmit,
  pendingText,
  submitText,
  title,
}: Readonly<{
  description: string;
  eyebrow: string;
  label: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  pendingText: string;
  submitText: string;
  title: string;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const pending = submitState.status === "submitting";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function handleSubmit() {
    const value = reason.trim();
    if (!value || pending) return;
    setSubmitState({ status: "submitting" });
    try {
      await onSubmit(value);
      onClose();
    } catch (error) {
      setSubmitState({
        message: error instanceof Error ? error.message : "操作失败，请稍后重试。",
        status: "error",
      });
    }
  }

  return (
    <dialog
      aria-labelledby="content-lifecycle-title"
      className={styles.dialog}
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
      onClose={() => { if (!pending) onClose(); }}
      ref={dialogRef}
    >
      <form className={styles.dialogBody} onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id="content-lifecycle-title">{title}</h2>
        <p>{description}</p>
        <label htmlFor="content-lifecycle-reason">{label}</label>
        <textarea
          autoFocus
          disabled={pending}
          id="content-lifecycle-reason"
          maxLength={255}
          onChange={(event) => {
            setReason(event.target.value);
            if (submitState.status === "error") setSubmitState({ status: "idle" });
          }}
          required
          rows={4}
          value={reason}
        />
        <span className={styles.characterCount}>{reason.length}/255</span>
        {submitState.status === "error" ? <p className={styles.error} role="alert">{submitState.message}</p> : null}
        <div className={styles.dialogActions}>
          <button disabled={pending} onClick={onClose} type="button">取消</button>
          <button disabled={!reason.trim() || pending} type="submit">{pending ? pendingText : submitText}</button>
        </div>
      </form>
    </dialog>
  );
}

type VersionState =
  | { status: "loading" }
  | { versions: ContentVersion[]; status: "ready" }
  | { message: string; status: "error" };

export function ContentVersionHistoryDialog({
  canRollback,
  kind,
  onClose,
  onRollback,
  resourceId,
}: Readonly<{
  canRollback: boolean;
  kind: ContentResourceKind;
  onClose: () => void;
  onRollback: (version: ContentVersion, changeSummary: string) => Promise<void>;
  resourceId: number;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [versionState, setVersionState] = useState<VersionState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [rollbackTarget, setRollbackTarget] = useState<ContentVersion | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const pending = submitState.status === "submitting";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    void getContentVersions(kind, resourceId)
      .then((versions) => {
        if (active) setVersionState({ status: "ready", versions: [...versions].sort((a, b) => b.versionNo - a.versionNo) });
      })
      .catch(() => {
        if (active) setVersionState({ message: "暂时无法读取历史版本，请稍后重试。", status: "error" });
      });
    return () => { active = false; };
  }, [kind, reloadKey, resourceId]);

  async function handleRollback() {
    const summary = changeSummary.trim();
    if (!rollbackTarget || !summary || pending) return;
    setSubmitState({ status: "submitting" });
    try {
      await onRollback(rollbackTarget, summary);
      onClose();
    } catch (error) {
      setSubmitState({ message: error instanceof Error ? error.message : "回滚失败，请稍后重试。", status: "error" });
    }
  }

  return (
    <dialog
      aria-labelledby="content-version-history-title"
      className={`${styles.dialog} ${styles.historyDialog}`}
      onCancel={(event) => { if (pending) event.preventDefault(); else onClose(); }}
      onClose={() => { if (!pending) onClose(); }}
      ref={dialogRef}
    >
      <div className={styles.dialogBody}>
        <div className={styles.historyHeading}>
          <div><p className={styles.eyebrow}>内容版本</p><h2 id="content-version-history-title">历史版本</h2></div>
          <button disabled={pending} onClick={onClose} type="button">关闭</button>
        </div>
        {!canRollback ? <p className={styles.notice} role="status">当前草稿未保存或没有有效编辑锁，历史可查看，但回滚已禁用。</p> : null}
        {versionState.status === "loading" ? <p role="status">正在读取历史版本…</p> : null}
        {versionState.status === "error" ? (
          <div className={styles.errorState}>
            <p className={styles.error} role="alert">{versionState.message}</p>
            <button onClick={() => { setVersionState({ status: "loading" }); setReloadKey((value) => value + 1); }} type="button">重试</button>
          </div>
        ) : null}
        {versionState.status === "ready" && versionState.versions.length === 0 ? <p>当前内容还没有发布版本。</p> : null}
        {versionState.status === "ready" && versionState.versions.length > 0 ? (
          <ol className={styles.versionList}>
            {versionState.versions.map((version) => (
              <li key={version.id}>
                <div><strong>版本 {version.versionNo}</strong>{version.rollbackSourceVersionId ? <span>回滚生成</span> : <span>发布</span>}</div>
                <p>{version.changeSummary || "未填写变更说明"}</p>
                <small>{formatDateTime(version.publishedAt ?? version.createdAt)}{version.publisher ? ` · ${version.publisher}` : ""}</small>
                <button
                  disabled={!canRollback || pending}
                  onClick={() => {
                    setRollbackTarget(version);
                    setChangeSummary(`回滚至版本 ${version.versionNo}`);
                    setSubmitState({ status: "idle" });
                  }}
                  type="button"
                >回滚到此版本</button>
              </li>
            ))}
          </ol>
        ) : null}
        {rollbackTarget ? (
          <form className={styles.rollbackConfirmation} onSubmit={(event) => { event.preventDefault(); void handleRollback(); }}>
            <h3>确认回滚到版本 {rollbackTarget.versionNo}</h3>
            <p>回滚会立即生成一个新的已发布版本，现有历史不会被删除。</p>
            <label htmlFor="content-rollback-summary">回滚说明</label>
            <textarea disabled={pending} id="content-rollback-summary" maxLength={255} onChange={(event) => setChangeSummary(event.target.value)} required rows={3} value={changeSummary} />
            <span className={styles.characterCount}>{changeSummary.length}/255</span>
            {submitState.status === "error" ? <p className={styles.error} role="alert">{submitState.message}</p> : null}
            <div className={styles.dialogActions}>
              <button disabled={pending} onClick={() => setRollbackTarget(null)} type="button">取消回滚</button>
              <button disabled={!changeSummary.trim() || pending} type="submit">{pending ? "正在回滚…" : "确认回滚"}</button>
            </div>
          </form>
        ) : null}
      </div>
    </dialog>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "时间未知";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
}
