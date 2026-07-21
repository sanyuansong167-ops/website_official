import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PageState } from "@/components/common/PageState";
import { LeadManagement } from "@/features/lead-management/LeadManagement";
import { getCurrentAdmin } from "@/services/admin-api";
import { ApiError } from "@/services/http";
import type { AdminSession } from "@/types/admin";

export default async function AdminLeadsPage() {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie") ?? "";
  if (!/(?:^|;\s*)JSESSIONID=/.test(cookie)) redirect("/admin/login");

  let user: AdminSession;
  try {
    user = await getCurrentAdmin({ cookie });
    if (user.roleCode !== "ADMINISTRATOR") redirect("/admin/unauthorized");
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "authentication" || error.kind === "authorization")) {
      redirect("/admin/login");
    }
    return (
      <Container as="main">
        <PageState description="请确认 Admin API 地址、后台服务和管理员会话状态。" status="error" title="暂时无法打开预约线索管理" />
      </Container>
    );
  }

  return <LeadManagement user={user} />;
}
