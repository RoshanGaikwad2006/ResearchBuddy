import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ReportService } from "../services/report.service.js";

export const getReportTemplates = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const templates = ReportService.getTemplates();
    res.status(200).json({ message: "Report templates fetched successfully", templates });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch report templates" });
  }
};

export const previewReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.role) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const reportData = await ReportService.generateReportData(req.body, {
      id: req.user.id,
      role: req.user.role as any,
    });

    res.status(200).json({
      message: "Report preview generated successfully",
      data: reportData,
    });
  } catch (error: any) {
    res.status(error.message?.includes("Forbidden") ? 403 : 400).json({
      message: error.message || "Failed to generate report preview",
    });
  }
};

export const exportReportExcel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.role) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { columns = [], reportTitle = "Institutional Research Report" } = req.body;

    const reportData = await ReportService.generateReportData(
      { ...req.body, limit: 1000 },
      { id: req.user.id, role: req.user.role as any }
    );

    const buffer = ReportService.generateCsvBuffer(reportData, columns, reportTitle);

    // Audit Logging
    await ReportService.logReportHistory(req.user.id, {
      reportType: req.body.reportType || "INSTITUTIONAL",
      title: reportTitle,
      filters: req.body,
      format: "EXCEL",
      recordCount: reportData.total,
    });

    const filename = `${reportTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to export Excel report" });
  }
};

export const exportReportPdf = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.role) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { columns = [], reportTitle = "Institutional Research Report" } = req.body;

    const reportData = await ReportService.generateReportData(
      { ...req.body, limit: 1000 },
      { id: req.user.id, role: req.user.role as any }
    );

    const htmlContent = ReportService.generateHtmlPdfReport(reportData, columns, reportTitle);

    // Audit Logging
    await ReportService.logReportHistory(req.user.id, {
      reportType: req.body.reportType || "INSTITUTIONAL",
      title: reportTitle,
      filters: req.body,
      format: "PDF",
      recordCount: reportData.total,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(htmlContent);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to export PDF report" });
  }
};

export const saveReportConfiguration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const saved = await ReportService.saveReportConfig(req.user.id, req.body);
    res.status(201).json({ message: "Report configuration saved successfully", saved });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to save report configuration" });
  }
};

export const getSavedReportConfigurations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const reports = await ReportService.getSavedReports(req.user.id);
    res.status(200).json({ message: "Saved report configurations fetched successfully", reports });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch saved report configurations" });
  }
};

export const getReportAuditHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id || !req.user?.role) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const history = await ReportService.getReportHistory(req.user.id, req.user.role as any);
    res.status(200).json({ message: "Report generation history fetched successfully", history });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch report history" });
  }
};
