// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContentVersionHistoryDialog,
  OfflineContentDialog,
  PublishContentDialog,
} from "@/features/content-editor/ContentLifecycleDialogs";
import { getContentVersions } from "@/services/content-editor-api";

vi.mock("@/services/content-editor-api", () => ({ getContentVersions: vi.fn() }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getContentVersions).mockResolvedValue([{
    changeSummary: "稳定版本",
    id: 31,
    publishedAt: "2026-07-21T10:00:00",
    publisher: "管理员 A",
    resourceId: 7,
    versionNo: 3,
  }]);
});

describe("content lifecycle dialogs", () => {
  it("requires a publish summary", async () => {
    const onPublish = vi.fn().mockResolvedValue(undefined);
    render(<PublishContentDialog label="产品" onClose={() => undefined} onPublish={onPublish} />);
    const submit = screen.getByRole("button", { name: "确认发布" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText("发布说明"), { target: { value: "发布产品详情" } });
    fireEvent.click(submit);
    await waitFor(() => expect(onPublish).toHaveBeenCalledWith("发布产品详情"));
  });

  it("loads a shared version list and confirms rollback", async () => {
    const onRollback = vi.fn().mockResolvedValue(undefined);
    render(<ContentVersionHistoryDialog canRollback kind="product" onClose={() => undefined} onRollback={onRollback} resourceId={7} />);
    fireEvent.click(await screen.findByRole("button", { name: "回滚到此版本" }));
    fireEvent.change(screen.getByLabelText("回滚说明"), { target: { value: "恢复稳定版本" } });
    fireEvent.click(screen.getByRole("button", { name: "确认回滚" }));
    await waitFor(() => expect(onRollback).toHaveBeenCalledWith(expect.objectContaining({ id: 31 }), "恢复稳定版本"));
    expect(getContentVersions).toHaveBeenCalledWith("product", 7);
  });

  it("requires an explicit offline reason", async () => {
    const onOffline = vi.fn().mockResolvedValue(undefined);
    render(<OfflineContentDialog label="案例" onClose={() => undefined} onOffline={onOffline} />);
    fireEvent.change(screen.getByLabelText("下线原因"), { target: { value: "案例已结束展示" } });
    fireEvent.click(screen.getByRole("button", { name: "确认下线" }));
    await waitFor(() => expect(onOffline).toHaveBeenCalledWith("案例已结束展示"));
  });
});
