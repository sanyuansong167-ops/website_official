import { Container } from "@/components/layout/Container";
import { ControlledActionLink } from "@/components/page-builder/controlled-action";
import { HomeContentIcon } from "@/components/page-builder/HomeContentIcon";
import { getNavigationTarget } from "@/lib/navigation-target";
import type { NavigationTarget } from "@/lib/navigation-target";
import type { ControlledSection, JsonObject, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./HomeContentGridBlock.module.css";

export type HomeContentGridKind = "ai" | "capability" | "metric";

type MetricCard = {
  description: string;
  iconUrl?: string;
  key: string;
  unit?: string;
  value: string;
};

type AiCard = {
  description?: string;
  englishName?: string;
  iconUrl?: string;
  key: string;
  target?: NavigationTarget;
  title: string;
};

type CapabilityCard = {
  description?: string;
  iconUrl?: string;
  items: string[];
  key: string;
  title: string;
};

export function HomeContentGridBlock({
  kind,
  mode,
  section,
}: Readonly<{
  kind: HomeContentGridKind;
  mode: RenderMode;
  section: ControlledSection;
}>) {
  const title = getString(section.props.title) ?? getDefaultTitle(kind);
  const summary = getString(section.props.summary);
  const emptyStateText = getString(section.props.emptyStateText) ?? "暂无可展示内容";
  const status = getString(section.data?.status);
  const issues = mode === "editor" ? getStringList(section.data?.issues) : [];
  const items = getDataItems(section.data);
  const itemCount = getItemCount(items, kind);
  const layout = getLayout(section.style.layout, kind);
  const spacing = getSpacing(section.style.spacing);
  const theme = getTheme(section.style.theme, kind);

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.homeContentGridBlock}
      data-kind={kind}
      data-layout={layout}
      data-spacing={spacing}
      data-theme={theme}
    >
      <Container>
        <header className={styles.heading}>
          <h2 id={`${section.id}-title`}>{title}</h2>
          {summary ? <p>{summary}</p> : null}
        </header>

        {status === "loading" ? <p className={styles.state} role="status">正在加载绑定内容…</p> : null}
        {status === "error" ? (
          <p className={styles.error} role="alert">
            {mode === "editor" ? getString(section.data?.message) ?? "绑定内容加载失败。" : emptyStateText}
          </p>
        ) : null}
        {issues.length > 0 ? (
          <ul className={styles.issueList}>
            {issues.map((issue) => <li key={issue} role="alert">{issue}</li>)}
          </ul>
        ) : null}
        {status !== "loading" && status !== "error" && itemCount === 0 ? (
          <p className={styles.state}>{emptyStateText}</p>
        ) : null}

        {itemCount > 0 && kind === "metric" ? <MetricGrid items={items} /> : null}
        {itemCount > 0 && kind === "ai" ? <AiGrid items={items} /> : null}
        {itemCount > 0 && kind === "capability" ? <CapabilityGrid items={items} /> : null}
      </Container>
    </section>
  );
}

function MetricGrid({ items }: Readonly<{ items: JsonValue[] }>) {
  const cards = decodeMetricCards(items);

  return (
    <ul className={styles.grid} aria-label="核心指标">
      {cards.map((card) => (
        <li className={styles.metricCard} key={card.key}>
          {card.iconUrl ? <HomeContentIcon iconUrl={card.iconUrl} title={card.description} /> : null}
          <p className={styles.metricValue}>
            <strong>{card.value}</strong>
            {card.unit ? <span>{card.unit}</span> : null}
          </p>
          <p>{card.description}</p>
        </li>
      ))}
    </ul>
  );
}

