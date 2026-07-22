import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { PortalChrome } from "@/components/layout/PortalChrome";
import { PreviewNotice } from "@/components/page-builder/PreviewNotice";
import { CaseDetailPage } from "@/features/portal-detail/CaseDetailPage";
import { IndustrySolutionDetailPage } from "@/features/portal-detail/IndustrySolutionDetailPage";
import { ProductDetailPage } from "@/features/portal-detail/ProductDetailPage";
import { getCurrentAdmin } from "@/services/admin-api";
import { getContentPreview } from "@/services/content-preview-api";
import { ApiError } from "@/services/http";
import { getPortalChrome } from "@/services/portal-api";
import type { ContentResourceKind } from "@/types/content-editor";

type ContentPreviewPageProps = {
  params: Promise<{ kind: string; previewToken: string; resourceId: string }>;
};

export const dynamic = "force-dynamic";
export const metadata = { robots: { follow: false, index: false }, title: "内容草稿预览" };

export default async function ContentPreviewPage({ params }: ContentPreviewPageProps) {
  const { kind, previewToken, resourceId } = await params;
  if (!isContentKind(kind) || !isPositiveInteger(resourceId) || !isPreviewToken(previewToken)) return <PreviewUnavailable />;

  const requestHeaders = await headers();
  const context = { cookie: requestHeaders.get("cookie") ?? "" };
  const access = await getPreviewAccess(context);
  if (access === "unauthorized") redirect("/admin/unauthorized");
  if (access === "unavailable") return <PreviewUnavailable />;

  const id = Number(resourceId);
  const [preview, chrome] = await Promise.all([
    getContentPreview(kind, id, previewToken, context).catch(() => null),
    getPortalChrome(),
  ]);
  if (!preview) return <PreviewUnavailable />;

  const label = kind === "product" ? "产品草稿" : kind === "case" ? "案例草稿" : "行业方案草稿";
  return (
    <PortalChrome chrome={chrome}>
      <PreviewNotice pageName={label} />
      {preview.kind === "product" ? <ProductDetailPage product={preview.data} /> : null}
      {preview.kind === "case" ? <CaseDetailPage caseDetail={preview.data} /> : null}
      {preview.kind === "solution" ? <IndustrySolutionDetailPage solution={preview.data} /> : null}
    </PortalChrome>
  );
}

async function getPreviewAccess(context: { cookie: string }) {
  try {
    const user = await getCurrentAdmin(context);
    return user.roleCode === "ADMINISTRATOR" ? "authorized" : "unauthorized";
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "authentication" || error.kind === "authorization")) return "unauthorized";
    return "unavailable";
  }
}

function PreviewUnavailable() {
  return (
    <Container as="main">
      <PageState status="error" title="预览不可用" description="预览链接无效、已过期、草稿已更新，或当前管理员无权访问。" />
    </Container>
  );
}

function isContentKind(value: string): value is ContentResourceKind {
  return value === "case" || value === "product" || value === "solution";
}

function isPositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

function isPreviewToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
