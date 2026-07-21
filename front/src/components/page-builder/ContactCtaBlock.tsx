import { Container } from "@/components/layout/Container";
import {
  ControlledActionLink,
  decodeControlledAction,
} from "@/components/page-builder/controlled-action";
import type { ControlledSection, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./ContactCtaBlock.module.css";

export function ContactCtaBlock({
  mode,
  section,
}: Readonly<{
  mode: RenderMode;
  section: ControlledSection;
}>) {
  const title = getString(section.props.title) ?? "从一次交流开始";
  const summary = getString(section.props.summary);
  const action = decodeControlledAction(section.props.action);
  const spacing = getSpacing(section.style.spacing);
  const theme = section.style.theme === "light" ? "light" : "dark";

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.contactCtaBlock}
      data-spacing={spacing}
      data-theme={theme}
    >
      <Container className={styles.inner}>
        <h2 id={`${section.id}-title`}>{title}</h2>
        {summary ? <p>{summary}</p> : null}
        {action ? <ControlledActionLink action={action} className={styles.action} /> : null}
        {!action && mode === "editor" ? (
          <p className={styles.validation} role="alert">请配置有效的行动按钮和跳转目标。</p>
        ) : null}
      </Container>
    </section>
  );
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}