function AiGrid({ items }: Readonly<{ items: JsonValue[] }>) {
  const cards = decodeAiCards(items);

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <article className={styles.contentCard} key={card.key}>
          <HomeContentIcon iconUrl={card.iconUrl} title={card.title} />
          {card.englishName ? <p className={styles.englishName}>{card.englishName}</p> : null}
          <h3>{card.title}</h3>
          {card.description ? <p className={styles.cardDescription}>{card.description}</p> : null}
          {card.target ? (
            <ControlledActionLink
              action={{ target: card.target, text: "了解详情" }}
              className={styles.detailLink}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}

function CapabilityGrid({ items }: Readonly<{ items: JsonValue[] }>) {
  const cards = decodeCapabilityCards(items);

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <article className={styles.contentCard} key={card.key}>
          <HomeContentIcon iconUrl={card.iconUrl} title={card.title} />
          <h3>{card.title}</h3>
          {card.description ? <p className={styles.cardDescription}>{card.description}</p> : null}
          {card.items.length > 0 ? (
            <ul className={styles.capabilityItems}>
              {card.items.slice(0, 5).map((item, index) => (
                <li key={`${item}-${index}`}><span aria-hidden="true">✓</span>{item}</li>
              ))}
            </ul>
          ) : null}
          {card.items.length > 5 ? (
            <ControlledActionLink
              action={{
                target: { href: "/capabilities", kind: "internal" },
                text: `查看全部能力（共 ${card.items.length} 项）`,
              }}
              className={styles.detailLink}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}

function decodeMetricCards(items: JsonValue[]) {
  return items
    .map((item, index): MetricCard | null => {
      if (!isJsonObject(item)) return null;
      const value = getString(item.value) ?? getString(item.metricValue);
      const description = getString(item.description) ?? getString(item.label);
      if (!value || !description) return null;

      return {
        description,
        iconUrl: getSafeImageUrl(item.iconUrl),
        key: getItemKey(item, index, `${value}-${description}`),
        unit: getString(item.unit),
        value,
      };
    })
    .filter((item): item is MetricCard => item !== null)
    .slice(0, 12);
}

function decodeAiCards(items: JsonValue[]) {
  return items
    .map((item, index): AiCard | null => {
      if (!isJsonObject(item)) return null;
      const title = getString(item.name) ?? getString(item.title) ?? getString(item.titleCn);
      if (!title) return null;

      return {
        description: getString(item.description) ?? getString(item.summary),
        englishName: getString(item.englishName) ?? getString(item.titleEn),
        iconUrl: getSafeImageUrl(item.iconUrl),
        key: getItemKey(item, index, title),
        target: getSafeJumpTarget(item.jumpLink ?? item.detailLink),
        title,
      };
    })
    .filter((item): item is AiCard => item !== null)
    .slice(0, 12);
}

function decodeCapabilityCards(items: JsonValue[]) {
  return items
    .map((item, index): CapabilityCard | null => {
      if (!isJsonObject(item)) return null;
      const title = getString(item.name) ?? getString(item.title);
      if (!title) return null;

      return {
        description: getString(item.description) ?? getString(item.summary) ?? getString(item.subtitle),
        iconUrl: getSafeImageUrl(item.iconUrl),
        items: decodeCapabilityItems(item.items),
        key: getItemKey(item, index, title),
        title,
      };
    })
    .filter((item): item is CapabilityCard => item !== null)
    .slice(0, 12);
}

function decodeCapabilityItems(value: JsonValue | undefined) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    if (!isJsonObject(item)) return [];
    const name = getString(item.name) ?? getString(item.title);
    return name ? [name] : [];
  });
}

function getItemCount(items: JsonValue[], kind: HomeContentGridKind) {
  if (kind === "metric") return decodeMetricCards(items).length;
  if (kind === "ai") return decodeAiCards(items).length;
  return decodeCapabilityCards(items).length;
}

function getDataItems(data: JsonObject | undefined) {
  const value = data?.items ?? data?.list;
  return Array.isArray(value) ? value : [];
}

function getItemKey(item: JsonObject, index: number, fallback: string) {
  const id = item.id;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0
    ? String(id)
    : `${fallback}-${index}`;
}

function getSafeJumpTarget(value: JsonValue | undefined) {
  const targetValue = getString(value);
  if (!targetValue) return undefined;

  const internal = getNavigationTarget({
    openInNewTab: false,
    routePath: targetValue,
    targetType: "INTERNAL_ROUTE",
  });
  if (internal) return internal;

  return getNavigationTarget({
    externalUrl: targetValue,
    openInNewTab: false,
    targetType: "EXTERNAL_LINK",
  }) ?? undefined;
}

function getSafeImageUrl(value: JsonValue | undefined) {
  const target = getSafeJumpTarget(value);
  return target?.href;
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getStringList(value: JsonValue | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim())
    : [];
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getLayout(value: JsonValue | undefined, kind: HomeContentGridKind) {
  if (kind === "metric") return value === "three-columns" ? value : "four-columns";
  return value === "two-columns" ? value : "three-columns";
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}

function getTheme(value: JsonValue | undefined, kind: HomeContentGridKind) {
  if (value === "dark" || value === "light") return value;
  return kind === "ai" ? "dark" : "light";
}

function getDefaultTitle(kind: HomeContentGridKind) {
  if (kind === "metric") return "以成果建立信任";
  if (kind === "ai") return "AI 战略与实践";
  return "核心能力";
}
