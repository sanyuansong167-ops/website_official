import type { CreateLeadRequest } from "@/types/portal";

export type LeadFormValues = {
  company: string;
  demandDescription: string;
  email: string;
  name: string;
  phone: string;
};

export type LeadFormErrors = Partial<Record<keyof LeadFormValues, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createLeadRequest(values: LeadFormValues): CreateLeadRequest {
  return {
    company: values.company.trim(),
    demandDescription: values.demandDescription.trim() || undefined,
    email: values.email.trim(),
    name: values.name.trim(),
    phone: values.phone.trim() || undefined,
  };
}

export function getLeadFormErrors(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {};
  const request = createLeadRequest(values);

  if (!request.name) errors.name = "请输入姓名。";
  else if (request.name.length > 64) errors.name = "姓名不能超过 64 个字符。";

  if (!request.company) errors.company = "请输入公司名称。";
  else if (request.company.length > 128) errors.company = "公司名称不能超过 128 个字符。";

  if (!request.email) errors.email = "请输入邮箱。";
  else if (request.email.length > 128 || !emailPattern.test(request.email)) errors.email = "请输入有效的邮箱地址。";

  if (request.phone && request.phone.length > 64) errors.phone = "电话不能超过 64 个字符。";
  if (request.demandDescription && request.demandDescription.length > 1000) {
    errors.demandDescription = "需求描述不能超过 1000 个字符。";
  }

  return errors;
}
