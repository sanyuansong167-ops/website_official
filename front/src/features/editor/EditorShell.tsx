"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBlockDefinition } from "@/components/page-builder/block-registry";
import { PageRenderer } from "@/components/page-builder/PageRenderer";
import { BlockPropertiesPanel } from "@/features/editor/BlockPropertiesPanel";
import { AddBlockDialog, DeleteBlockDialog } from "@/features/editor/BlockOperationDialogs";
import { PublishPageDialog, VersionHistoryDialog } from "@/features/editor/PageLifecycleDialogs";
import { updateBlockConfig } from "@/features/editor/block-config";
import { validatePageContentDependencies } from "@/features/editor/content-binding-resolution";
import { useEditorContentBindingData } from "@/features/editor/use-editor-content-binding-data";
import {
  addHomeBlock,
  copyHomeBlock,
  deleteHomeBlock,
  moveHomeBlock,
  reorderHomeBlock,
} from "@/features/editor/block-operations";
import { homeBlockTemplates, type BlockConfigField, type HomeBlockType } from "@/lib/home-page-template";
import {
  acquirePageLock,
  createPagePreview,
  forceReleasePageLock,
  getComponentTemplate,
  getCsrfToken,
  getPageDraft,
  getPageLockConflict,
  heartbeatPageLock,
  publishPage,
  releasePageLock,
  rollbackPage,
  savePageDraft,
} from "@/services/admin-api";
import { pageBuilderErrorCodes } from "@/lib/page-builder-error-codes";
import { ApiError } from "@/services/http";
import type { AdminSession, CsrfToken, PageDefinition } from "@/types/admin";
import type { ComponentTemplate, JsonObject, JsonValue, PageDraft, PageSchema, PageVersion } from "@/types/page-builder";
import { resolveDraftInitialization } from "./draft-initialization";
import { validatePageSchema, type SchemaValidationIssue } from "./validate-page-schema";
import styles from "./EditorShell.module.css";

type EditorShellProps = {
  page: PageDefinition;
  user: AdminSession;
};

type LockState =
  | { status: "acquiring" }
  | { expiresAt: string; ownerDisplayName: string; status: "editable" }
  | { expiresAt?: string; forceUnlockAllowed: boolean; ownerDisplayName?: string; status: "conflict" }
  | { message: string; status: "error" | "lost" };

type DraftState =
  | { status: "idle" | "loading" }
  | { draft: PageDraft; status: "ready" }
  | { draft: PageDraft; status: "initialization-required" }
  | { message: string; status: "error" };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { savedAt: string; status: "saved" }
  | { message: string; status: "error" };

type PreviewState =
  | { status: "idle" }
  | { status: "creating" }
  | { message: string; status: "error" };

type ForceReleaseState =
  | { status: "idle" }
  | { status: "releasing" }
  | { message: string; status: "error" };

type TemplateState =
  | { status: "idle" }
  | { template: ComponentTemplate; status: "ready" }
  | { componentCode: string; message: string; status: "error" };

