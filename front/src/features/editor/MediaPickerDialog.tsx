import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getCsrfToken } from "@/services/admin-api";
import { getImageAssets, uploadImageAsset } from "@/services/media-api";
import type { MediaAsset, MediaAssetPage } from "@/types/media";
import styles from "./MediaPickerDialog.module.css";

type MediaState =
  | { status: "loading" }
  | { page: MediaAssetPage; status: "ready" }
  | { message: string; status: "error" };

export function MediaPickerDialog({
  currentMediaId,
  onClose,
  onSelect,
  open,
}: Readonly<{
  currentMediaId?: number;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  open: boolean;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pageNo, setPageNo] = useState(1);
  const [mediaState, setMediaState] = useState<MediaState>({ status: "loading" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    void getImageAssets(pageNo)
      .then((page) => {
        if (active) setMediaState({ page, status: "ready" });
      })
      .catch(() => {
        if (active) setMediaState({ message: "暂时无法读取媒体库，请稍后重试。", status: "error" });
      });

    return () => {
      active = false;
    };
  }, [open, pageNo]);

  async function handleUpload(file: File | undefined) {
    setUploadError(null);
    if (!file) return;
    if (!isSupportedImage(file)) {
      setUploadError("仅支持 PNG、JPG、JPEG 或 WEBP 图片。");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("图片不能超过 2MB。");
      return;
    }

    setUploading(true);
    try {
      const csrf = await getCsrfToken();
      const asset = await uploadImageAsset(file, csrf);
      onSelect(asset);
    } catch {
      setUploadError("图片上传失败，请检查登录状态、文件内容和后台服务。");
    } finally {
      setUploading(false);
    }
  }

  const page = mediaState.status === "ready" ? mediaState.page : null;
  const hasPrevious = Boolean(page && page.pageNo > 1);
  const hasNext = Boolean(page && page.pageNo * page.pageSize < page.total);

  function changePage(nextPage: number) {
    setMediaState({ status: "loading" });
    setPageNo(nextPage);
  }

  return (
    <dialog
      aria-labelledby="media-picker-title"
      className={styles.dialog}
      onCancel={(event) => {
        if (uploading) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={() => !uploading && onClose()}
      ref={dialogRef}
    >
      <div className={styles.dialogBody}>
        <div className={styles.heading}>
          <div>
            <p>受保护媒体库</p>
            <h2 id="media-picker-title">选择图片</h2>
          </div>
          <label className={styles.uploadButton}>
            {uploading ? "正在上传…" : "上传新图片"}
            <input
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(event) => {
                void handleUpload(event.target.files?.[0]);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        </div>
        <p className={styles.uploadHint}>图片支持 PNG、JPG、JPEG、WEBP，单文件不超过 2MB。</p>
        {uploadError ? <p className={styles.error} role="alert">{uploadError}</p> : null}
        {mediaState.status === "loading" ? <p role="status">正在读取媒体库…</p> : null}
        {mediaState.status === "error" ? <p className={styles.error} role="alert">{mediaState.message}</p> : null}
        {page?.list.length === 0 ? <p>媒体库中暂无可用图片。</p> : null}
        {page && page.list.length > 0 ? (
          <div className={styles.assetGrid}>
            {page.list.map((asset) => (
              <button
                aria-pressed={asset.id === currentMediaId}
                className={styles.assetCard}
                key={asset.id}
                onClick={() => onSelect(asset)}
                type="button"
              >
                <span className={styles.preview}>
                  <Image alt="" fill sizes="180px" src={asset.displayUrl} unoptimized />
                </span>
                <strong>{asset.originalFilename}</strong>
                <small>ID {asset.id} · {formatFileSize(asset.fileSize)}</small>
                {asset.altText ? <small>替代文本：{asset.altText}</small> : null}
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.dialogActions}>
          <div>
            <button disabled={!hasPrevious || uploading} onClick={() => changePage(pageNo - 1)} type="button">上一页</button>
            <button disabled={!hasNext || uploading} onClick={() => changePage(pageNo + 1)} type="button">下一页</button>
          </div>
          <button disabled={uploading} onClick={onClose} type="button">取消</button>
        </div>
      </div>
    </dialog>
  );
}

function isSupportedImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 1024 * 100 ? 1 : 0)} KB`;
}
