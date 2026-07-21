import type { BlockConfigField } from "@/lib/home-page-template";
import type { ControlledSection, JsonObject, JsonValue, PageSchema } from "@/types/page-builder";

type ConfigRoot = "dataBinding" | "props" | "style";

export function getBlockConfigValue(section: ControlledSection, path: BlockConfigField["path"]): JsonValue | undefined {
  const [root, ...segments] = path.split(".");
  if (!isConfigRoot(root) || segments.length === 0) return undefined;

  let current: JsonValue | undefined = getConfigRoot(section, root);
  for (const segment of segments) {
    if (!isJsonObject(current)) return undefined;
    current = current[segment];
  }

  return current;
}

export function updateBlockConfig(
  schema: PageSchema,
  blockId: string,
  path: BlockConfigField["path"],
  value: JsonValue,
): PageSchema {
  const [root, ...segments] = path.split(".");
  if (!isConfigRoot(root) || segments.length === 0) return schema;

  let changed = false;
  const sections = schema.sections.map((section) => {
    if (section.id !== blockId || section.slot !== "main") return section;

    const currentRoot = getConfigRoot(section, root);
    const updatedRoot = setJsonPath(currentRoot, segments, value);
    changed = true;

    if (root === "dataBinding") return { ...section, dataBinding: updatedRoot };
    if (root === "style") return { ...section, style: updatedRoot };
    return { ...section, props: updatedRoot };
  });

  return changed ? { ...schema, sections } : schema;
}

function getConfigRoot(section: ControlledSection, root: ConfigRoot): JsonObject {
  if (root === "dataBinding") return section.dataBinding ?? {};
  return section[root];
}

function setJsonPath(current: JsonObject, segments: string[], value: JsonValue): JsonObject {
  const [head, ...tail] = segments;
  if (!head) return current;
  if (tail.length === 0) return { ...current, [head]: value };

  const child = isJsonObject(current[head]) ? current[head] : {};
  return { ...current, [head]: setJsonPath(child, tail, value) };
}

function isConfigRoot(value: string): value is ConfigRoot {
  return value === "dataBinding" || value === "props" || value === "style";
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
