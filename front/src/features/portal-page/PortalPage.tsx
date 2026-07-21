import { PageRenderer } from "@/components/page-builder/PageRenderer";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { notFound } from "next/navigation";
import { ApiError } from "@/services/http";
import { getPortalPage } from "@/services/portal-api";

type PortalPageProps = {
  routePath: string;
};

export async function PortalPage({ routePath }: Readonly<PortalPageProps>) {
  const page = await loadPortalPage(routePath);

  if (!page) {
    return (
      <Container as="main">
        <PageState
          description="请稍后刷新页面重试。"
          status="error"
          title={routePath === "/" ? "官网内容暂时不可用" : "页面内容暂时不可用"}
        />
      </Container>
    );
  }

  return (
    <main>
      <PageRenderer mode="portal" schema={page.schema} />
    </main>
  );
}

async function loadPortalPage(routePath: string) {
  try {
    return await getPortalPage(routePath);
  } catch (error) {
    if (error instanceof ApiError && ["30001", "90001"].includes(String(error.code))) notFound();
    return null;
  }
}
