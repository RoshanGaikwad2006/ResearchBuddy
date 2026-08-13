import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  exportReportExcelApi,
  exportReportPdfApi,
  getReportHistoryApi,
  getReportTemplatesApi,
  getSavedReportsApi,
  previewReportApi,
  saveReportConfigApi,
  type ReportFilterPayload,
} from "@/services/report.service";

export const useReportTemplates = () => {
  return useQuery({
    queryKey: ["report-templates"],
    queryFn: getReportTemplatesApi,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useReportPreview = (payload: ReportFilterPayload, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["report-preview", payload],
    queryFn: () => previewReportApi(payload),
    enabled,
  });
};

export const useExportExcel = () => {
  return useMutation({
    mutationFn: (payload: ReportFilterPayload) => exportReportExcelApi(payload),
    onSuccess: () => {
      toast.success("Excel (.CSV) Report Downloaded!", {
        description: "Standardized institutional data spreadsheet saved successfully.",
      });
    },
    onError: (err: any) => {
      toast.error("Excel Export Failed", {
        description: err.response?.data?.message || err.message || "Failed to generate Excel file.",
      });
    },
  });
};

export const useExportPdf = () => {
  return useMutation({
    mutationFn: (payload: ReportFilterPayload) => exportReportPdfApi(payload),
    onSuccess: () => {
      toast.success("Printable PDF Report Generated!", {
        description: "Official institutional layout opened in printable window.",
      });
    },
    onError: (err: any) => {
      toast.error("PDF Export Failed", {
        description: err.response?.data?.message || err.message || "Failed to generate PDF document.",
      });
    },
  });
};

export const useSaveReportConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => saveReportConfigApi(payload),
    onSuccess: () => {
      toast.success("Report Configuration Saved!", {
        description: "Configuration preserved for 1-click re-generation.",
      });
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
    },
    onError: (err: any) => {
      toast.error("Save Configuration Failed", {
        description: err.response?.data?.message || err.message || "Could not save report configuration.",
      });
    },
  });
};

export const useSavedReports = () => {
  return useQuery({
    queryKey: ["saved-reports"],
    queryFn: getSavedReportsApi,
  });
};

export const useReportHistory = () => {
  return useQuery({
    queryKey: ["report-history"],
    queryFn: getReportHistoryApi,
  });
};
