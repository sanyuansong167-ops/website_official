import {
  createHomeBlockSection,
  homeBlockTemplates,
  isHomeBlockType,
  type HomeBlockType,
} from "@/lib/home-page-template";
import type { ControlledSection, JsonObject, JsonValue, PageSchema } from "@/types/page-builder";

export function addHomeBlock(
  schema: PageSchema,
  component: HomeBlockType,
  blockId: string,
): PageSchema {
  if (!isValidNewId(schema, blockId)) return schema;
  const template = homeBlockTemplates[component];
  if (!template.isRepeatable && schema.sections.some((section) => section.component === component)) return schema;

  const nextSortOrder = getMainSections(schema).length * 10;
  return normalizeMainSortOrders({
    ...schema,
    sections: [...schema.sections, createHomeBlockSection(component, blockId, nextSortOrder)],
  });
}

export function copyHomeBlock(schema: PageSchema, blockId: string, copyId: string): PageSchema {
  if (!isValidNewId(schema, copyId)) return schema;
  const source = schema.sections.find((section) => section.id === blockId && section.slot === "main");
  if (!source || !isHomeBlockType(source.component) || !homeBlockTemplates[source.component].isRepeatable) return schema;

  const copy: ControlledSection = {
    ...source,
    data: source.data ? cloneJsonObject(source.data) : undefined,
    dataBinding: source.dataBinding ? cloneJsonObject(source.dataBinding) : undefined,
    id: copyId,
    props: cloneJsonObject(source.props),
    sortOrder: source.sortOrder + 1,
    style: cloneJsonObject(source.style),
  };
  const sourceIndex = schema.sections.indexOf(source);
  const sections = [...schema.sections];
  sections.splice(sourceIndex + 1, 0, copy);
  return normalizeMainSortOrders({ ...schema, sections });
}

export function deleteHomeBlock(schema: PageSchema, blockId: string): PageSchema {
  const target = schema.sections.find((section) => section.id === blockId && section.slot === "main");
  if (!target || !isHomeBlockType(target.component)) return schema;
  return normalizeMainSortOrders({
    ...schema,
    sections: schema.sections.filter((section) => section.id !== blockId),
  });
}

export function moveHomeBlock(schema: PageSchema, blockId: string, direction: "down" | "up"): PageSchema {
  const mainSections = getMainSections(schema);
  const currentIndex = mainSections.findIndex((section) => section.id === blockId);
  const nextIndex = currentIndex + (direction === "up" ? -1 : 1);
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= mainSections.length) return schema;

  [mainSections[currentIndex], mainSections[nextIndex]] = [mainSections[nextIndex], mainSections[currentIndex]];
  return applyMainOrder(schema, mainSections);
}

export function reorderHomeBlock(schema: PageSchema, draggedId: string, targetId: string): PageSchema {
  if (draggedId === targetId) return schema;
  const mainSections = getMainSections(schema);
  const draggedIndex = mainSections.findIndex((section) => section.id === draggedId);
  const targetIndex = mainSections.findIndex((section) => section.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return schema;

  const [dragged] = mainSections.splice(draggedIndex, 1);
  const adjustedTargetIndex = mainSections.findIndex((section) => section.id === targetId);
  mainSections.splice(adjustedTargetIndex < 0 ? targetIndex : adjustedTargetIndex, 0, dragged);
  return applyMainOrder(schema, mainSections);
}

function applyMainOrder(schema: PageSchema, orderedMainSections: ControlledSection[]): PageSchema {
  const positions = new Map(orderedMainSections.map((section, index) => [section.id, index * 10]));
  return {
    ...schema,
    sections: schema.sections.map((section) =>
      section.slot === "main" ? { ...section, sortOrder: positions.get(section.id) ?? section.sortOrder } : section,
    ),
  };
}

function normalizeMainSortOrders(schema: PageSchema) {
  return applyMainOrder(schema, getMainSections(schema));
}

function getMainSections(schema: PageSchema) {
  return schema.sections
    .filter((section) => section.slot === "main")
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function isValidNewId(schema: PageSchema, id: string) {
  return Boolean(id.trim()) && !schema.sections.some((section) => section.id === id);
}

function cloneJsonObject(value: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJsonValue(item)]));
}

function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(cloneJsonValue);
  if (typeof value === "object" && value !== null) return cloneJsonObject(value);
  return value;
}
