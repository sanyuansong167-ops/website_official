"use client";

import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";

export default function ErrorPage({ reset }: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <Container as="main">
          <PageState
            status="error"
            title="页面暂时无法打开"
            description="请稍后重试。"
            action={{ label: "重新加载", onClick: reset }}
          />
    </Container>
  );
}
