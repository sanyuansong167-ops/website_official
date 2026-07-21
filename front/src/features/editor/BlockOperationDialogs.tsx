import { useEffect, useRef } from "react";
import {
  homeBlockOrder,
  homeBlockTemplates,
  type HomeBlockType,
} from "@/lib/home-page-template";
import styles from "./BlockOperationDialogs.module.css";

export function AddBlockDialog({
  existingComponents,
  onAdd,
  onClose,
  open,
}: Readonly<{
  existingComponents: readonly string[];
  onAdd: (component: HomeBlockType) => void;
  onClose: () => void;
  open: boolean;
}>) {
  const dialogRef = useDialog(open);

  return (
    <dialog
      aria-labelledby="add-block-title"
      className={styles.dialog}
      onCancel={onClose}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className={styles.dialogBody}>
        <p className={styles.eyebrow}>受控组件</p>
        <h2 id="add-block-title">新增首页区块</h2>
        <p>新内容只会加入当前草稿的 main 插槽，不会直接影响公开页面。</p>
        <div className={styles.blockOptions}>
          {homeBlockOrder.map((component) => {
            const template = homeBlockTemplates[component];
            const disabled = !template.isRepeatable && existingComponents.includes(component);

            return (
              <button
                disabled={disabled}
                key={component}
                onClick={() => onAdd(component)}
                type="button"
              >
                <strong>{template.label}</strong>
                <span>{component}</span>
                {disabled ? <small>当前页面已存在，不能重复添加</small> : null}
              </button>
            );
          })}
        </div>
        <div className={styles.dialogActions}>
          <button onClick={onClose} type="button">取消</button>
        </div>
      </div>
    </dialog>
  );
}

export function DeleteBlockDialog({
  blockLabel,
  onClose,
  onConfirm,
  open,
}: Readonly<{
  blockLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}>) {
  const dialogRef = useDialog(open);

  return (
    <dialog
      aria-labelledby="delete-block-title"
      className={styles.dialog}
      onCancel={onClose}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className={styles.dialogBody}>
        <p className={styles.eyebrow}>删除确认</p>
        <h2 id="delete-block-title">删除“{blockLabel}”区块？</h2>
        <p>删除会从当前草稿中移除该区块，保存前仍可通过刷新放弃本次修改。</p>
        <div className={styles.dialogActions}>
          <button onClick={onClose} type="button">取消</button>
          <button className={styles.dangerButton} onClick={onConfirm} type="button">确认删除</button>
        </div>
      </div>
    </dialog>
  );
}

function useDialog(open: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return dialogRef;
}
