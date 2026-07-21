import { describe, expect, it } from "vitest";
import { createLeadRequest, getLeadFormErrors } from "@/features/contact/lead-validation";

describe("lead form validation", () => {
  it("trims optional values before creating the Portal request", () => {
    expect(
      createLeadRequest({
        company: "  云台数据  ",
        demandDescription: "   ",
        email: "  hello@example.com ",
        name: " 张三 ",
        phone: " ",
      }),
    ).toEqual({ company: "云台数据", demandDescription: undefined, email: "hello@example.com", name: "张三", phone: undefined });
  });

  it("requires the formal required fields and checks the email format", () => {
    expect(
      getLeadFormErrors({
        company: "",
        demandDescription: "",
        email: "invalid",
        name: "",
        phone: "",
      }),
    ).toMatchObject({ company: expect.any(String), email: expect.any(String), name: expect.any(String) });
  });
});
