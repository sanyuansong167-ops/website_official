export type ContentBindingSource = "CASE" | "INDUSTRY_SOLUTION" | "PRODUCT";
export type ContentBindingMode = "AUTO" | "MANUAL";
export type ContentBindingSort = "SORT_ORDER_ASC" | "UPDATED_AT_DESC";

export type BindableContentItem = {
  id: number;
  sortOrder: number;
  source: ContentBindingSource;
  summary: string;
  tags: string[];
  thumbnailUrl?: string;
  title: string;
  updatedAt?: string;
  visible: boolean;
};

export type BindableContentPage = {
  list: BindableContentItem[];
  pageNo: number;
  pageSize: number;
  total: number;
};

export type BindableContentSnapshot = {
  complete: boolean;
  items: BindableContentItem[];
  source: ContentBindingSource;
};

export type ContentBindingRequest = {
  blockId: string;
  displayMode: ContentBindingMode;
  limit: number;
  selectedIds: number[];
  sortBy: ContentBindingSort;
  source: ContentBindingSource;
  tag?: string;
};

export type ContentBindingDependencyIssue = {
  blockId: string;
  field: "filters" | "selectedIds" | "sortBy";
  message: string;
};

export type ContentBindingResolution = {
  issues: ContentBindingDependencyIssue[];
  items: BindableContentItem[];
};
