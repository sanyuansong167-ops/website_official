import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { IndustrySolutionDetailPage } from "@/features/portal-detail/IndustrySolutionDetailPage";
import { ApiError } from "@/services/http";
import { getIndustrySolutionDetail } from "@/services/portal-api";

type IndustrySolutionDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Readonly<IndustrySolutionDetailRouteProps>): Promise<Metadata> {
  const solutionId = getSolutionId((await params).id);
  if (!solutionId) return {};

  const solution = await loadIndustrySolutionDetail(solutionId);
  return solution ? { description: solution.description, title: solution.name } : {};
}

export default async function IndustrySolutionDetailRoute({ params }: Readonly<IndustrySolutionDetailRouteProps>) {
  const solutionId = getSolutionId((await params).id);
  if (!solutionId) notFound();

  const solution = await loadIndustrySolutionDetail(solutionId);
  if (!solution) {
    return (
      <Container as="main">
        <PageState description="请稍后刷新页面重试。" status="error" title="行业方案信息暂时不可用" />
      </Container>
    );
  }

  return <IndustrySolutionDetailPage solution={solution} />;
}

function getSolutionId(value: string) {
  const solutionId = Number(value);
  return Number.isSafeInteger(solutionId) && solutionId > 0 ? solutionId : null;
}

async function loadIndustrySolutionDetail(solutionId: number) {
  try {
    return await getIndustrySolutionDetail(solutionId);
  } catch (error) {
    if (error instanceof ApiError && String(error.code) === "40101") notFound();
    return null;
  }
}
