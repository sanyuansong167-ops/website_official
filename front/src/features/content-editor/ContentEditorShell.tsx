"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ContentVersionHistoryDialog,
  OfflineContentDialog,
  PublishContentDialog,
} from "@/features/content-editor/ContentLifecycleDialogs";
import { ContentDraftPanels } from "@/features/content-editor/ContentDraftPanels";
import { getContentResourceDefinition } from "@/features/content-editor/content-resource";
import { contentDraftToForm, mergeContentDraftForm, type ContentDraftForm } from "@/features/content-editor/content-draft-form";
import { getCsrfToken } from "@/services/admin-api";
import {
  acquireContentLock,
  createContentPreview,
  forceReleaseContentLock,
  getContentDraft,
  getContentLockConflict,
  heartbeatContentLock,
  offlineContent,
  publishContent,
  releaseContentLock,
  rollbackContent,
  saveContentDraft,
} from "@/services/content-editor-api";
import type { AdminSession, CsrfToken } from "@/types/admin";
import type { ContentDraft, ContentResourceKind, ContentVersion } from "@/types/content-editor";
import styles from "./ContentEditorShell.module.css";

type ContentEditorShellProps = {
  resourceId: number;
  resourceKind: ContentResourceKind;
  user: AdminSession;
};

type LockState =
  | { status: "acquiring" }
  | { expiresAt: string; ownerDisplayName: string; status: "editable" }
  | { expiresAt?: string; forceUnlockAllowed: boolean; ownerDisplayName?: string; status: "conflict" }
  | { message: string; status: "error" | "lost" };

type DraftState =
  | { status: "idle" | "loading" }
  | { draft: ContentDraft; status: "ready" }
  | { message: string; status: "error" };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { savedAt: string; status: "saved" }
  | { message: string; status: "error" };

type ForceReleaseState =
  | { status: "idle" }
  | { status: "releasing" }
  | { message: string; status: "error" };

type LifecycleState =
  | { status: "idle" }
  | { action: "offline" | "preview" | "publish" | "rollback"; status: "working" }
  | { message: string; status: "success" }
  | { message: string; status: "error" };

const resourceLabels: Record<ContentResourceKind, string> = {
  case: "案例",
  product: "产品",
  solution: "行业方案",
};

