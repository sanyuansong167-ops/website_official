export type MediaAsset = {
  absoluteUrl?: string;
  altText?: string;
  contentType: string;
  createdAt: string;
  displayUrl: string;
  fileSize: number;
  id: number;
  mediaType: "DOCUMENT" | "IMAGE";
  originalFilename: string;
  publicUrl: string;
  status: string;
  updatedAt: string;
  usageTag?: string;
  version: number;
};

export type MediaAssetPage = {
  list: MediaAsset[];
  pageNo: number;
  pageSize: number;
  total: number;
};
