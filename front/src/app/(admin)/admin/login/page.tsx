import { Container } from "@/components/layout/Container";
import { AdminLoginForm } from "@/features/admin-login/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Container as="main">
      <h1>官网后台登录</h1>
      <p>登录后可进入页面编辑和内容编辑入口。</p>
      <AdminLoginForm />
    </Container>
  );
}
