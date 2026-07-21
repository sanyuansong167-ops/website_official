import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { EditorShell } from "@/features/editor/EditorShell";
import { isAllowedEditorRoute } from "@/lib/site-routes";
import { getCurrentAdmin, getPageDefinitions } from "@/services/admin-api";
import { ApiError } from "@/services/http";

type EditorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const routePath = (await searchParams).routePath;

  if (typeof routePath !== "string" || !isAllowedEditorRoute(routePath)) {
    return (
      <EditorPageState
        title="页面路径无效"
        description="routePath 必须是已登记的官网公开页面路径。"
      />
    );
  }

  const requestHeaders = await headers();
  const requestContext = { cookie: requestHeaders.get("cookie") ?? "" };

  let user;
  try {
    user = await getCurrentAdmin(requestContext);
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "authentication" || error.kind === "authorization")) {
      redirect("/admin/unauthorized");
    }

    return (
      <EditorPageState
        title="暂时无法验证管理员身份"
        description="请确认 Admin API 地址、会话 Cookie 和后台服务状态。"
      />
    );
  }

  if (user.roleCode !== "ADMINISTRATOR") {
    redirect("/admin/unauthorized");
  }

  let pages;
  try {
    pages = await getPageDefinitions(requestContext);
  } catch {
    return (
      <EditorPageState
        title="暂时无法读取页面定义"
        description="管理员身份有效，但页面构建器接口当前不可用。"
      />
    );
  }

  const page = pages.find((item) => item.routePath === routePath);

  if (!page) {
    return (
      <EditorPageState
        title="未找到页面定义"
        description="该路径尚未在页面构建器中登记，无法进入编辑模式。"
      />
    );
  }

  return <EditorShell page={page} user={user} />;
}

function EditorPageState({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <Container as="main">
      <PageState status="error" title={title} description={description} />
    </Container>
  );
}
