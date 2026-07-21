import Link from "next/link";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";

export default function PortalNotFound() {
  return (
    <Container as="main">
      <PageState
        description="你访问的页面不存在、已下线或暂不可公开访问。"
        status="unavailable"
        title="页面不存在或已下线"
      />
      <Link href="/">返回首页</Link>
    </Container>
  );
}
