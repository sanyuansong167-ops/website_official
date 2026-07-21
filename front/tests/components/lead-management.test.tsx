// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadManagement } from "@/features/lead-management/LeadManagement";
import { getAdminLeadDetail, getAdminLeadPage, updateAdminLeadStatus } from "@/services/admin-lead-api";
import { getCsrfToken } from "@/services/admin-api";

vi.mock("@/services/admin-lead-api", () => ({
  exportAdminLeads: vi.fn(),
  getAdminLeadDetail: vi.fn(),
  getAdminLeadPage: vi.fn(),
  updateAdminLeadStatus: vi.fn(),
}));
vi.mock("@/services/admin-api", () => ({ getCsrfToken: vi.fn() }));

const mockedGetPage = vi.mocked(getAdminLeadPage);
const mockedGetDetail = vi.mocked(getAdminLeadDetail);
const mockedUpdateStatus = vi.mocked(updateAdminLeadStatus);
const mockedGetCsrf = vi.mocked(getCsrfToken);

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close = function close() { this.open = false; };
});

beforeEach(() => {
  mockedGetPage.mockReset();
  mockedGetDetail.mockReset();
  mockedUpdateStatus.mockReset();
  mockedGetCsrf.mockReset();
});

describe("LeadManagement", () => {
  it("keeps the list masked, opens audited detail and updates status", async () => {
    mockedGetPage.mockResolvedValue({ list: [createListItem()], pageNo: 1, pageSize: 20, total: 1 });
    mockedGetDetail
      .mockResolvedValueOnce(createDetail())
      .mockResolvedValueOnce({ ...createDetail(), status: 1, statusLabel: "处理中", version: 2 });
    mockedGetCsrf.mockResolvedValue({ headerName: "X-CSRF-Token", parameterName: "_csrf", token: "csrf" });
    mockedUpdateStatus.mockResolvedValue(undefined);

    render(<LeadManagement user={{ displayName: "系统管理员", roleCode: "ADMINISTRATOR", userId: 1, username: "admin" }} />);

    expect(await screen.findByText("a***@example.com")).toBeTruthy();
    expect(screen.queryByText("acceptance@example.com")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    expect(await screen.findByText("acceptance@example.com")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("更新为"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "更新状态" }));

    await waitFor(() => {
      expect(mockedUpdateStatus).toHaveBeenCalledWith(8, 1, 1, expect.objectContaining({ token: "csrf" }));
    });
    expect(await screen.findByText("线索状态已更新。")).toBeTruthy();
  });
});

function createListItem() {
  return {
    company: "武汉云台数据",
    demandDescriptionPreview: "隔离验收记录",
    id: 8,
    maskedEmail: "a***@example.com",
    maskedPhone: "123****8901",
    name: "阶段三验收",
    status: 0 as const,
    statusLabel: "未处理",
    submittedAt: "2026-07-21T10:00:00",
    updatedAt: "2026-07-21T10:00:00",
  };
}

function createDetail() {
  return {
    company: "武汉云台数据",
    demandDescription: "联系表单隔离验收记录",
    email: "acceptance@example.com",
    id: 8,
    name: "阶段三验收",
    phone: "12345678901",
    status: 0 as const,
    statusLabel: "未处理",
    submitIp: "127.0.0.1",
    submittedAt: "2026-07-21T10:00:00",
    updatedAt: "2026-07-21T10:00:00",
    version: 1,
  };
}
