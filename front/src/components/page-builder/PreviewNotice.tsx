import styles from "./PreviewNotice.module.css";

export function PreviewNotice({ pageName }: Readonly<{ pageName: string }>) {
  return (
    <aside className={styles.previewNotice} role="status">
      正在预览草稿：{pageName}。此页面不会写入或刷新公开内容。
    </aside>
  );
}
