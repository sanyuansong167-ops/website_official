import { ContentEditorRoute } from "@/features/content-editor/ContentEditorRoute";

export default async function CaseContentEditorPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return <ContentEditorRoute id={(await params).id} resourceKind="case" />;
}
