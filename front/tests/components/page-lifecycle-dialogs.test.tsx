// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PublishPageDialog, VersionHistoryDialog } from "@/features/editor/PageLifecycleDialogs";
import { getPageVersions } from "@/services/admin-api";

vi.mock("@/services/admin-api", () => ({
  getPageVersions: vi.fn(),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPageVersions).mockResolvedValue([{
    changeSummary: "稳定版本",
    createdAt: "2026-07-15T10:00:00",
    id: 18,
    pageId: 7,
    schemaHash: "schema-hash",
    sourceType: "PUBLISH",
    version: 3,
    versionNo: 3,
  }]);
});

describe("page lifecycle dialogs", () => {
  it("requires a change summary before publishing", async () => {
    const onPublish = vi.fn().mockResolvedValue(undefined);
    render(<PublishPageDialog onClose={() => undefined} onPublish={onPublish} pageName="首页" />);

    const submit = screen.getByRole("button", { name: "确认发布" });
    expect(submit.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("发布说明"), { target: { value: "更新首页展示内容" } });
    fireEvent.click(submit);

    await waitFor(() => expect(onPublish).toHaveBeenCalledWith("更新首页展示内容"));
  });

  it("loads versions and confirms an explicit rollback target", async () => {
    const onRollback = vi.fn().mockResolvedValue(undefined);
    render(
      <VersionHistoryDialog
        canRollback
        onClose={() => undefined}
        onRollback={onRollback}
        pageId={7}
      />,
    );

    const rollbackButton = await screen.findByRole("button", { name: "回滚到此版本" });
    fireEvent.click(rollbackButton);

    expect(screen.getByRole("heading", { name: "确认回滚到版本 3" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("回滚说明"), { target: { value: "恢复稳定版本" } });
    fireEvent.click(screen.getByRole("button", { name: "确认回滚" }));

    await waitFor(() => expect(onRollback).toHaveBeenCalledWith(
      expect.objectContaining({ id: 18, versionNo: 3 }),
      "恢复稳定版本",
    ));
    expect(getPageVersions).toHaveBeenCalledWith(7, 1, 50);
  });

  it("keeps rollback disabled without a valid editor lock", async () => {
    render(
      <VersionHistoryDialog
        canRollback={false}
        onClose={() => undefined}
        onRollback={async () => undefined}
        pageId={7}
      />,
    );

    const rollbackButton = await screen.findByRole("button", { name: "回滚到此版本" });
    expect(rollbackButton.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/当前没有有效编辑锁/)).toBeTruthy();
  });
});
