import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { ContentEditorShell } from "@/features/content-editor/ContentEditorShell";
import { getCurrentAdmin } from "@/services/admin-api";
import { ApiError } from "@/services/http";
import type { ContentResourceKind } from "@/types/content-editor";

type ContentEditorRouteProps = { id: string; resourceKind: ContentResourceKind };

export async function ContentEditorRoute({ id, resourceKind }: ContentEditorRouteProps) {
  const resourceId = Number(id);
  if (!Number.isSafeInteger(resourceId) || resourceId <= 0) notFound();

  const requestHeaders = await headers();
  let user;
  try {
    user = await getCurrentAdmin({ cookie: requestHeaders.get("cookie") ?? "" });
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "authentication" || error.kind === "authorization")) redirect("/admin/unauthorized");
    return <ContentEditorRouteState title="暂时无法验证管理员身份" description="请确认 Admin API 地址、会话 Cookie 与后台服务状态。" />;
  }
  if (user.roleCode !== "ADMINISTRATOR") redirect("/admin/unauthorized");
  return <ContentEditorShell resourceId={resourceId} resourceKind={resourceKind} user={user} />;
}

function ContentEditorRouteState({ title, description }: Readonly<{ title: string; description: string }>) {
  return <Container as="main"><PageState description={description} status="error" title={title} /></Container>;
}
