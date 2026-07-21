// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/features/contact/ContactForm";
import { createLead } from "@/services/portal-api";

vi.mock("@/services/portal-api", () => ({ createLead: vi.fn() }));

const mockedCreateLead = vi.mocked(createLead);

describe("ContactForm", () => {
  beforeEach(() => {
    mockedCreateLead.mockReset();
  });

  it("prefills the selected direction and submits only the documented request fields", async () => {
    mockedCreateLead.mockResolvedValue(undefined);
    render(<ContactForm initialDirection="AI 应用开发" />);

    expect((screen.getByLabelText("需求描述（选填）") as HTMLTextAreaElement).value).toBe("合作方向：AI 应用开发\n");

    fireEvent.change(screen.getByLabelText("姓名 *"), { target: { value: "张三" } });
    fireEvent.change(screen.getByLabelText("公司名称 *"), { target: { value: "云台数据" } });
    fireEvent.change(screen.getByLabelText("邮箱 *"), { target: { value: "hello@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "提交预约" }));

    await waitFor(() => {
      expect(mockedCreateLead).toHaveBeenCalledWith({
        company: "云台数据",
        demandDescription: "合作方向：AI 应用开发",
        email: "hello@example.com",
        name: "张三",
        phone: undefined,
      });
    });
    expect(screen.getByRole("status").textContent).toContain("提交成功");
  });
});
