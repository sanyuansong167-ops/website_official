import { Container } from "@/components/layout/Container";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <Container as="main">
      <div aria-label="页面加载中" className={styles.skeleton} role="status" />
    </Container>
  );
}
