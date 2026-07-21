import { Container } from "@/components/layout/Container";
import type { ControlledSection, JsonObject, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./PromiseBlock.module.css";

export function PromiseBlock({ section }: Readonly<{ mode: RenderMode; section: ControlledSection }>) {
  const title = getString(section.props.title) ?? "我们的承诺";
  const summary = getString(section.props.summary);
  const content = getString(section.data?.content);
  const tags = decodeTags(section.data?.tags);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.promiseBlock}
      data-spacing={getSpacing(section.style.spacing)}
      data-theme={section.style.theme === "dark" ? "dark" : "light"}
    >
      <Container>
        <header className={styles.heading}>
          <h2 id={`${section.id}-title`}>{title}</h2>
          {summary ? <p>{summary}</p> : null}
        </header>
        {content ? <p className={styles.content}>{content}</p> : null}
        {tags.length > 0 ? (
          <ul className={styles.tags}>
            {tags.map((tag) => (
              <li key={tag.title}>
                <strong>{tag.title}</strong>
                {tag.description ? <span>{tag.description}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

function decodeTags(value: JsonValue | undefined) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isJsonObject(item)) return [];
    const title = getString(item.tagText) ?? getString(item.title);
    return title ? [{ description: getString(item.description), title }] : [];
  }).slice(0, 12);
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
