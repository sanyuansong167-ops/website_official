"use client";

import { useState } from "react";
import { createLead } from "@/services/portal-api";
import { ApiError } from "@/services/http";
import { createLeadRequest, getLeadFormErrors } from "./lead-validation";
import type { LeadFormErrors, LeadFormValues } from "./lead-validation";
import styles from "./ContactForm.module.css";

type ContactFormProps = {
  initialDirection?: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { message: string; status: "error" };

const initialValues: LeadFormValues = {
  company: "",
  demandDescription: "",
  email: "",
  name: "",
  phone: "",
};

export function ContactForm({ initialDirection }: Readonly<ContactFormProps>) {
  const [values, setValues] = useState<LeadFormValues>({
    ...initialValues,
    demandDescription: initialDirection ? formatDirection(initialDirection) : "",
  });
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  function updateField(field: keyof LeadFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (submitState.status !== "idle") setSubmitState({ status: "idle" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = getLeadFormErrors(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitState({ message: "请检查标记的字段后再提交。", status: "error" });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      await createLead(createLeadRequest(values));
      setValues(initialValues);
      setErrors({});
      setSubmitState({ status: "success" });
    } catch (error) {
      setSubmitState({ message: getSafeSubmitMessage(error), status: "error" });
    }
  }

  return (
    <form className={styles.contactForm} noValidate onSubmit={(event) => void handleSubmit(event)}>
      <div className={styles.formHeader}>
        <p>预约交流</p>
        <h2>告诉我们您的合作需求</h2>
      </div>
      <div className={styles.fieldGrid}>
        <FormField
          error={errors.name}
          id="lead-name"
          label="姓名"
          maxLength={64}
          onChange={(value) => updateField("name", value)}
          required
          value={values.name}
        />
        <FormField
          error={errors.company}
          id="lead-company"
          label="公司名称"
          maxLength={128}
          onChange={(value) => updateField("company", value)}
          required
          value={values.company}
        />
        <FormField
          error={errors.email}
          id="lead-email"
          label="邮箱"
          maxLength={128}
          onChange={(value) => updateField("email", value)}
          required
          type="email"
          value={values.email}
        />
        <FormField
          error={errors.phone}
          id="lead-phone"
          label="电话（选填）"
          maxLength={64}
          onChange={(value) => updateField("phone", value)}
          type="tel"
          value={values.phone}
        />
      </div>
      <FormField
        error={errors.demandDescription}
        id="lead-demand-description"
        label="需求描述（选填）"
        maxLength={1000}
        multiline
        onChange={(value) => updateField("demandDescription", value)}
        value={values.demandDescription}
      />
      <button className={styles.submitButton} disabled={submitState.status === "submitting"} type="submit">
        {submitState.status === "submitting" ? "正在提交…" : "提交预约"}
      </button>
      <SubmitFeedback state={submitState} />
    </form>
  );
}

type FormFieldProps = {
  error?: string;
  id: string;
  label: string;
  maxLength: number;
  multiline?: boolean;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "email" | "tel" | "text";
  value: string;
};

function FormField({
  error,
  id,
  label,
  maxLength,
  multiline = false,
  onChange,
  required = false,
  type = "text",
  value,
}: Readonly<FormFieldProps>) {
  const errorId = `${id}-error`;
  const sharedProps = {
    "aria-describedby": error ? errorId : undefined,
    "aria-invalid": Boolean(error),
    id,
    maxLength,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    required,
    value,
  };

  return (
    <div className={styles.formField}>
      <label htmlFor={id}>{label}{required ? " *" : ""}</label>
      {multiline ? <textarea rows={5} {...sharedProps} /> : <input type={type} {...sharedProps} />}
      <span>{value.length}/{maxLength}</span>
      {error ? <small id={errorId} role="alert">{error}</small> : null}
    </div>
  );
}

function SubmitFeedback({ state }: Readonly<{ state: SubmitState }>) {
  if (state.status === "idle") return null;
  if (state.status === "submitting") return <p className={styles.feedback} role="status">正在安全提交您的预约信息…</p>;
  if (state.status === "success") {
    return <p className={styles.feedback} data-status="success" role="status">提交成功，我们会尽快与您联系。</p>;
  }

  return <p className={styles.feedback} data-status="error" role="alert">{state.message}</p>;
}

function formatDirection(direction: string) {
  return `合作方向：${direction}\n`;
}

function getSafeSubmitMessage(error: unknown) {
  if (error instanceof ApiError && String(error.code) === "70007") {
    return "提交过于频繁，请稍后再试。";
  }

  if (error instanceof ApiError && error.kind === "validation") {
    return "提交信息未通过校验，请检查后重试。";
  }

  if (error instanceof ApiError && error.kind === "network") {
    return "网络连接异常，信息尚未提交，请检查网络后重试。";
  }

  return "暂时无法提交预约，请稍后重试。";
}
