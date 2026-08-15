import apiClient from "./apiClient";

export interface ReportTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultColumns: string[];
}

export interface ReportFilterPayload {
  reportType: string;
  reportTitle?: string | undefined;
  departmentId?: string | undefined;
  facultyId?: string | undefined;
  yearStart?: number | undefined;
  yearEnd?: number | undefined;
  researchArea?: string | undefined;
  status?: string | undefined;
  journalOrConference?: "JOURNAL" | "CONFERENCE" | "ALL" | undefined;
  citationMin?: number | undefined;
  search?: string | undefined;
  columns?: string[] | undefined;
  grouping?: "department" | "year" | "status" | "researchArea" | "none" | undefined;
  sorting?: "year_desc" | "year_asc" | "citations_desc" | "citations_asc" | "title_asc" | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface ReportPreviewResponse {
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalPublications: number;
      totalCitations: number;
      avgCitations: string;
      publishedCount: number;
    };
    grouping: string;
    groupSummaries: any[];
    records: any[];
    appliedFilters: Record<string, string>;
  };
}

export const getReportTemplatesApi = async (): Promise<{ message: string; templates: ReportTemplate[] }> => {
  const response = await apiClient.get("/reports/templates");
  return response.data;
};

export const previewReportApi = async (payload: ReportFilterPayload): Promise<ReportPreviewResponse> => {
  const response = await apiClient.post<ReportPreviewResponse>("/reports/preview", payload);
  return response.data;
};

export const exportReportExcelApi = async (payload: ReportFilterPayload): Promise<void> => {
  const response = await apiClient.post("/reports/export/excel", payload, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  const fileName = `${(payload.reportTitle || "Research_Report").replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportReportPdfApi = async (payload: ReportFilterPayload): Promise<void> => {
  const response = await apiClient.post("/reports/export/pdf", payload, {
    responseType: "text",
  });
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(response.data);
    printWindow.document.close();
  }
};

export const saveReportConfigApi = async (payload: any) => {
  const response = await apiClient.post("/reports/saved", payload);
  return response.data;
};

export const getSavedReportsApi = async () => {
  const response = await apiClient.get("/reports/saved");
  return response.data;
};

export const getReportHistoryApi = async () => {
  const response = await apiClient.get("/reports/history");
  return response.data;
};
