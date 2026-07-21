import { ContentEditorRoute } from "@/features/content-editor/ContentEditorRoute";

export default async function SolutionContentEditorPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return <ContentEditorRoute id={(await params).id} resourceKind="solution" />;
}
