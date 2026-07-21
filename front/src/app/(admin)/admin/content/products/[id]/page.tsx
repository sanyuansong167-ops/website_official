import { ContentEditorRoute } from "@/features/content-editor/ContentEditorRoute";

export default async function ProductContentEditorPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return <ContentEditorRoute id={(await params).id} resourceKind="product" />;
}
