import { EditableSection } from "@/components/page-builder/EditableSection";
import { getBlockDefinition, getBlockRenderer, isBlockSlotAllowed } from "@/components/page-builder/block-registry";
import type { JsonObject, PageSchema, PageSlot, RenderMode } from "@/types/page-builder";
import styles from "./PageRenderer.module.css";

type PageRendererProps = {
  mode: RenderMode;
  onCopyBlock?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onMoveBlock?: (blockId: string, direction: "down" | "up") => void;
  onReorderBlock?: (draggedId: string, targetId: string) => void;
  onSelectBlock?: (blockId: string) => void;
  onToggleBlockVisibility?: (blockId: string) => void;
  resolvedDataByBlockId?: Readonly<Record<string, JsonObject>>;
  schema: PageSchema;
  selectedBlockId?: string;
};

const slotOrder: PageSlot[] = ["header", "main", "footer"];

export function PageRenderer({
  mode,
  onCopyBlock,
  onDeleteBlock,
  onMoveBlock,
  onReorderBlock,
  onSelectBlock,
  onToggleBlockVisibility,
  resolvedDataByBlockId,
  schema,
  selectedBlockId,
}: PageRendererProps) {
  const sections = [...schema.sections].sort((left, right) => {
    const slotDifference = slotOrder.indexOf(left.slot) - slotOrder.indexOf(right.slot);
    return slotDifference || left.sortOrder - right.sortOrder;
  });

  return (
    <div className={styles.renderer} data-render-mode={mode}>
      {slotOrder.map((slot) => (
        <div className={styles.slot} data-slot={mode === "editor" ? slot : undefined} key={slot}>
          {sections.filter((section) => section.slot === slot).map((section, sectionIndex, slotSections) => {
            if (!section.visible && mode !== "editor") return null;

            const BlockRenderer = getBlockRenderer(section.component);
            const blockDefinition = getBlockDefinition(section.component);
            const hasPlacementError = !isBlockSlotAllowed(section.component, section.slot);
            const renderSection = resolvedDataByBlockId &&
              Object.prototype.hasOwnProperty.call(resolvedDataByBlockId, section.id)
              ? { ...section, data: resolvedDataByBlockId[section.id] }
              : section;

            if ((!BlockRenderer || hasPlacementError) && mode !== "editor") return null;

            return (
              <EditableSection
                blockLabel={section.component}
                blockId={section.id}
                canMoveDown={section.slot === "main" && sectionIndex < slotSections.length - 1}
                canMoveUp={section.slot === "main" && sectionIndex > 0}
                isHidden={!section.visible}
                isSelected={selectedBlockId === section.id}
                key={section.id}
                mode={mode}
                onCopy={onCopyBlock && section.slot === "main" && blockDefinition?.isRepeatable ? onCopyBlock : undefined}
                onDelete={onDeleteBlock && section.slot === "main" ? onDeleteBlock : undefined}
                onMoveDown={onMoveBlock && section.slot === "main" ? (blockId) => onMoveBlock(blockId, "down") : undefined}
                onMoveUp={onMoveBlock && section.slot === "main" ? (blockId) => onMoveBlock(blockId, "up") : undefined}
                onReorder={onReorderBlock && section.slot === "main" ? onReorderBlock : undefined}
                onSelect={onSelectBlock}
                onToggleVisibility={onToggleBlockVisibility && section.slot === "main" ? onToggleBlockVisibility : undefined}
              >
                {!section.visible && mode === "editor" ? (
                  <span className={styles.hiddenLabel}>已隐藏</span>
                ) : null}
                {hasPlacementError ? (
                  <div className={styles.unknownBlock} role="alert">
                    非法插槽：{section.component} 不能放在 {section.slot}。
                  </div>
                ) : BlockRenderer ? (
                  <BlockRenderer mode={mode} section={renderSection} />
                ) : (
                  <div className={styles.unknownBlock} role="alert">
                    未注册区块：{section.component}
                  </div>
                )}
              </EditableSection>
            );
          })}
        </div>
      ))}
    </div>
  );
}
