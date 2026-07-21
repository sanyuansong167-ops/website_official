import { Container } from "@/components/layout/Container";
import type { ControlledSection, JsonObject, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./TimelineBlock.module.css";

type TimelineItem = {
  description?: string;
  key: string;
  time: string;
  title: string;
};

export function TimelineBlock({ section }: Readonly<{ mode: RenderMode; section: ControlledSection }>) {
  const title = getString(section.props.title) ?? "发展历程";
  const summary = getString(section.props.summary);
  const emptyStateText = getString(section.props.emptyStateText) ?? "暂无可展示历程";
  const displayLimit = getPositiveNumber(section.props.displayLimit) ?? 12;
  const theme = section.style.theme === "dark" ? "dark" : "light";
  const spacing = getSpacing(section.style.spacing);
  const items = decodeItems(section.data).slice(0, displayLimit);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.timelineBlock}
      data-spacing={spacing}
      data-theme={theme}
    >
      <Container>
        <header className={styles.heading}>
          <h2 id={`${section.id}-title`}>{title}</h2>
          {summary ? <p>{summary}</p> : null}
        </header>
        {items.length === 0 ? <p className={styles.state}>{emptyStateText}</p> : null}
        {items.length > 0 ? (
          <ol className={styles.timeline} aria-label={title}>
            {items.map((item) => (
              <li className={styles.item} key={item.key}>
                <p className={styles.time}>{item.time}</p>
                <div className={styles.marker} aria-hidden="true" />
                <div className={styles.content}>
                  <h3>{item.title}</h3>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </Container>
    </section>
  );
}

function decodeItems(data: JsonObject | undefined): TimelineItem[] {
  const value = data?.items ?? data?.list;
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => decodeItem(item, index))
    .filter((item): item is TimelineItem => item !== null);
}

function decodeItem(value: JsonValue, index: number): TimelineItem | null {
  if (!isJsonObject(value)) return null;
  const time = getTimeText(value.time) ?? getTimeText(value.year) ?? getTimeText(value.date);
  const title = getString(value.title) ?? getString(value.name);
  if (!time || !title) return null;

  return {
    description: getString(value.description) ?? getString(value.summary),
    key: getString(value.id) ?? `${time}-${title}-${index}`,
    time,
    title,
  };
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getTimeText(value: JsonValue | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return getString(value);
}

function getPositiveNumber(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