export function ContentEditorShell({ resourceId, resourceKind, user }: ContentEditorShellProps) {
  const [lockState, setLockState] = useState<LockState>({ status: "acquiring" });
  const [draftState, setDraftState] = useState<DraftState>({ status: "idle" });
  const [form, setForm] = useState<ContentDraftForm | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [forceUnlockOpen, setForceUnlockOpen] = useState(false);
  const [forceUnlockReason, setForceUnlockReason] = useState("");
  const [forceReleaseState, setForceReleaseState] = useState<ForceReleaseState>({ status: "idle" });
  const [publishOpen, setPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [lifecycleState, setLifecycleState] = useState<LifecycleState>({ status: "idle" });
  const csrfRef = useRef<CsrfToken | null>(null);
  const lockTokenRef = useRef<string | null>(null);
  const label = resourceLabels[resourceKind];

  useEffect(() => {
    let active = true;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

    async function loadDraft() {
      setDraftState({ status: "loading" });
      try {
        const draft = await getContentDraft(resourceKind, resourceId);
        if (!active) return;
        setDraftState({ draft, status: "ready" });
        setForm(contentDraftToForm(draft.draft, resourceKind));
        setSaveState({ status: "idle" });
      } catch (error) {
        if (active) setDraftState({ message: getSafeDraftError(error), status: "error" });
      }
    }

    async function renewLock(csrf: CsrfToken) {
      try {
        const lock = await heartbeatContentLock(resourceKind, resourceId, csrf);
        if (!active) return;
        setLockState({ expiresAt: lock.expiresAt, ownerDisplayName: lock.ownerDisplayName, status: "editable" });
      } catch {
        if (!active) return;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        lockTokenRef.current = null;
        setLockState({ message: "编辑锁已失效，草稿保存已禁用。请刷新页面重新获取编辑锁。", status: "lost" });
      }
    }

    async function initialize() {
      try {
        const csrf = await getCsrfToken();
        csrfRef.current = csrf;
        const lock = await acquireContentLock(resourceKind, resourceId, csrf);
        if (!lock.editable || !lock.lockToken) throw new Error("The lock response did not grant editing access.");
        if (!active) {
          await releaseContentLock(resourceKind, resourceId, csrf).catch(() => undefined);
          return;
        }

        lockTokenRef.current = lock.lockToken;
        setLockState({ expiresAt: lock.expiresAt, ownerDisplayName: lock.ownerDisplayName, status: "editable" });
        heartbeatTimer = setInterval(() => void renewLock(csrf), clampHeartbeat(lock.heartbeatIntervalSeconds) * 1_000);
        await loadDraft();
      } catch (error) {
        if (!active) return;
        const conflict = getContentLockConflict(error);
        if (conflict) {
          setLockState({ ...conflict, status: "conflict" });
          return;
        }
        setLockState({ message: getSafeLockError(error), status: "error" });
      }
    }

    void initialize();
    return () => {
      active = false;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      const csrf = csrfRef.current;
      const lockToken = lockTokenRef.current;
      csrfRef.current = null;
      lockTokenRef.current = null;
      if (csrf && lockToken) void releaseContentLock(resourceKind, resourceId, csrf).catch(() => undefined);
    };
  }, [resourceId, resourceKind]);

  const savedForm = useMemo(
    () => (draftState.status === "ready" ? contentDraftToForm(draftState.draft.draft, resourceKind) : null),
    [draftState, resourceKind],
  );
  const isDirty = form !== null && savedForm !== null && JSON.stringify(form) !== JSON.stringify(savedForm);
  const canSave = lockState.status === "editable" && draftState.status === "ready" && form !== null && isDirty && saveState.status !== "saving";
  const lifecycleWorking = lifecycleState.status === "working";
  const canMutateLifecycle = lockState.status === "editable" && draftState.status === "ready" && !isDirty && !lifecycleWorking;
  const canPreview = canMutateLifecycle && Boolean(draftState.status === "ready" && draftState.draft.draftHash);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  async function handleSave() {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;
    if (!canSave || !csrf || !lockToken || !form || draftState.status !== "ready") return;
    if (!form.title.trim()) {
      setSaveState({ message: "请填写标题后再保存草稿。", status: "error" });
      return;
    }
    if (!form.summary.trim()) {
      setSaveState({ message: "请填写摘要后再保存草稿。", status: "error" });
      return;
    }

    setSaveState({ status: "saving" });
    try {
      const draft = await saveContentDraft({
        csrf,
        draft: mergeContentDraftForm(draftState.draft.draft, form, resourceKind),
        kind: resourceKind,
        lockToken,
        resourceId,
        version: draftState.draft.version,
      });
      setDraftState({ draft, status: "ready" });
      setForm(contentDraftToForm(draft.draft, resourceKind));
      setSaveState({ savedAt: draft.updatedAt, status: "saved" });
    } catch (error) {
      setSaveState({ message: getSafeSaveError(error), status: "error" });
    }
  }

  async function handleForceRelease() {
    const csrf = csrfRef.current;
    const reason = forceUnlockReason.trim();
    if (!csrf || !reason || forceReleaseState.status === "releasing") return;

    setForceReleaseState({ status: "releasing" });
    try {
      await forceReleaseContentLock(resourceKind, resourceId, csrf, reason);
      window.location.reload();
    } catch (error) {
      setForceReleaseState({ message: getSafeForceReleaseError(error), status: "error" });
    }
  }

  async function reloadDraft() {
    const draft = await getContentDraft(resourceKind, resourceId);
    setDraftState({ draft, status: "ready" });
    setForm(contentDraftToForm(draft.draft, resourceKind));
    setSaveState({ status: "idle" });
    return draft;
  }

  async function handlePreview() {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;
    if (!csrf || !lockToken || !canPreview || draftState.status !== "ready" || !draftState.draft.draftHash) return;

    const previewWindow = window.open("about:blank", "_blank");
    if (previewWindow) previewWindow.opener = null;
    setLifecycleState({ action: "preview", status: "working" });
    try {
      const previewToken = await createContentPreview({
        csrf,
        draftHash: draftState.draft.draftHash,
        kind: resourceKind,
        lockToken,
        resourceId,
      });
      const previewUrl = `/admin/preview/content/${resourceKind}/${resourceId}/${encodeURIComponent(previewToken)}`;
      if (previewWindow) previewWindow.location.replace(previewUrl);
      else window.location.assign(previewUrl);
      setLifecycleState({ message: previewWindow ? "预览已在新窗口打开。" : "正在进入预览。", status: "success" });
    } catch (error) {
      previewWindow?.close();
      setLifecycleState({ message: getSafeLifecycleError("预览生成失败", error), status: "error" });
    }
  }

  async function handlePublish(changeSummary: string) {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;
    if (!csrf || !lockToken || !canMutateLifecycle || draftState.status !== "ready") throw new Error("当前草稿尚不能发布。");
    setLifecycleState({ action: "publish", status: "working" });
    try {
      const version = await publishContent({ csrf, changeSummary, kind: resourceKind, lockToken, resourceId, version: draftState.draft.version });
      await reloadDraft();
      setLifecycleState({ message: `已发布为版本 ${version.versionNo}。`, status: "success" });
    } catch (error) {
      setLifecycleState({ status: "idle" });
      throw new Error(getSafeLifecycleError("发布失败", error));
    }
  }

  async function handleRollback(target: ContentVersion, changeSummary: string) {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;
    if (!csrf || !lockToken || !canMutateLifecycle || draftState.status !== "ready") throw new Error("当前草稿尚不能回滚。");
    setLifecycleState({ action: "rollback", status: "working" });
    try {
      const version = await rollbackContent({
        changeSummary,
        csrf,
        kind: resourceKind,
        lockToken,
        resourceId,
        targetVersionId: target.id,
        version: draftState.draft.version,
      });
      await reloadDraft();
      setLifecycleState({ message: `已回滚并生成版本 ${version.versionNo}。`, status: "success" });
    } catch (error) {
      setLifecycleState({ status: "idle" });
      throw new Error(getSafeLifecycleError("回滚失败", error));
    }
  }

  async function handleOffline(reason: string) {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;
    if (!csrf || !lockToken || !canMutateLifecycle || draftState.status !== "ready") throw new Error("当前内容尚不能下线。");
    setLifecycleState({ action: "offline", status: "working" });
    try {
      await offlineContent({ csrf, kind: resourceKind, lockToken, reason, resourceId, version: draftState.draft.version });
      await reloadDraft();
      setLifecycleState({ message: `${label}已下线。`, status: "success" });
    } catch (error) {
      setLifecycleState({ status: "idle" });
      throw new Error(getSafeLifecycleError("下线失败", error));
    }
  }

  function updateField(field: keyof ContentDraftForm, value: ContentDraftForm[keyof ContentDraftForm]) {
    setForm((current) => current ? { ...current, [field]: value } : current);
    if (saveState.status !== "idle") setSaveState({ status: "idle" });
  }

  const lockStatus = getLockStatus(lockState);
  const resourceType = getContentResourceDefinition(resourceKind).resourceType;

  return (
    <main className={styles.editorShell}>
      <header className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>{label}详情 · #{resourceId}</p>
          <h1>{label}详情编辑器</h1>
        </div>
        <div className={styles.toolbarActions}>
          <p className={styles.lockStatus} data-status={lockStatus.tone}>{lockStatus.message}</p>
          {lockState.status === "conflict" && lockState.forceUnlockAllowed ? (
            <button className={styles.forceUnlockButton} onClick={() => setForceUnlockOpen(true)} type="button">强制解锁</button>
          ) : null}
          <span className={styles.userName}>{user.displayName}</span>
          <Link className={styles.portalLink} href="/admin/editor?routePath=/">返回页面编辑器</Link>
          <button className={styles.secondaryButton} disabled={!canPreview} onClick={() => void handlePreview()} type="button">
            {lifecycleState.status === "working" && lifecycleState.action === "preview" ? "生成预览…" : "预览草稿"}
          </button>
          <button className={styles.secondaryButton} disabled={lifecycleWorking} onClick={() => setHistoryOpen(true)} type="button">历史版本</button>
          <button className={styles.secondaryButton} disabled={!canMutateLifecycle} onClick={() => setOfflineOpen(true)} type="button">下线</button>
          <button className={styles.publishButton} disabled={!canMutateLifecycle} onClick={() => setPublishOpen(true)} type="button">发布</button>
          <button className={styles.saveButton} disabled={!canSave} onClick={() => void handleSave()} type="button">
            {saveState.status === "saving" ? "正在保存…" : "保存草稿"}
          </button>
        </div>
      </header>

      <section className={styles.workspace} aria-label={`${label}详情编辑工作区`}>
        <aside className={styles.sidebar}>
          <h2>编辑状态</h2>
          <dl>
            <div><dt>资源类型</dt><dd>{resourceType}</dd></div>
            <div><dt>草稿状态</dt><dd>{getDraftStatusLabel(draftState)}</dd></div>
            <div><dt>保存状态</dt><dd>{getSaveStatusLabel(saveState)}</dd></div>
          </dl>
          <p className={styles.readOnlyNotice}>预览、发布、回滚和下线前必须先保存当前草稿；历史版本始终可查看。</p>
        </aside>

        <div className={styles.content}>
          {draftState.status === "loading" || draftState.status === "idle" ? <p className={styles.state}>正在读取草稿…</p> : null}
          {draftState.status === "error" ? <p className={styles.error}>{draftState.message}</p> : null}
          {draftState.status === "ready" && form ? (
            <>
              <ContentDraftPanels
                disabled={lockState.status !== "editable"}
                form={form}
                onChange={updateField}
                resourceId={resourceId}
                resourceKind={resourceKind}
              />
              {saveState.status === "error" ? <p className={styles.error}>{saveState.message}</p> : null}
              {saveState.status === "saved" ? <p className={styles.success}>草稿已保存：{formatDateTime(saveState.savedAt)}</p> : null}
              {lifecycleState.status === "error" ? <p className={styles.error}>{lifecycleState.message}</p> : null}
              {lifecycleState.status === "success" ? <p className={styles.success}>{lifecycleState.message}</p> : null}
            </>
          ) : null}
        </div>
      </section>
      <ForceUnlockDialog
        onClose={() => {
          if (forceReleaseState.status !== "releasing") setForceUnlockOpen(false);
        }}
        onReasonChange={setForceUnlockReason}
        onSubmit={() => void handleForceRelease()}
        open={forceUnlockOpen}
        reason={forceUnlockReason}
        state={forceReleaseState}
      />
      {publishOpen ? <PublishContentDialog label={label} onClose={() => setPublishOpen(false)} onPublish={handlePublish} /> : null}
      {historyOpen ? (
        <ContentVersionHistoryDialog
          canRollback={canMutateLifecycle}
          kind={resourceKind}
          onClose={() => setHistoryOpen(false)}
          onRollback={handleRollback}
          resourceId={resourceId}
        />
      ) : null}
      {offlineOpen ? <OfflineContentDialog label={label} onClose={() => setOfflineOpen(false)} onOffline={handleOffline} /> : null}
    </main>
  );
}

function ForceUnlockDialog({
  onClose,
  onReasonChange,
  onSubmit,
  open,
  reason,
  state,
}: Readonly<{
  onClose: () => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  open: boolean;
  reason: string;
  state: ForceReleaseState;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-describedby="content-force-unlock-description"
      aria-labelledby="content-force-unlock-title"
      className={styles.forceUnlockDialog}
      onCancel={(event) => {
        if (state.status === "releasing") event.preventDefault();
        else onClose();
      }}
      onClose={() => {
        if (state.status !== "releasing") onClose();
      }}
      ref={dialogRef}
    >
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <p className={styles.eyebrow}>受保护操作</p>
        <h2 id="content-force-unlock-title">强制释放编辑锁</h2>
        <p id="content-force-unlock-description">该操作会立即撤销当前持锁管理员的编辑权限，并由服务端记录审计日志。</p>
        <label className={styles.field} htmlFor="content-force-unlock-reason">
          <span>解锁原因</span>
          <textarea autoFocus disabled={state.status === "releasing"} id="content-force-unlock-reason" onChange={(event) => onReasonChange(event.target.value)} required rows={4} value={reason} />
        </label>
        {state.status === "error" ? <p className={styles.error} role="alert">{state.message}</p> : null}
        <div className={styles.dialogActions}>
          <button disabled={state.status === "releasing"} onClick={onClose} type="button">取消</button>
          <button disabled={!reason.trim() || state.status === "releasing"} type="submit">{state.status === "releasing" ? "正在释放…" : "确认强制解锁"}</button>
        </div>
      </form>
    </dialog>
  );
}

function clampHeartbeat(seconds: number) {
  return Math.min(Math.max(seconds, 10), 120);
}

function getLockStatus(state: LockState) {
  if (state.status === "editable") return { message: `编辑锁有效，至 ${formatDateTime(state.expiresAt)}`, tone: "success" };
  if (state.status === "acquiring") return { message: "正在获取编辑锁…", tone: "warning" };
  if (state.status === "conflict") return { message: state.ownerDisplayName ? `当前由 ${state.ownerDisplayName} 编辑` : "当前内容正被其他管理员编辑", tone: "warning" };
  return { message: state.message, tone: "error" };
}

function getDraftStatusLabel(state: DraftState) {
  if (state.status === "ready") return `版本 ${state.draft.version}`;
  if (state.status === "loading") return "读取中";
  if (state.status === "error") return "读取失败";
  return "等待中";
}

function getSaveStatusLabel(state: SaveState) {
  if (state.status === "saving") return "保存中";
  if (state.status === "saved") return "已保存";
  if (state.status === "error") return "保存失败";
  return "未保存";
}

function getSafeLockError(error: unknown) {
  return error instanceof Error ? `无法获取编辑锁：${error.message}` : "无法获取编辑锁，请稍后重试。";
}

function getSafeDraftError(error: unknown) {
  return error instanceof Error ? `无法读取草稿：${error.message}` : "无法读取草稿，请稍后重试。";
}

function getSafeSaveError(error: unknown) {
  return error instanceof Error ? `草稿保存失败：${error.message}` : "草稿保存失败，请稍后重试。";
}

function getSafeForceReleaseError(error: unknown) {
  return error instanceof Error ? `强制解锁失败：${error.message}` : "强制解锁失败，请稍后重试。";
}

function getSafeLifecycleError(prefix: string, error: unknown) {
  return error instanceof Error ? `${prefix}：${error.message}` : `${prefix}，请稍后重试。`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
}
