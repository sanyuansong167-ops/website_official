"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfToken, loginAdmin } from "@/services/admin-api";
import styles from "./AdminLoginForm.module.css";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const csrf = await getCsrfToken();
      await loginAdmin(username.trim(), password, csrf);
      router.replace("/admin");
      router.refresh();
    } catch {
      setMessage("登录失败，请检查账号、密码和本地后端服务。 ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        用户名
        <input autoComplete="username" onChange={(event) => setUsername(event.target.value)} required value={username} />
      </label>
      <label>
        密码
        <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
      </label>
      {message ? <p className={styles.message} role="alert">{message}</p> : null}
      <button disabled={submitting} type="submit">{submitting ? "登录中…" : "登录"}</button>
    </form>
  );
}
