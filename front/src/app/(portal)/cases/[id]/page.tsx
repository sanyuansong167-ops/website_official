import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { CaseDetailPage } from "@/features/portal-detail/CaseDetailPage";
import { ApiError } from "@/services/http";
import { getCaseDetail } from "@/services/portal-api";

type CaseDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Readonly<CaseDetailRouteProps>): Promise<Metadata> {
  const caseId = getCaseId((await params).id);
  if (!caseId) return {};

  const caseDetail = await loadCaseDetail(caseId);
  return caseDetail
    ? { description: caseDetail.seoDescription || caseDetail.background, title: caseDetail.seoTitle || caseDetail.title }
    : {};
}

export default async function CaseDetailRoute({ params }: Readonly<CaseDetailRouteProps>) {
  const caseId = getCaseId((await params).id);
  if (!caseId) notFound();

  const caseDetail = await loadCaseDetail(caseId);
  if (!caseDetail) {
    return (
      <Container as="main">
        <PageState description="请稍后刷新页面重试。" status="error" title="案例信息暂时不可用" />
      </Container>
    );
  }

  return <CaseDetailPage caseDetail={caseDetail} />;
}

function getCaseId(value: string) {
  const caseId = Number(value);
  return Number.isSafeInteger(caseId) && caseId > 0 ? caseId : null;
}

async function loadCaseDetail(caseId: number) {
  try {
    return await getCaseDetail(caseId);
  } catch (error) {
    if (error instanceof ApiError && ["30001", "40201"].includes(String(error.code))) notFound();
    return null;
  }
}
