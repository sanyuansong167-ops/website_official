import { useEffect, useRef, useState } from "react";
import { getPageVersions } from "@/services/admin-api";
import type { PageVersion } from "@/types/page-builder";
import styles from "./PageLifecycleDialogs.module.css";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { message: string; status: "error" };

export function PublishPageDialog({
  onClose,
  onPublish,
  pageName,
}: Readonly<{
  onClose: () => void;
  onPublish: (changeSummary: string) => Promise<void>;
  pageName: string;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const pending = submitState.status === "submitting";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function handleSubmit() {
    const summary = changeSummary.trim();
    if (!summary || pending) return;

    setSubmitState({ status: "submitting" });
    try {
      await onPublish(summary);
      onClose();
    } catch (error) {
      setSubmitState({
        message: error instanceof Error ? error.message : "发布失败，请稍后重试。",
        status: "error",
      });
    }
  }

  return (
    <dialog
      aria-describedby="publish-page-description"
      aria-labelledby="publish-page-title"
      className={styles.dialog}
      onCancel={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={() => {
        if (!pending) onClose();
      }}
      ref={dialogRef}
    >
      <form
        className={styles.dialogBody}
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <p className={styles.eyebrow}>受保护发布操作</p>
        <h2 id="publish-page-title">发布“{pageName}”</h2>
        <p id="publish-page-description">
          发布将立即更新官网公开内容。服务端校验通过并确认发布成功前，当前公开页面不会改变。
        </p>
        <label htmlFor="publish-change-summary">发布说明</label>
        <textarea
          autoFocus
          disabled={pending}
          id="publish-change-summary"
          maxLength={255}
          onChange={(event) => {
            setChangeSummary(event.target.value);
            if (submitState.status === "error") setSubmitState({ status: "idle" });
          }}
          required
          rows={4}
          value={changeSummary}
        />
        <span className={styles.characterCount}>{changeSummary.length}/255</span>
        {submitState.status === "error" ? (
          <p className={styles.error} role="alert">{submitState.message}</p>
        ) : null}
        <div className={styles.dialogActions}>
          <button disabled={pending} onClick={onClose} type="button">取消</button>
          <button disabled={!changeSummary.trim() || pending} type="submit">
            {pending ? "正在发布…" : "确认发布"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

type VersionState =
  | { status: "loading" }
  | { versions: PageVersion[]; status: "ready" }
  | { message: string; status: "error" };

export function VersionHistoryDialog({
  canRollback,
  onClose,
  onRollback,
  pageId,
}: Readonly<{
  canRollback: boolean;
  onClose: () => void;
  onRollback: (version: PageVersion, changeSummary: string) => Promise<void>;
  pageId: number;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [versionState, setVersionState] = useState<VersionState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [rollbackTarget, setRollbackTarget] = useState<PageVersion | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const pending = submitState.status === "submitting";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let active = true;

    void getPageVersions(pageId, 1, 50)
      .then((versions) => {
        if (active) {
          setVersionState({
            status: "ready",
            versions: [...versions].sort((left, right) => right.versionNo - left.versionNo),
          });
        }
      })
      .catch(() => {
        if (active) {
          setVersionState({ message: "暂时无法读取历史版本，请稍后重试。", status: "error" });
        }
      });

    return () => {
      active = false;
    };
  }, [pageId, reloadKey]);

  function selectRollbackTarget(version: PageVersion) {
    if (!canRollback || pending) return;
    setRollbackTarget(version);
    setChangeSummary(`回滚至版本 ${version.versionNo}`);
    setSubmitState({ status: "idle" });
  }

  async function handleRollback() {
    const summary = changeSummary.trim();
    if (!rollbackTarget || !summary || pending) return;

    setSubmitState({ status: "submitting" });
    try {
      await onRollback(rollbackTarget, summary);
      onClose();
    } catch (error) {
      setSubmitState({
        message: error instanceof Error ? error.message : "回滚失败，请稍后重试。",
        status: "error",
      });
    }
  }

  return (
    <dialog
      aria-labelledby="version-history-title"
      className={`${styles.dialog} ${styles.historyDialog}`}
      onCancel={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={() => {
        if (!pending) onClose();
      }}
      ref={dialogRef}
    >
      <div className={styles.dialogBody}>
        <div className={styles.historyHeading}>
          <div>
            <p className={styles.eyebrow}>页面版本</p>
            <h2 id="version-history-title">历史版本</h2>
          </div>
          <button disabled={pending} onClick={onClose} type="button">关闭</button>
        </div>

        {!canRollback ? (
          <p className={styles.notice} role="status">
            当前没有有效编辑锁，历史版本可查看，但回滚操作已禁用。
          </p>
        ) : null}
        {versionState.status === "loading" ? <p role="status">正在读取历史版本…</p> : null}
        {versionState.status === "error" ? (
          <div className={styles.errorState}>
            <p className={styles.error} role="alert">{versionState.message}</p>
            <button
              onClick={() => {
                setVersionState({ status: "loading" });
                setReloadKey((current) => current + 1);
              }}
              type="button"
            >
              重试
            </button>
          </div>
        ) : null}
        {versionState.status === "ready" && versionState.versions.length === 0 ? (
          <p>当前页面还没有历史版本。</p>
        ) : null}
        {versionState.status === "ready" && versionState.versions.length > 0 ? (
          <ol className={styles.versionList}>
            {versionState.versions.map((version) => (
              <li key={version.id}>
                <div>
                  <strong>版本 {version.versionNo}</strong>
                  <span>{formatSourceType(version.sourceType)}</span>
                </div>
                <p>{version.changeSummary || "未填写变更说明"}</p>
                <small>
                  {formatDateTime(version.createdAt)}
                  {version.schemaHash ? ` · Schema ${version.schemaHash.slice(0, 10)}` : ""}
                </small>
                <button
                  disabled={!canRollback || pending}
                  onClick={() => selectRollbackTarget(version)}
                  type="button"
                >
                  回滚到此版本
                </button>
              </li>
            ))}
          </ol>
        ) : null}

        {rollbackTarget ? (
          <form
            className={styles.rollbackConfirmation}
            onSubmit={(event) => {
              event.preventDefault();
              void handleRollback();
            }}
          >
            <h3>确认回滚到版本 {rollbackTarget.versionNo}</h3>
            <p>回滚会立即生成新的已发布版本，不会删除现有历史记录。</p>
            <label htmlFor="rollback-change-summary">回滚说明</label>
            <textarea
              disabled={pending}
              id="rollback-change-summary"
              maxLength={255}
              onChange={(event) => {
                setChangeSummary(event.target.value);
                if (submitState.status === "error") setSubmitState({ status: "idle" });
              }}
              required
              rows={3}
              value={changeSummary}
            />
            <span className={styles.characterCount}>{changeSummary.length}/255</span>
            {submitState.status === "error" ? (
              <p className={styles.error} role="alert">{submitState.message}</p>
            ) : null}
            <div className={styles.dialogActions}>
              <button
                disabled={pending}
                onClick={() => {
                  setRollbackTarget(null);
                  setSubmitState({ status: "idle" });
                }}
                type="button"
              >
                取消回滚
              </button>
              <button disabled={!changeSummary.trim() || pending} type="submit">
                {pending ? "正在回滚…" : "确认回滚"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </dialog>
  );
}

function formatSourceType(sourceType: string) {
  if (sourceType === "PUBLISH") return "发布";
  if (sourceType === "ROLLBACK") return "回滚";
  return sourceType;
}

function formatDateTime(value?: string) {
  if (!value) return "时间未知";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "时间未知"
    : new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
