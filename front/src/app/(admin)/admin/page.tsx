import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { getCurrentAdmin, getPageDefinitions } from "@/services/admin-api";
import { ApiError } from "@/services/http";

export default async function AdminHomePage() {
  const { pages, user } = await loadAdminHome();

  return (
    <Container as="main">
      <h1>官网后台</h1>
      <p>当前登录：{user.displayName || user.username}</p>
      <h2>客户运营</h2>
      <p><Link href="/admin/leads">预约线索管理</Link></p>
      <h2>页面编辑</h2>
      <ul>
        {pages.map((page) => (
          <li key={page.id}><Link href={`/admin/editor?routePath=${encodeURIComponent(page.routePath)}`}>{page.name}（{page.routePath}）</Link></li>
        ))}
      </ul>
    </Container>
  );
}

async function loadAdminHome() {
  const requestHeaders = await headers();
  const context = { cookie: requestHeaders.get("cookie") ?? "" };
  const hasSessionCookie = /(?:^|;\s*)JSESSIONID=/.test(context.cookie);

  if (!hasSessionCookie) redirect("/admin/login");

  try {
    const user = await getCurrentAdmin(context);
    if (user.roleCode !== "ADMINISTRATOR") redirect("/admin/unauthorized");
    const pages = await getPageDefinitions(context);
    return { pages, user };
  } catch (error) {
    if (
      error instanceof ApiError
      && (
        error.kind === "authentication"
        || error.kind === "authorization"
        || error.kind === "unexpected-response"
      )
    ) {
      redirect("/admin/login");
    }
    throw error;
  }
}
