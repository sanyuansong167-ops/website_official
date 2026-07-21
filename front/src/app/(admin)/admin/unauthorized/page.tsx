import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";

export default function UnauthorizedPage() {
  return (
    <Container as="main">
      <PageState
        status="error"
        title="无法进入官网编辑器"
        description="请先在 Admin 后台登录，并确认当前账号拥有 ADMINISTRATOR 角色。"
      />
    </Container>
  );
}
