import type { ReactNode } from "react";
import type { RenderMode } from "@/types/page-builder";
import styles from "./EditableSection.module.css";

type EditableSectionProps = {
  blockLabel: string;
  blockId: string;
  children: ReactNode;
  canMoveDown?: boolean;
  canMoveUp?: boolean;
  isHidden?: boolean;
  isSelected?: boolean;
  mode: RenderMode;
  onCopy?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  onSelect?: (blockId: string) => void;
  onToggleVisibility?: (blockId: string) => void;
};

export function EditableSection({
  blockLabel,
  blockId,
  children,
  canMoveDown = false,
  canMoveUp = false,
  isHidden = false,
  isSelected = false,
  mode,
  onCopy,
  onDelete,
  onMoveDown,
  onMoveUp,
  onReorder,
  onSelect,
  onToggleVisibility,
}: EditableSectionProps) {
  const editorAttributes =
    mode === "editor"
      ? {
          "data-block-id": blockId,
          "data-hidden": isHidden,
          "data-selected": isSelected,
        }
      : {};

  return (
    <section
      className={styles.section}
      onDragOver={mode === "editor" && onReorder ? (event) => event.preventDefault() : undefined}
      onDrop={mode === "editor" && onReorder ? (event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData("text/plain");
        if (draggedId) onReorder(draggedId, blockId);
      } : undefined}
      {...editorAttributes}
    >
      {mode === "editor" && onSelect ? (
        <div aria-label={`${blockLabel} 区块操作`} className={styles.blockToolbar} role="group">
          <button
            aria-label={`选择区块 ${blockLabel}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(blockId)}
            type="button"
          >
            {isSelected ? "已选择" : "选择"}
          </button>
          {onReorder ? (
            <button
              aria-label={`拖拽区块 ${blockLabel}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", blockId);
              }}
              type="button"
            >
              拖动
            </button>
          ) : null}
          {onToggleVisibility ? (
            <button
              aria-label={`${isHidden ? "显示" : "隐藏"}区块 ${blockLabel}`}
              onClick={() => onToggleVisibility(blockId)}
              type="button"
            >
              {isHidden ? "显示" : "隐藏"}
            </button>
          ) : null}
          {onMoveUp ? (
            <button
              aria-label={`上移区块 ${blockLabel}`}
              disabled={!canMoveUp}
              onClick={() => onMoveUp(blockId)}
              type="button"
            >
              上移
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              aria-label={`下移区块 ${blockLabel}`}
              disabled={!canMoveDown}
              onClick={() => onMoveDown(blockId)}
              type="button"
            >
              下移
            </button>
          ) : null}
          {onCopy ? (
            <button aria-label={`复制区块 ${blockLabel}`} onClick={() => onCopy(blockId)} type="button">
              复制
            </button>
          ) : null}
          {onDelete ? (
            <button aria-label={`删除区块 ${blockLabel}`} onClick={() => onDelete(blockId)} type="button">
              删除
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
