import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { PortalChrome } from "@/components/layout/PortalChrome";
import { PageRenderer } from "@/components/page-builder/PageRenderer";
import { PreviewNotice } from "@/components/page-builder/PreviewNotice";
import { getCurrentAdmin } from "@/services/admin-api";
import { getPortalChrome, getPreviewPage } from "@/services/portal-api";
import { ApiError } from "@/services/http";
import type { PortalPageViewModel } from "@/types/page-builder";

type PreviewPageProps = {
  params: Promise<{ pageId: string; previewToken: string }>;
};

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { pageId, previewToken } = await params;

  if (!isPositiveInteger(pageId) || !isPreviewToken(previewToken)) {
    return <PreviewUnavailable />;
  }

  const requestHeaders = await headers();
  const context = { cookie: requestHeaders.get("cookie") ?? "" };

  const access = await getPreviewAccess(context);
  if (access === "unauthorized") redirect("/admin/unauthorized");
  if (access === "unavailable") return <PreviewUnavailable />;

  const [page, chrome] = await Promise.all([loadPreviewPage(previewToken, context), getPortalChrome()]);
  if (!page) return <PreviewUnavailable />;

  return (
    <PortalChrome chrome={chrome}>
      <main>
        <PreviewNotice pageName={page.name} />
        <PageRenderer mode="preview" schema={page.schema} />
      </main>
    </PortalChrome>
  );
}

async function getPreviewAccess(context: { cookie: string }) {
  try {
    const user = await getCurrentAdmin(context);
    return user.roleCode === "ADMINISTRATOR" ? "authorized" : "unauthorized";
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "authentication" || error.kind === "authorization")) {
      return "unauthorized";
    }

    return "unavailable";
  }
}

async function loadPreviewPage(previewToken: string, context: { cookie: string }): Promise<PortalPageViewModel | null> {
  try {
    return await getPreviewPage(previewToken, context);
  } catch {
    return null;
  }
}

function PreviewUnavailable() {
  return (
    <Container as="main">
      <PageState
        status="error"
        title="预览不可用"
        description="预览链接无效、已过期、已撤销，或当前会话无权访问。"
      />
    </Container>
  );
}

function isPositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

function isPreviewToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
