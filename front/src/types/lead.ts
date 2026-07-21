export type LeadStatus = 0 | 1 | 2 | 3;

export type AdminLeadListItem = {
  company: string;
  demandDescriptionPreview?: string;
  id: number;
  maskedEmail: string;
  maskedPhone?: string;
  name: string;
  status: LeadStatus;
  statusLabel: string;
  submittedAt: string;
  updatedAt: string;
};

export type AdminLeadPage = {
  list: AdminLeadListItem[];
  pageNo: number;
  pageSize: number;
  total: number;
};

export type AdminLeadQuery = {
  pageNo: number;
  pageSize: number;
  status?: LeadStatus;
  submitAtEnd?: string;
  submitAtStart?: string;
};

export type AdminLeadDetail = {
  company: string;
  demandDescription?: string;
  email: string;
  id: number;
  name: string;
  phone?: string;
  status: LeadStatus;
  statusLabel: string;
  submitIp: string;
  submittedAt: string;
  updatedAt: string;
  version: number;
};

export type LeadExportRequest =
  | { exportMode: "SELECTED"; selectedIds: number[] }
  | {
      exportMode: "FILTERED";
      status?: LeadStatus;
      submitAtEnd?: string;
      submitAtStart?: string;
    };

export type LeadExportFile = {
  blob: Blob;
  filename: string;
};
