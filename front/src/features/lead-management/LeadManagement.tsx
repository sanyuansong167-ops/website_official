"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  exportAdminLeads,
  getAdminLeadDetail,
  getAdminLeadPage,
  updateAdminLeadStatus,
} from "@/services/admin-lead-api";
import { getCsrfToken } from "@/services/admin-api";
import { ApiError } from "@/services/http";
import type { AdminSession } from "@/types/admin";
import type { AdminLeadDetail, AdminLeadPage, AdminLeadQuery, LeadStatus } from "@/types/lead";
import styles from "./LeadManagement.module.css";

const PAGE_SIZE = 20;
const leadStatuses: ReadonlyArray<{ label: string; value: LeadStatus }> = [
  { label: "未处理", value: 0 },
  { label: "处理中", value: 1 },
  { label: "已归档", value: 2 },
  { label: "无效线索", value: 3 },
];

type PageState =
  | { status: "loading" }
  | { message: string; status: "error" }
  | { page: AdminLeadPage; status: "ready" };

type DetailState =
  | { status: "closed" }
  | { leadId: number; status: "loading" }
  | { leadId: number; message: string; status: "error" }
  | { detail: AdminLeadDetail; status: "ready" };

type ActionState =
  | { status: "idle" }
  | { status: "pending" }
  | { message: string; status: "error" }
  | { message: string; status: "success" };

