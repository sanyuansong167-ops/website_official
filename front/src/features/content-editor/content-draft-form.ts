import type { JsonObject } from "@/types/page-builder";

export type ContentDraftForm = {
  seoDescription: string;
  seoKeywords: string;
  seoTitle: string;
  summary: string;
  title: string;
};

export function contentDraftToForm(draft: JsonObject): ContentDraftForm {
  return {
    seoDescription: readString(draft.seoDescription),
    seoKeywords: readString(draft.seoKeywords),
    seoTitle: readString(draft.seoTitle),
    summary: readString(draft.summary),
    title: readString(draft.title),
  };
}

export function mergeContentDraftForm(draft: JsonObject, form: ContentDraftForm): JsonObject {
  return {
    ...draft,
    seoDescription: form.seoDescription.trim(),
    seoKeywords: form.seoKeywords.trim(),
    seoTitle: form.seoTitle.trim(),
    summary: form.summary.trim(),
    title: form.title.trim(),
  };
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