export function EditorShell({ page, user }: EditorShellProps) {
  const router = useRouter();
  const [lockState, setLockState] = useState<LockState>({ status: "acquiring" });
  const [draftState, setDraftState] = useState<DraftState>({ status: "idle" });
  const [workingSchema, setWorkingSchema] = useState<PageSchema | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [templateState, setTemplateState] = useState<TemplateState>({ status: "idle" });
  const [editorSessionRemark, setEditorSessionRemark] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "idle" });
  const [forceUnlockOpen, setForceUnlockOpen] = useState(false);
  const [forceUnlockReason, setForceUnlockReason] = useState("");
  const [forceReleaseState, setForceReleaseState] = useState<ForceReleaseState>({ status: "idle" });
  const [publishOpen, setPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lifecycleMessage, setLifecycleMessage] = useState<string | null>(null);
  const [dependencyIssues, setDependencyIssues] = useState<SchemaValidationIssue[]>([]);
  const csrfRef = useRef<CsrfToken | null>(null);
  const lockTokenRef = useRef<string | null>(null);
  const lifecycleCompletedRef = useRef(false);

  useEffect(() => {
    lifecycleCompletedRef.current = false;
    let active = true;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

    async function initializeLock() {
      try {
        const csrf = await getCsrfToken();
        csrfRef.current = csrf;
        const lock = await acquirePageLock(page.id, csrf);

        if (!lock.editable || !lock.lockToken) {
          throw new Error("The lock response did not grant editing access.");
        }

        if (!active) {
          await releasePageLock(page.id, csrf, lock.lockToken).catch(() => undefined);
          return;
        }

        lockTokenRef.current = lock.lockToken;
        setLockState({
          expiresAt: lock.expiresAt,
          ownerDisplayName: lock.ownerDisplayName,
          status: "editable",
        });

        const intervalMilliseconds = clampHeartbeat(lock.heartbeatIntervalSeconds) * 1_000;
        heartbeatTimer = setInterval(() => {
          void renewLock(csrf);
        }, intervalMilliseconds);

        await loadDraft();
      } catch (error) {
        if (!active) return;

        const conflict = getPageLockConflict(error);
        if (conflict) {
          setLockState({
            expiresAt: conflict.expiresAt,
            forceUnlockAllowed: conflict.forceUnlockAllowed,
            ownerDisplayName: conflict.ownerDisplayName,
            status: "conflict",
          });
          return;
        }

        setLockState({ message: getSafeLockError(error), status: "error" });
      }
    }

    async function renewLock(csrf: CsrfToken) {
      if (lifecycleCompletedRef.current) return;
      const lockToken = lockTokenRef.current;
      if (!lockToken) return;

      try {
        const lock = await heartbeatPageLock(page.id, csrf, lockToken);
        if (!active) return;

        setLockState({
          expiresAt: lock.expiresAt,
          ownerDisplayName: lock.ownerDisplayName,
          status: "editable",
        });
      } catch {
        if (!active) return;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        lockTokenRef.current = null;
        setLockState({
          message: "编辑锁已失效，保存、预览和发布操作已禁用。请刷新页面重新获取锁。",
          status: "lost",
        });
      }
    }

    async function loadDraft() {
      if (!active) return;
      setDraftState({ status: "loading" });

      try {
        const draft = await getPageDraft(page.id);
        if (active) {
          const initialization = resolveDraftInitialization(draft);
          setDraftState({ draft, status: initialization.status });
          setWorkingSchema(initialization.status === "ready" ? initialization.schema : null);
          setEditorSessionRemark(draft.editorSessionRemark ?? "");
          setSaveState({ status: "idle" });
          setDependencyIssues([]);

          const firstSection = initialization.status === "ready" ? initialization.schema.sections[0] : undefined;
          setSelectedBlockId(firstSection?.id ?? null);
        }
      } catch (error) {
        if (!active) return;
        setDraftState({ message: getSafeDraftError(error), status: "error" });
      }
    }

    void initializeLock();

    return () => {
      active = false;
      if (heartbeatTimer) clearInterval(heartbeatTimer);

      const csrf = csrfRef.current;
      const heldLockToken = lockTokenRef.current;
      csrfRef.current = null;
      lockTokenRef.current = null;

      if (csrf && heldLockToken) {
        void releasePageLock(page.id, csrf, heldLockToken).catch(() => undefined);
      }
    };
  }, [page.id]);

  const editable = lockState.status === "editable";
  const savedRemark = draftState.status === "ready" ? draftState.draft.editorSessionRemark ?? "" : "";
  const savedSchema = draftState.status === "ready" ? draftState.draft.schemaJson : null;
  const schemaIssues = useMemo(
    () => (workingSchema ? validatePageSchema(workingSchema) : []),
    [workingSchema],
  );
  const editorBindingData = useEditorContentBindingData(workingSchema);
  const allValidationIssues = [...schemaIssues, ...dependencyIssues];
  const selectedSection = workingSchema?.sections.find((section) => section.id === selectedBlockId);
  const selectedDefinition = selectedSection ? getBlockDefinition(selectedSection.component) : null;
  const deleteTarget = workingSchema?.sections.find((section) => section.id === deleteBlockId);
  const selectedComponent = selectedSection?.component;
  const selectedIssues = allValidationIssues.filter((issue) => issue.blockId === selectedBlockId);
  const isDirty =
    draftState.status === "ready" &&
    (editorSessionRemark !== savedRemark || JSON.stringify(workingSchema) !== JSON.stringify(savedSchema));
  const canSave =
    editable &&
    isDirty &&
    draftState.status === "ready" &&
    workingSchema !== null &&
    schemaIssues.length === 0 &&
    saveState.status !== "saving";
  const canPreview =
    editable &&
    !isDirty &&
    draftState.status === "ready" &&
    Boolean(draftState.draft.schemaHash) &&
    previewState.status !== "creating" &&
    saveState.status !== "saving";
  const canPublish =
    editable &&
    !isDirty &&
    draftState.status === "ready" &&
    Boolean(draftState.draft.schemaHash) &&
    schemaIssues.length === 0 &&
    previewState.status !== "creating" &&
    saveState.status !== "saving";
  const canRollback =
    editable &&
    !isDirty &&
    draftState.status === "ready" &&
    previewState.status !== "creating" &&
    saveState.status !== "saving";
  const canEditSelectedBlock =
    editable &&
    selectedDefinition !== null &&
    templateState.status === "ready" &&
    templateState.template.componentCode === selectedComponent;
  const selectedTemplateError =
    templateState.status === "error" && templateState.componentCode === selectedComponent
      ? templateState.message
      : null;
  const selectedTemplateLoading =
    Boolean(selectedComponent) &&
    !(templateState.status === "ready" && templateState.template.componentCode === selectedComponent) &&
    !selectedTemplateError;

  useEffect(() => {
    if (!selectedComponent) return;

    let active = true;

    void getComponentTemplate(selectedComponent)
      .then((template) => {
        if (!active) return;

        if (template.componentCode !== selectedComponent) {
          setTemplateState({
            componentCode: selectedComponent,
            message: "组件模板编码与草稿区块不一致，已停止属性编辑。",
            status: "error",
          });
          return;
        }

        setTemplateState({ template, status: "ready" });
      })
      .catch((error: unknown) => {
        if (active) {
          setTemplateState({
            componentCode: selectedComponent,
            message: getSafeTemplateError(error),
            status: "error",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedComponent]);

  useEffect(() => {
    if (!isDirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  async function handleSaveDraft() {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;

    if (!canSave || !csrf || !lockToken || draftState.status !== "ready" || !workingSchema) {
      return;
    }

    setSaveState({ status: "saving" });

    try {
      const contentIssues = await validatePageContentDependencies(workingSchema);
      setDependencyIssues(contentIssues);
      if (contentIssues.length > 0) {
        setSaveState({
          message: "内容依赖校验未通过，草稿未提交。请根据区块错误修复绑定后重试。",
          status: "error",
        });
        return;
      }

      const savedDraft = await savePageDraft({
        csrf,
        editorSessionRemark: editorSessionRemark.trim(),
        lockToken,
        pageId: page.id,
        schemaJson: workingSchema,
        version: draftState.draft.version,
      });

      setDraftState({ draft: savedDraft, status: "ready" });
      setWorkingSchema(savedDraft.schemaJson);
      setEditorSessionRemark(savedDraft.editorSessionRemark ?? "");
      setSaveState({ savedAt: savedDraft.updatedAt, status: "saved" });
    } catch (error) {
      if (isLockInvalidatingSaveError(error)) {
        lockTokenRef.current = null;
        setLockState({
          message: "保存请求被服务端拒绝，编辑锁需要重新获取。当前画布内容已保留。",
          status: "lost",
        });
      }

      setSaveState({ message: getSafeSaveError(error), status: "error" });
    }
  }

  async function handleCreatePreview() {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;

    if (!canPreview || !csrf || !lockToken || draftState.status !== "ready" || !draftState.draft.schemaHash) {
      return;
    }

    setPreviewState({ status: "creating" });

    try {
      const preview = await createPagePreview(page.id, csrf, lockToken, draftState.draft.schemaHash);
      router.push(`/admin/preview/pages/${page.id}/${preview.previewToken}`);
    } catch (error) {
      if (isLockInvalidatingSaveError(error)) {
        lockTokenRef.current = null;
        setLockState({ message: "预览请求被服务端拒绝，编辑锁需要重新获取。", status: "lost" });
      }

      setPreviewState({ message: getSafePreviewError(error), status: "error" });
    }
  }

  async function handleForceRelease() {
    const csrf = csrfRef.current;
    const reason = forceUnlockReason.trim();

    if (!csrf || !reason || forceReleaseState.status === "releasing") return;

    setForceReleaseState({ status: "releasing" });

    try {
      await forceReleasePageLock(page.id, csrf, reason);
      setForceUnlockOpen(false);
      setForceUnlockReason("");
      setForceReleaseState({ status: "idle" });
      setLockState({
        message: "编辑锁已强制释放。请刷新页面后重新获取编辑锁。",
        status: "error",
      });
    } catch (error) {
      setForceReleaseState({ message: getSafeForceReleaseError(error), status: "error" });
    }
  }

  async function handlePublish(changeSummary: string) {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;

    if (!canPublish || !csrf || !lockToken || draftState.status !== "ready") {
      throw new Error("当前草稿尚不能发布，请先保存修改并确认编辑锁有效。");
    }

    if (!workingSchema) {
      throw new Error("当前页面没有可发布的受控 Schema。");
    }

    const contentIssues = await validatePageContentDependencies(workingSchema);
    setDependencyIssues(contentIssues);
    if (contentIssues.length > 0) {
      throw new Error("内容依赖校验未通过，发布请求未提交。请根据区块错误修复绑定后重试。");
    }

    try {
      const publishedVersion = await publishPage(
        page.id,
        csrf,
        lockToken,
        draftState.draft.version,
        changeSummary,
      );
      await finishLifecycleMutation(
        csrf,
        `版本 ${publishedVersion.versionNo} 已发布。当前编辑会话已结束，请刷新页面重新获取编辑锁。`,
      );
    } catch (error) {
      handleLifecycleFailure(error, "发布");
      throw new Error(getSafeLifecycleError(error, "发布"));
    }
  }

  async function handleRollback(version: PageVersion, changeSummary: string) {
    const csrf = csrfRef.current;
    const lockToken = lockTokenRef.current;

    if (!canRollback || !csrf || !lockToken || draftState.status !== "ready") {
      throw new Error("当前不能回滚，请先保存或放弃未保存修改，并确认编辑锁有效。");
    }

    try {
      const rolledBackVersion = await rollbackPage(
        page.id,
        csrf,
        lockToken,
        version.id,
        draftState.draft.version,
        changeSummary,
      );
      await finishLifecycleMutation(
        csrf,
        `已从历史版本 ${version.versionNo} 生成并发布版本 ${rolledBackVersion.versionNo}。当前编辑会话已结束，请刷新页面查看权威状态。`,
      );
    } catch (error) {
      handleLifecycleFailure(error, "回滚");
      throw new Error(getSafeLifecycleError(error, "回滚"));
    }
  }

  async function finishLifecycleMutation(csrf: CsrfToken, message: string) {
    const lockToken = lockTokenRef.current;
    lifecycleCompletedRef.current = true;
    lockTokenRef.current = null;
    setPublishOpen(false);
    setHistoryOpen(false);

    if (lockToken) {
      await releasePageLock(page.id, csrf, lockToken).catch(() => undefined);
    }
    setLifecycleMessage(message);
    setLockState({ message, status: "lost" });
  }

  function handleLifecycleFailure(error: unknown, action: "发布" | "回滚") {
    if (!isLockInvalidatingSaveError(error)) return;
    lockTokenRef.current = null;
    setLockState({
      message: `${action}请求被服务端拒绝，编辑锁需要重新获取。当前画布内容已保留。`,
      status: "lost",
    });
  }

  function updateSelectedBlock(path: BlockConfigField["path"], value: JsonValue) {
    if (!canEditSelectedBlock || !selectedBlockId) return;

    setWorkingSchema((current) => current ? updateBlockConfig(current, selectedBlockId, path, value) : current);
    setDependencyIssues([]);
    setSaveState({ status: "idle" });
  }

  function toggleBlockVisibility(blockId: string) {
    if (!editable) return;

    setWorkingSchema((current) => {
      if (!current) return current;
      const target = current.sections.find((section) => section.id === blockId);
      if (!target || target.slot !== "main") return current;

      return {
        ...current,
        sections: current.sections.map((section) =>
          section.id === blockId ? { ...section, visible: !section.visible } : section,
        ),
      };
    });
    setSelectedBlockId(blockId);
    setDependencyIssues([]);
    setSaveState({ status: "idle" });
  }

  function moveBlock(blockId: string, direction: "down" | "up") {
    if (!editable) return;

    setWorkingSchema((current) => current ? moveHomeBlock(current, blockId, direction) : current);
    setSelectedBlockId(blockId);
    setDependencyIssues([]);
    setSaveState({ status: "idle" });
  }

  function addBlock(component: HomeBlockType) {
    if (!editable) return;
    const blockId = createBlockId(component);
    setWorkingSchema((current) => current ? addHomeBlock(current, component, blockId) : current);
    setSelectedBlockId(blockId);
    setAddBlockOpen(false);
    setDependencyIssues([]);
    setSaveState({ status: "idle" });
  }

  function copyBlock(blockId: string) {
    if (!editable) return;
    const source = workingSchema?.sections.find((section) => section.id === blockId);
    const definition = source ? getBlockDefinition(source.component) : null;
    if (!source || !definition?.isRepeatable || !(source.component in homeBlockTemplates)) return;
    const copyId = createBlockId(source.component as HomeBlockType);
    setWorkingSchema((current) => current ? copyHomeBlock(current, blockId, copyId) : current);
    setSelectedBlockId(copyId);
    setDependencyIssues([]);
    setSaveState({ status: "idle" });
  }

  function confirmDeleteBlock() {
    if (!editable || !deleteBlockId) return;
    setWorkingSchema((current) => {
      if (!current) return current;
      const ordered = [...current.sections]
        .filter((section) => section.slot === "main")
        .sort((left, right) => left.sortOrder - right.sortOrder);
      const targetIndex = ordered.findIndex((section) => section.id === deleteBlockId);
      const nextSelection = ordered[targetIndex + 1] ?? ordered[targetIndex - 1];
      setSelectedBlockId(nextSelection?.id ?? null);
      return deleteHomeBlock(current, deleteBlockId);
    });
    setDeleteBlockId(null);
    setDependencyIssues([]);
    setSaveState({ status: "idle" });
  }

  function reorderBlock(draggedId: string, targetId: string) {
    if (!editable) return;
    setWorkingSchema((current) => current ? reorderHomeBlock(current, draggedId, targetId) : current);
    setSelectedBlockId(draggedId);
    setDependencyIssues([]);
    setSaveState({ status: "idle" });
  }

  return (
    <div className={styles.editorShell}>
      <div className={styles.narrowGuidance} role="status">
        可视化编辑器首期仅支持桌面端，请使用宽度至少为 768px 的窗口。
      </div>

      <div className={styles.desktopEditor}>
        <header className={styles.toolbar}>
          <div>
            <p className={styles.eyebrow}>官网可视化编辑</p>
            <h1>{page.name}</h1>
          </div>

          <div className={styles.toolbarActions}>
            <LockStatus
              onForceUnlock={() => {
                setForceReleaseState({ status: "idle" });
                setForceUnlockOpen(true);
              }}
              onRetry={() => window.location.reload()}
              state={lockState}
            />
            <button
              className={styles.saveButton}
              disabled={!canSave}
              onClick={() => void handleSaveDraft()}
              type="button"
            >
              {saveState.status === "saving" ? "保存中…" : "保存草稿"}
            </button>
            <button
              className={styles.previewButton}
              disabled={!canPreview}
              onClick={() => void handleCreatePreview()}
              type="button"
            >
              {previewState.status === "creating" ? "生成预览中…" : "预览草稿"}
            </button>
            <button
              className={styles.historyButton}
              onClick={() => setHistoryOpen(true)}
              type="button"
            >
              历史版本
            </button>
            <button
              className={styles.publishButton}
              disabled={!canPublish}
              onClick={() => setPublishOpen(true)}
              type="button"
            >
              发布页面
            </button>
            <span className={styles.userName}>{user.displayName}</span>
            <Link className={styles.portalLink} href={page.routePath}>
              返回公开页面
            </Link>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside aria-label="页面信息" className={styles.sidebar}>
            <h2>当前页面</h2>
            <dl>
              <div>
                <dt>路径</dt>
                <dd>{page.routePath}</dd>
              </div>
              <div>
                <dt>页面 Key</dt>
                <dd>{page.pageKey}</dd>
              </div>
              <div>
                <dt>定义版本</dt>
                <dd>{page.version}</dd>
              </div>
              {draftState.status === "ready" || draftState.status === "initialization-required" ? (
                <div>
                  <dt>草稿版本</dt>
                  <dd>{draftState.draft.version}</dd>
                </div>
              ) : null}
            </dl>
            <button
              className={styles.addBlockButton}
              disabled={!editable || draftState.status !== "ready"}
              onClick={() => setAddBlockOpen(true)}
              type="button"
            >
              新增区块
            </button>
          </aside>

          <main aria-label="页面编辑画布" className={styles.canvas}>
            <EditorCanvas
              draftState={draftState}
              editable={editable}
              onCopyBlock={copyBlock}
              onDeleteBlock={setDeleteBlockId}
              onMoveBlock={moveBlock}
              onReorderBlock={reorderBlock}
              onSelectBlock={setSelectedBlockId}
              onToggleBlockVisibility={toggleBlockVisibility}
              resolvedDataByBlockId={editorBindingData}
              schema={workingSchema}
              selectedBlockId={selectedBlockId}
            />
          </main>

          <aside aria-label="属性面板" className={styles.propertiesPanel}>
            <h2>属性</h2>
            {draftState.status === "initialization-required" ? (
              <div className={styles.validationSummary} role="alert">
                <strong>草稿尚未安全初始化</strong>
                <p>
                  当前草稿没有 Schema。为防止覆盖已发布内容，前端不会保存空白或根据公开页面反推的 Schema；请先由后端从完整发布快照或受控默认模板初始化草稿。
                </p>
              </div>
            ) : null}
            {selectedSection && selectedDefinition ? (
              <div className={styles.propertyGroup}>
                <div className={styles.propertyHeading}>
                  <strong>{selectedDefinition.label ?? selectedSection.component}</strong>
                  {templateState.status === "ready" && templateState.template.componentCode === selectedComponent ? (
                    <span>{templateState.template.name} · v{templateState.template.version}</span>
                  ) : null}
                </div>
                {selectedTemplateLoading ? (
                  <p role="status">正在校验组件模板…</p>
                ) : null}
                {selectedTemplateError ? (
                  <p className={styles.inlineError} role="alert">{selectedTemplateError}</p>
                ) : null}
                <BlockPropertiesPanel
                  definition={selectedDefinition}
                  disabled={!canEditSelectedBlock}
                  issues={selectedIssues}
                  onChange={updateSelectedBlock}
                  section={selectedSection}
                />
              </div>
            ) : selectedSection ? (
              <div className={styles.propertyGroup}>
                <div className={styles.propertyHeading}>
                  <strong>{selectedSection.component}</strong>
                  <span>区块 ID：{selectedSection.id}</span>
                </div>
                <p>该区块已可在画布中选择，正式属性 DTO 和编辑控件将在对应开发任务中接入。</p>
              </div>
            ) : (
              <p>请在画布中选择一个区块，查看和编辑其属性。</p>
            )}
            {allValidationIssues.length > 0 ? (
              <div className={styles.validationSummary} role="alert">
                <strong>页面配置尚不能保存或发布</strong>
                <ul>
                  {allValidationIssues.map((issue, index) => (
                    <li key={`${issue.blockId ?? "page"}-${issue.field ?? "schema"}-${index}`}>
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className={styles.remarkField}>
              <label htmlFor="editor-session-remark">编辑备注</label>
              <textarea
                disabled={!editable || draftState.status !== "ready"}
                id="editor-session-remark"
                maxLength={255}
                onChange={(event) => {
                  setEditorSessionRemark(event.target.value);
                  setSaveState({ status: "idle" });
                }}
                rows={4}
                value={editorSessionRemark}
              />
              <span>{editorSessionRemark.length}/255</span>
            </div>
            <SaveFeedback state={saveState} />
            <PreviewFeedback state={previewState} />
            {lifecycleMessage ? (
              <p className={styles.lifecycleFeedback} role="status">{lifecycleMessage}</p>
            ) : null}
          </aside>
        </div>
      </div>
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
      <AddBlockDialog
        existingComponents={workingSchema?.sections.map((section) => section.component) ?? []}
        onAdd={addBlock}
        onClose={() => setAddBlockOpen(false)}
        open={addBlockOpen}
      />
      <DeleteBlockDialog
        blockLabel={deleteTarget ? getBlockDefinition(deleteTarget.component)?.label ?? deleteTarget.component : "所选"}
        onClose={() => setDeleteBlockId(null)}
        onConfirm={confirmDeleteBlock}
        open={deleteTarget !== undefined}
      />
      {publishOpen ? (
        <PublishPageDialog
          onClose={() => setPublishOpen(false)}
          onPublish={handlePublish}
          pageName={page.name}
        />
      ) : null}
      {historyOpen ? (
        <VersionHistoryDialog
          canRollback={canRollback}
          onClose={() => setHistoryOpen(false)}
          onRollback={handleRollback}
          pageId={page.id}
        />
      ) : null}
    </div>
  );
}

function SaveFeedback({ state }: Readonly<{ state: SaveState }>) {
  if (state.status === "idle") return null;
  if (state.status === "saving") return <p className={styles.saveFeedback} role="status">正在保存草稿…</p>;
  if (state.status === "saved") {
    return (
      <p className={styles.saveFeedback} data-status="success" role="status">
        草稿已保存 · {formatTime(state.savedAt)}
      </p>
    );
  }

  return <p className={styles.saveFeedback} data-status="error" role="alert">{state.message}</p>;
}

function PreviewFeedback({ state }: Readonly<{ state: PreviewState }>) {
  if (state.status !== "error") return null;

  return <p className={styles.saveFeedback} data-status="error" role="alert">{state.message}</p>;
}

type ForceUnlockDialogProps = {
  onClose: () => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  open: boolean;
  reason: string;
  state: ForceReleaseState;
};

function ForceUnlockDialog({
  onClose,
  onReasonChange,
  onSubmit,
  open,
  reason,
  state,
}: Readonly<ForceUnlockDialogProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby="force-unlock-title"
      className={styles.forceUnlockDialog}
      onCancel={(event) => {
        if (state.status === "releasing") {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={() => {
        if (state.status !== "releasing") onClose();
      }}
      ref={dialogRef}
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <p className={styles.eyebrow}>受保护操作</p>
        <h2 id="force-unlock-title">强制释放编辑锁</h2>
        <p>此操作会使当前持锁管理员立即失去编辑权限，并由服务端记录审计日志。</p>
        <label htmlFor="force-unlock-reason">解锁原因</label>
        <textarea
          autoFocus
          disabled={state.status === "releasing"}
          id="force-unlock-reason"
          onChange={(event) => onReasonChange(event.target.value)}
          required
          rows={4}
          value={reason}
        />
        {state.status === "error" ? (
          <p className={styles.inlineError} role="alert">{state.message}</p>
        ) : null}
        <div className={styles.dialogActions}>
          <button disabled={state.status === "releasing"} onClick={onClose} type="button">
            取消
          </button>
          <button disabled={!reason.trim() || state.status === "releasing"} type="submit">
            {state.status === "releasing" ? "正在释放…" : "确认强制解锁"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function EditorCanvas({
  draftState,
  editable,
  onCopyBlock,
  onDeleteBlock,
  onMoveBlock,
  onReorderBlock,
  onSelectBlock,
  onToggleBlockVisibility,
  resolvedDataByBlockId,
  schema,
  selectedBlockId,
}: Readonly<{
  draftState: DraftState;
  editable: boolean;
  onCopyBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: "down" | "up") => void;
  onReorderBlock: (draggedId: string, targetId: string) => void;
  onSelectBlock: (blockId: string) => void;
  onToggleBlockVisibility: (blockId: string) => void;
  resolvedDataByBlockId: Readonly<Record<string, JsonObject>>;
  schema: PageSchema | null;
  selectedBlockId: string | null;
}>) {
  if (draftState.status === "ready" && schema) {
    return (
      <div className={styles.canvasDocument} data-editable={editable}>
        {!editable ? (
          <p className={styles.readOnlyNotice} role="alert">
            编辑锁不可用，当前草稿仅供查看。
          </p>
        ) : null}
        <PageRenderer
          mode="editor"
          onCopyBlock={editable ? onCopyBlock : undefined}
          onDeleteBlock={editable ? onDeleteBlock : undefined}
          onMoveBlock={editable ? onMoveBlock : undefined}
          onReorderBlock={editable ? onReorderBlock : undefined}
          onSelectBlock={onSelectBlock}
          onToggleBlockVisibility={editable ? onToggleBlockVisibility : undefined}
          resolvedDataByBlockId={resolvedDataByBlockId}
          schema={schema}
          selectedBlockId={selectedBlockId ?? undefined}
        />
      </div>
    );
  }

  let title = "等待编辑锁";
  let description = "获得独占编辑锁后才会读取页面草稿。";

  if (draftState.status === "loading") {
    title = "正在读取首页草稿";
    description = "正在校验并加载受控页面 Schema。";
  } else if (draftState.status === "error") {
    title = "无法读取页面草稿";
    description = draftState.message;
  } else if (draftState.status === "initialization-required") {
    title = "草稿尚未安全初始化";
    description = "当前草稿 Schema 为空。为保护已发布内容，前端不会构造或保存空白 Schema；需要后端从完整发布快照或受控默认模板完成初始化。";
  } else if (!editable) {
    title = "只读模式";
    description = "当前不能读取或修改草稿，请先获得有效编辑锁。";
  }

  return (
    <section className={styles.canvasState} data-editable={editable}>
      <p className={styles.eyebrow}>{editable ? "独占编辑会话" : "受保护状态"}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {draftState.status === "error" ? (
        <button className={styles.retryButton} onClick={() => window.location.reload()} type="button">
          刷新重试
        </button>
      ) : null}
    </section>
  );
}

function LockStatus({
  state,
  onForceUnlock,
  onRetry,
}: Readonly<{
  state: LockState;
  onForceUnlock: () => void;
  onRetry: () => void;
}>) {
  if (state.status === "acquiring") {
    return <p className={styles.lockStatus} role="status">正在获取编辑锁…</p>;
  }

  if (state.status === "editable") {
    return (
      <p className={styles.lockStatus} data-status="success" role="status">
        可编辑 · 锁有效至 {formatTime(state.expiresAt)}
      </p>
    );
  }

  if (state.status === "conflict") {
    return (
      <div className={styles.lockStatusGroup}>
        <p className={styles.lockStatus} data-status="warning" role="alert">
          {state.ownerDisplayName ? `${state.ownerDisplayName} 正在编辑` : "页面已被其他管理员锁定"}
          {state.expiresAt ? ` · 预计 ${formatTime(state.expiresAt)} 释放` : ""}
        </p>
        {state.forceUnlockAllowed ? (
          <button className={styles.forceUnlockButton} onClick={onForceUnlock} type="button">
            强制解锁
          </button>
        ) : null}
        <button className={styles.retryButton} onClick={onRetry} type="button">刷新状态</button>
      </div>
    );
  }

  return (
    <div className={styles.lockStatusGroup}>
      <p className={styles.lockStatus} data-status="error" role="alert">
        {state.message}
      </p>
      <button className={styles.retryButton} onClick={onRetry} type="button">刷新重试</button>
    </div>
  );
}

function clampHeartbeat(seconds: number) {
  return Math.min(Math.max(seconds, 5), 300);
}

function createBlockId(component: HomeBlockType) {
  const prefix = component.replace(/Section$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "未知时间"
    : new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function getSafeLockError(error: unknown) {
  if (error instanceof ApiError && error.kind === "authentication") {
    return "登录状态已失效，请重新登录后再进入编辑器。";
  }

  if (error instanceof ApiError && error.kind === "authorization") {
    return "当前账号没有获取页面编辑锁的权限。";
  }

  return "暂时无法获取编辑锁，请确认后台接口可用后重试。";
}

function getSafeDraftError(error: unknown) {
  if (error instanceof ApiError && String(error.code) === "90004") {
    return "页面草稿记录不存在。当前接口没有安全初始化草稿的能力，前端已停止加载，避免覆盖已发布内容。";
  }

  if (error instanceof ApiError && error.kind === "authentication") {
    return "登录状态已失效，草稿没有加载。";
  }

  if (error instanceof ApiError && error.kind === "authorization") {
    return "当前账号没有读取页面草稿的权限。";
  }

  if (error instanceof ApiError && error.kind === "unexpected-response") {
    return "草稿 Schema 与当前前端契约不一致，已停止渲染。";
  }

  return "草稿接口暂时不可用，请稍后重试。";
}

function getSafeTemplateError(error: unknown) {
  if (error instanceof ApiError && error.kind === "authentication") {
    return "登录状态已失效，无法读取组件模板。";
  }

  if (error instanceof ApiError && error.kind === "authorization") {
    return "当前账号没有读取组件模板的权限。";
  }

  if (error instanceof ApiError && error.kind === "unexpected-response") {
    return "组件模板与当前前端契约不一致，已停止属性编辑。";
  }

  return "组件模板暂时不可用，属性编辑已禁用；当前草稿不会被改写。";
}

function getSafePreviewError(error: unknown) {
  if (error instanceof ApiError && error.kind === "authentication") {
    return "登录状态已失效，无法生成预览。";
  }

  if (error instanceof ApiError && error.kind === "authorization") {
    return "当前会话无权生成预览。";
  }

  if (error instanceof ApiError && error.kind === "conflict" && String(error.code) === pageBuilderErrorCodes.versionConflict) {
    return "草稿已被更新，请先保存或刷新后再生成预览。";
  }

  if (error instanceof ApiError && error.kind === "validation") {
    return "当前草稿尚不能预览，请先完成必要配置。";
  }

  return "预览暂时无法生成，请稍后重试。";
}

function getSafeForceReleaseError(error: unknown) {
  if (error instanceof ApiError && error.kind === "authentication") {
    return "登录状态已失效，无法强制解锁。";
  }

  if (error instanceof ApiError && error.kind === "authorization") {
    return "当前账号没有强制解锁权限。";
  }

  if (error instanceof ApiError && error.kind === "conflict") {
    return "锁状态已变化，请刷新后重新确认。";
  }

  return "强制解锁失败，当前锁状态没有被前端更改。";
}

function getSafeLifecycleError(error: unknown, action: "发布" | "回滚") {
  if (error instanceof ApiError && error.kind === "authentication") {
    return `登录状态已失效，${action}未执行。请重新登录后再试。`;
  }

  if (error instanceof ApiError && error.kind === "authorization") {
    return `当前会话没有${action}权限，公开页面未改变。`;
  }

  if (error instanceof ApiError && error.kind === "conflict") {
    if (String(error.code) === pageBuilderErrorCodes.versionConflict) {
      return `草稿版本已变化，${action}未执行。请刷新并核对最新版本。`;
    }

    return `编辑锁已过期或归属不匹配，${action}未执行。请刷新后重新获取编辑锁。`;
  }

  if (error instanceof ApiError && error.kind === "validation") {
    return `服务端校验未通过，${action}未执行。请检查页面配置和内容依赖。`;
  }

  if (error instanceof ApiError && error.kind === "network") {
    return `网络连接失败，无法确认${action}结果。请刷新历史版本或公开页面核对后再操作。`;
  }

  if (error instanceof ApiError && error.kind === "unexpected-response") {
    return `服务返回的${action}结果不符合当前接口契约，请联系后端确认接口版本。`;
  }

  return `${action}失败，公开页面未被前端改写。请稍后重试。`;
}

function isLockInvalidatingSaveError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.kind === "authentication" || error.kind === "authorization") return true;
  return error.kind === "conflict" && String(error.code) !== pageBuilderErrorCodes.versionConflict;
}

function getSafeSaveError(error: unknown) {
  if (error instanceof ApiError && error.kind === "authentication") {
    return "登录状态已失效，草稿未保存。";
  }

  if (error instanceof ApiError && error.kind === "authorization") {
    return "当前会话无权保存，草稿未保存。请刷新后重新获取编辑锁。";
  }

  if (error instanceof ApiError && error.kind === "conflict" && String(error.code) === pageBuilderErrorCodes.versionConflict) {
    return "草稿版本已被更新，本次保存没有覆盖服务器内容。当前画布已保留，请刷新后比较差异。";
  }

  if (error instanceof ApiError && error.kind === "conflict") {
    return "编辑锁已过期或归属不匹配，草稿未保存。";
  }

  if (error instanceof ApiError && error.kind === "validation") {
    return "草稿 Schema 未通过服务端校验，请检查区块配置。";
  }

  if (error instanceof ApiError && error.kind === "network") {
    return "网络连接失败，草稿未保存，当前画布内容仍保留在本页。";
  }

  return "草稿保存失败，服务器内容未被覆盖。";
}