export function LeadManagement({ user }: Readonly<{ user: AdminSession }>) {
  const [query, setQuery] = useState<AdminLeadQuery>({ pageNo: 1, pageSize: PAGE_SIZE });
  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"" | `${LeadStatus}`>("");
  const [submitAtStart, setSubmitAtStart] = useState("");
  const [submitAtEnd, setSubmitAtEnd] = useState("");
  const [filterMessage, setFilterMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailState, setDetailState] = useState<DetailState>({ status: "closed" });
  const [nextStatus, setNextStatus] = useState<LeadStatus>(0);
  const [statusAction, setStatusAction] = useState<ActionState>({ status: "idle" });
  const [exportAction, setExportAction] = useState<ActionState>({ status: "idle" });

  useEffect(() => {
    let active = true;
    void getAdminLeadPage(query)
      .then((page) => {
        if (active) setPageState({ page, status: "ready" });
      })
      .catch((error: unknown) => {
        if (active) setPageState({ message: getSafeError(error, "线索列表读取失败，请稍后重试。"), status: "error" });
      });
    return () => { active = false; };
  }, [query, refreshKey]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitAtStart && submitAtEnd && submitAtStart > submitAtEnd) {
      setFilterMessage("开始时间不能晚于结束时间。");
      return;
    }
    setFilterMessage(null);
    setSelectedIds(new Set());
    setPageState({ status: "loading" });
    setQuery({
      pageNo: 1,
      pageSize: PAGE_SIZE,
      ...(statusFilter === "" ? {} : { status: Number(statusFilter) as LeadStatus }),
      ...(submitAtEnd ? { submitAtEnd } : {}),
      ...(submitAtStart ? { submitAtStart } : {}),
    });
  }

  function resetFilters() {
    setStatusFilter("");
    setSubmitAtStart("");
    setSubmitAtEnd("");
    setFilterMessage(null);
    setSelectedIds(new Set());
    setPageState({ status: "loading" });
    setQuery({ pageNo: 1, pageSize: PAGE_SIZE });
  }

  async function openDetail(leadId: number) {
    setStatusAction({ status: "idle" });
    setDetailState({ leadId, status: "loading" });
    try {
      const detail = await getAdminLeadDetail(leadId);
      setNextStatus(detail.status);
      setDetailState({ detail, status: "ready" });
    } catch (error) {
      setDetailState({ leadId, message: getSafeError(error, "线索详情读取失败，请稍后重试。"), status: "error" });
    }
  }

  async function saveStatus() {
    if (detailState.status !== "ready" || statusAction.status === "pending") return;
    if (nextStatus === detailState.detail.status) {
      setStatusAction({ message: "当前线索已经是该状态。", status: "error" });
      return;
    }

    setStatusAction({ status: "pending" });
    try {
      const csrf = await getCsrfToken();
      await updateAdminLeadStatus(detailState.detail.id, nextStatus, detailState.detail.version, csrf);
      const detail = await getAdminLeadDetail(detailState.detail.id);
      setNextStatus(detail.status);
      setDetailState({ detail, status: "ready" });
      setStatusAction({ message: "线索状态已更新。", status: "success" });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setStatusAction({ message: getSafeStatusError(error), status: "error" });
    }
  }

  async function exportSelected() {
    if (!selectedIds.size || exportAction.status === "pending") return;
    await runExport({ exportMode: "SELECTED", selectedIds: [...selectedIds] });
  }

  async function exportFiltered() {
    if (!hasActiveFilter(query) || exportAction.status === "pending") return;
    await runExport({
      exportMode: "FILTERED",
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.submitAtEnd ? { submitAtEnd: query.submitAtEnd } : {}),
      ...(query.submitAtStart ? { submitAtStart: query.submitAtStart } : {}),
    });
  }

  async function runExport(request: Parameters<typeof exportAdminLeads>[0]) {
    setExportAction({ status: "pending" });
    try {
      const csrf = await getCsrfToken();
      const file = await exportAdminLeads(request, csrf);
      downloadFile(file.blob, file.filename);
      setExportAction({ message: "Excel 文件已生成并开始下载。", status: "success" });
    } catch (error) {
      setExportAction({ message: getSafeError(error, "线索导出失败，请稍后重试。"), status: "error" });
    }
  }

  const page = pageState.status === "ready" ? pageState.page : null;
  const allVisibleSelected = Boolean(page?.list.length) && page!.list.every((lead) => selectedIds.has(lead.id));
  const totalPages = page ? Math.max(1, Math.ceil(page.total / page.pageSize)) : 1;

  return (
    <main className={styles.leadManagement}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>阶段三 · 联系与线索</p>
          <h1>预约线索管理</h1>
          <p>列表默认展示脱敏信息；查看完整联系方式与导出操作会由后端记录审计日志。</p>
        </div>
        <div className={styles.headerActions}>
          <span>{user.displayName || user.username}</span>
          <Link className={styles.secondaryButton} href="/admin">返回后台首页</Link>
          <Link className={styles.secondaryButton} href="/contact">查看联系页</Link>
        </div>
      </header>

      <section className={styles.content}>
        <form className={styles.filters} onSubmit={applyFilters}>
          <label>
            <span>处理状态</span>
            <select onChange={(event) => setStatusFilter(event.target.value as "" | `${LeadStatus}`)} value={statusFilter}>
              <option value="">全部状态</option>
              {leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label>
            <span>提交开始时间</span>
            <input onChange={(event) => setSubmitAtStart(event.target.value)} type="datetime-local" value={submitAtStart} />
          </label>
          <label>
            <span>提交结束时间</span>
            <input onChange={(event) => setSubmitAtEnd(event.target.value)} type="datetime-local" value={submitAtEnd} />
          </label>
          <div className={styles.filterActions}>
            <button className={styles.primaryButton} type="submit">查询</button>
            <button className={styles.secondaryButton} onClick={resetFilters} type="button">重置</button>
          </div>
          {filterMessage ? <p className={styles.error} role="alert">{filterMessage}</p> : null}
        </form>

        <section className={styles.panel} aria-labelledby="lead-list-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="lead-list-title">预约记录</h2>
              <p>{page ? `共 ${page.total} 条，已选择 ${selectedIds.size} 条` : "正在读取线索数据"}</p>
            </div>
            <div className={styles.panelActions}>
              <button className={styles.secondaryButton} disabled={!hasActiveFilter(query) || exportAction.status === "pending"} onClick={() => void exportFiltered()} type="button">导出筛选结果</button>
              <button className={styles.primaryButton} disabled={!selectedIds.size || exportAction.status === "pending"} onClick={() => void exportSelected()} type="button">导出已选</button>
            </div>
          </div>

          {exportAction.status === "error" || exportAction.status === "success" ? (
            <p className={exportAction.status === "error" ? styles.error : styles.success} role="status">{exportAction.message}</p>
          ) : null}
          {pageState.status === "loading" ? <p className={styles.state} role="status">正在读取预约线索…</p> : null}
          {pageState.status === "error" ? (
            <div className={styles.state}>
              <p className={styles.error} role="alert">{pageState.message}</p>
              <button className={styles.secondaryButton} onClick={() => { setPageState({ status: "loading" }); setRefreshKey((value) => value + 1); }} type="button">重新加载</button>
            </div>
          ) : null}
          {page && page.list.length === 0 ? <p className={styles.state}>当前筛选条件下暂无预约线索。</p> : null}
          {page && page.list.length > 0 ? (
            <div className={styles.tableViewport}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      <input
                        aria-label="选择当前页全部线索"
                        checked={allVisibleSelected}
                        onChange={(event) => setSelectedIds((current) => toggleVisibleIds(current, page.list.map((lead) => lead.id), event.target.checked))}
                        type="checkbox"
                      />
                    </th>
                    <th scope="col">联系人 / 公司</th>
                    <th scope="col">联系方式（脱敏）</th>
                    <th scope="col">需求摘要</th>
                    <th scope="col">状态</th>
                    <th scope="col">提交时间</th>
                    <th scope="col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {page.list.map((lead) => (
                    <tr key={lead.id}>
                      <td><input aria-label={`选择线索 ${lead.id}`} checked={selectedIds.has(lead.id)} onChange={(event) => setSelectedIds((current) => toggleId(current, lead.id, event.target.checked))} type="checkbox" /></td>
                      <td><strong>{lead.name}</strong><span>{lead.company}</span></td>
                      <td><span>{lead.maskedEmail}</span><span>{lead.maskedPhone || "未填写电话"}</span></td>
                      <td>{lead.demandDescriptionPreview || "未填写需求描述"}</td>
                      <td><span className={styles.statusBadge} data-status={lead.status}>{lead.statusLabel}</span></td>
                      <td>{formatDateTime(lead.submittedAt)}</td>
                      <td><button className={styles.textButton} onClick={() => void openDetail(lead.id)} type="button">查看详情</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {page ? (
            <nav aria-label="线索列表分页" className={styles.pagination}>
              <button className={styles.secondaryButton} disabled={page.pageNo <= 1} onClick={() => { setPageState({ status: "loading" }); setQuery((current) => ({ ...current, pageNo: current.pageNo - 1 })); }} type="button">上一页</button>
              <span>第 {page.pageNo} / {totalPages} 页</span>
              <button className={styles.secondaryButton} disabled={page.pageNo >= totalPages} onClick={() => { setPageState({ status: "loading" }); setQuery((current) => ({ ...current, pageNo: current.pageNo + 1 })); }} type="button">下一页</button>
            </nav>
          ) : null}
        </section>
      </section>

      <LeadDetailDialog
        nextStatus={nextStatus}
        onClose={() => setDetailState({ status: "closed" })}
        onRetry={(leadId) => void openDetail(leadId)}
        onSaveStatus={() => void saveStatus()}
        onStatusChange={setNextStatus}
        state={detailState}
        statusAction={statusAction}
      />
    </main>
  );
}

function LeadDetailDialog({
  nextStatus,
  onClose,
  onRetry,
  onSaveStatus,
  onStatusChange,
  state,
  statusAction,
}: Readonly<{
  nextStatus: LeadStatus;
  onClose: () => void;
  onRetry: (leadId: number) => void;
  onSaveStatus: () => void;
  onStatusChange: (status: LeadStatus) => void;
  state: DetailState;
  statusAction: ActionState;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state.status !== "closed" && !dialog.open) dialog.showModal();
    if (state.status === "closed" && dialog.open) dialog.close();
  }, [state.status]);

  return (
    <dialog aria-labelledby="lead-detail-title" className={styles.dialog} onCancel={onClose} onClose={onClose} ref={dialogRef}>
      <div className={styles.dialogHeader}>
        <div>
          <p className={styles.eyebrow}>敏感信息 · 查看行为会被审计</p>
          <h2 id="lead-detail-title">预约线索详情</h2>
        </div>
        <button aria-label="关闭线索详情" className={styles.closeButton} onClick={onClose} type="button">关闭</button>
      </div>
      {state.status === "loading" ? <p className={styles.state} role="status">正在读取完整线索信息…</p> : null}
      {state.status === "error" ? <div className={styles.state}><p className={styles.error} role="alert">{state.message}</p><button className={styles.secondaryButton} onClick={() => onRetry(state.leadId)} type="button">重新加载</button></div> : null}
      {state.status === "ready" ? (
        <div className={styles.dialogBody}>
          <dl className={styles.detailGrid}>
            <div><dt>姓名</dt><dd>{state.detail.name}</dd></div>
            <div><dt>公司</dt><dd>{state.detail.company}</dd></div>
            <div><dt>邮箱</dt><dd>{state.detail.email}</dd></div>
            <div><dt>电话</dt><dd>{state.detail.phone || "未填写"}</dd></div>
            <div><dt>提交时间</dt><dd>{formatDateTime(state.detail.submittedAt)}</dd></div>
            <div><dt>提交 IP</dt><dd>{state.detail.submitIp}</dd></div>
            <div className={styles.fullWidth}><dt>需求描述</dt><dd>{state.detail.demandDescription || "未填写需求描述"}</dd></div>
          </dl>
          <section className={styles.statusEditor} aria-labelledby="lead-status-title">
            <div><h3 id="lead-status-title">跟进状态</h3><p>当前状态：{state.detail.statusLabel}</p></div>
            <label><span>更新为</span><select disabled={statusAction.status === "pending"} onChange={(event) => onStatusChange(Number(event.target.value) as LeadStatus)} value={nextStatus}>{leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
            <button className={styles.primaryButton} disabled={statusAction.status === "pending" || nextStatus === state.detail.status} onClick={onSaveStatus} type="button">{statusAction.status === "pending" ? "正在更新…" : "更新状态"}</button>
          </section>
          {statusAction.status === "error" || statusAction.status === "success" ? <p className={statusAction.status === "error" ? styles.error : styles.success} role="status">{statusAction.message}</p> : null}
        </div>
      ) : null}
    </dialog>
  );
}

function hasActiveFilter(query: AdminLeadQuery) {
  return query.status !== undefined || Boolean(query.submitAtStart) || Boolean(query.submitAtEnd);
}

function toggleId(current: Set<number>, id: number, checked: boolean) {
  const next = new Set(current);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}

function toggleVisibleIds(current: Set<number>, ids: number[], checked: boolean) {
  const next = new Set(current);
  for (const id of ids) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return next;
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
}

function getSafeStatusError(error: unknown) {
  if (error instanceof ApiError && error.kind === "conflict") return "线索已被其他管理员更新，请重新打开详情后再试。";
  return getSafeError(error, "线索状态更新失败，请稍后重试。");
}

function getSafeError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.kind === "authentication") return "登录已失效，请重新登录后台。";
  if (error instanceof ApiError && error.kind === "authorization") return "当前账号没有管理预约线索的权限。";
  if (error instanceof ApiError && error.kind === "validation") return "请求条件不合法，请检查后重试。";
  if (error instanceof ApiError && error.kind === "network") return "无法连接后台服务，请检查服务状态后重试。";
  return fallback;
}
