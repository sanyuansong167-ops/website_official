import type { ContentResourceKind } from "@/types/content-editor";
import type { JsonObject, JsonValue } from "@/types/page-builder";

export type ContentDraftForm = {
  applicationScenarios: string;
  background: string;
  content: string;
  coreCapabilities: string;
  coverAltText: string;
  coverMediaId: number | null;
  customerName: string;
  customerTags: string;
  features: string;
  galleryMediaIds: number[];
  heroAltText: string;
  heroMediaId: number | null;
  highlights: string;
  industry: string;
  painPoints: string;
  primaryMediaAltText: string;
  primaryMediaId: number | null;
  relatedCaseIds: number[];
  relatedIndustrySolutionIds: number[];
  relatedProductIds: number[];
  result: string;
  seoDescription: string;
  seoKeywords: string;
  seoTitle: string;
  shortTitle: string;
  solution: string;
  solutionApproach: string;
  summary: string;
  title: string;
};

export function contentDraftToForm(draft: JsonObject, kind: ContentResourceKind): ContentDraftForm {
  const seo = readObject(draft.seo);
  const primaryMediaId = kind === "product"
    ? readNumber(draft.logoMediaId, draft.logoId)
    : kind === "case"
      ? readNumber(draft.logoMediaId)
      : readNumber(draft.iconMediaId);

  return {
    applicationScenarios: readLines(draft.applicationScenarios),
    background: readString(draft.background),
    content: readString(draft.content, draft.richText, draft.body),
    coreCapabilities: readLines(draft.coreCapabilities),
    coverAltText: readString(draft.coverAltText),
    coverMediaId: readNumber(draft.coverMediaId),
    customerName: readString(draft.customerName),
    customerTags: readLines(draft.customerTags),
    features: readLines(draft.features),
    galleryMediaIds: readNumberArray(draft.imageIds, draft.galleryMediaIds),
    heroAltText: readString(draft.heroAltText),
    heroMediaId: readNumber(draft.thumbnailId, draft.heroMediaId),
    highlights: readLines(draft.highlights),
    industry: readString(draft.industry),
    painPoints: readLines(draft.painPoints),
    primaryMediaAltText: readString(
      kind === "solution" ? draft.iconAltText : draft.logoAltText,
      draft.primaryMediaAltText,
    ),
    primaryMediaId,
    relatedCaseIds: readNumberArray(
      kind === "case" ? draft.recommendedCaseIds : draft.relatedCaseIds,
      draft.caseIds,
    ),
    relatedIndustrySolutionIds: readNumberArray(draft.relatedIndustrySolutionIds, draft.industrySolutionIds),
    relatedProductIds: readNumberArray(draft.relatedProductIds, draft.productIds),
    result: readString(draft.result),
    seoDescription: readString(seo?.description, draft.seoDescription),
    seoKeywords: readKeywords(seo?.keywords, draft.seoKeywords),
    seoTitle: readString(seo?.title, draft.seoTitle),
    shortTitle: readString(draft.shortTitle, draft.subTitle),
    solution: readString(draft.solution),
    solutionApproach: readLines(draft.solutionApproach),
    summary: readString(draft.description, draft.abstractText, draft.summary),
    title: readString(kind === "case" ? draft.title : draft.name, draft.title, draft.name),
  };
}

export function mergeContentDraftForm(
  draft: JsonObject,
  form: ContentDraftForm,
  kind: ContentResourceKind,
): JsonObject {
  const next: JsonObject = { ...draft };
  removeLegacyAliases(next);

  if (kind === "case") {
    next.title = form.title.trim();
    next.summary = form.summary.trim();
    next.customerName = form.customerName.trim();
    next.industry = form.industry.trim();
    next.background = form.background.trim();
    next.solution = form.solution.trim();
    next.result = form.result.trim();
    next.logoMediaId = form.primaryMediaId;
    next.logoAltText = form.primaryMediaAltText.trim();
    next.recommendedCaseIds = form.relatedCaseIds;
    next.relatedProductIds = form.relatedProductIds;
  } else if (kind === "product") {
    next.name = form.title.trim();
    next.shortTitle = form.shortTitle.trim();
    next.description = form.summary.trim();
    next.logoId = form.primaryMediaId;
    next.logoAltText = form.primaryMediaAltText.trim();
    next.highlights = splitLines(form.highlights);
    next.applicableIndustries = splitLines(form.applicationScenarios);
    next.features = splitLines(form.features);
    next.relatedCaseIds = form.relatedCaseIds;
    next.relatedIndustrySolutionIds = form.relatedIndustrySolutionIds;
  } else {
    next.name = form.title.trim();
    next.description = form.summary.trim();
    next.iconMediaId = form.primaryMediaId;
    next.iconAltText = form.primaryMediaAltText.trim();
    next.customerTags = splitLines(form.customerTags);
    next.painPoints = splitLines(form.painPoints);
    next.solutionApproach = splitLines(form.solutionApproach);
    next.coreCapabilities = splitLines(form.coreCapabilities);
    next.applicationScenarios = splitLines(form.applicationScenarios);
    next.relatedProductIds = form.relatedProductIds;
    next.relatedCaseIds = form.relatedCaseIds;
    next.relatedIndustrySolutionIds = form.relatedIndustrySolutionIds;
  }

  next.content = form.content.trim();
  next.coverMediaId = form.coverMediaId;
  next.coverAltText = form.coverAltText.trim();
  next.thumbnailId = form.heroMediaId;
  next.heroAltText = form.heroAltText.trim();
  next.imageIds = form.galleryMediaIds;
  next.seo = {
    description: form.seoDescription.trim(),
    keywords: splitKeywords(form.seoKeywords),
    title: form.seoTitle.trim(),
  };
  return next;
}

function removeLegacyAliases(draft: JsonObject) {
  [
    "abstractText",
    "body",
    "caseIds",
    "description",
    "galleryMediaIds",
    "heroMediaId",
    "imageIds",
    "industrySolutionIds",
    "logoMediaId",
    "name",
    "productIds",
    "relatedCaseIds",
    "relatedIndustrySolutionIds",
    "relatedProductIds",
    "richText",
    "seoDescription",
    "seoKeywords",
    "seoTitle",
    "subTitle",
    "summary",
    "title",
  ].forEach((key) => delete draft[key]);
}

function readObject(value: JsonValue | undefined): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : undefined;
}

function readString(...values: Array<JsonValue | undefined>): string {
  return values.find((value): value is string => typeof value === "string") ?? "";
}

function readNumber(...values: Array<JsonValue | undefined>): number | null {
  const value = values.find((item): item is number => typeof item === "number" && Number.isSafeInteger(item) && item > 0);
  return value ?? null;
}

function readNumberArray(...values: Array<JsonValue | undefined>): number[] {
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    return value.filter((item): item is number => typeof item === "number" && Number.isSafeInteger(item) && item > 0);
  }
  return [];
}

function readLines(value: JsonValue | undefined): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.filter((item): item is string => typeof item === "string").join("\n");
}

function readKeywords(...values: Array<JsonValue | undefined>): string {
  for (const value of values) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").join("，");
  }
  return "";
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function splitKeywords(value: string): string[] {
  return value.split(/[,，\r\n]/).map((item) => item.trim()).filter(Boolean);
}
