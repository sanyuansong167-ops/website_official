import type { PageDraft, PageSchema } from "@/types/page-builder";

export type DraftInitialization =
  | { schema: PageSchema; status: "ready" }
  | { status: "initialization-required" };

export function resolveDraftInitialization(draft: PageDraft): DraftInitialization {
  if (draft.schemaJson) {
    return { schema: draft.schemaJson, status: "ready" };
  }

  return { status: "initialization-required" };
}
