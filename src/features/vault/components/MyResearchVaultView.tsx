import { useState, useEffect } from "react";
import {
  FolderLock,
  FileText,
  HardDrive,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  CheckCircle2,
  WifiOff,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  Download,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VaultDocument } from "@/types/vault";
import apiClient, { getStoredToken } from "@/services/apiClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMyResearchList } from "@/features/research/hooks/useResearch";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function MyResearchVaultView() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [vaultPath, setVaultPath] = useState<string>("");
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [queuedOpsCount, setQueuedOpsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedResearchId, setSelectedResearchId] = useState<string>("");
  const [noticeMessage, setNoticeMessage] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);

  // Link Research Paper Modal state
  const [linkingDoc, setLinkingDoc] = useState<VaultDocument | null>(null);

  // Details Modal state
  const [detailsDoc, setDetailsDoc] = useState<VaultDocument | null>(null);

  const { data: myResearches } = useMyResearchList({ limit: 100 });

  const loadVaultData = async () => {
    setIsLoading(true);
    const bridge = window.kriyaVaultBridge;

    if (bridge && bridge.isDesktop) {
      setIsDesktop(true);
      try {
        const info = await bridge.getVaultInfo();
        setVaultPath(info.vaultPath);
        setTotalBytes(info.totalBytes);
        setQueuedOpsCount(info.queuedOpsCount);

        const listRes = await bridge.listLocalPdfs();
        setDocuments(listRes.documents);
      } catch (err: any) {
        console.error("Failed to load local vault data:", err);
      }
    } else {
      setIsDesktop(false);
      // Web fallback: Fetch registered document metadata from backend API
      try {
        const res = await apiClient.get<{ documents: any[] }>("/research-documents/my");
        const mapped: VaultDocument[] = (res.data.documents || []).map((d: any) => ({
          localFileId: d.localFileId,
          originalFilename: d.originalFilename,
          fileSize: d.fileSize,
          fileHash: d.fileHash,
          relativePath: d.relativePath,
          importedAt: d.createdAt,
          modifiedAt: d.updatedAt,
          researchId: d.researchId || undefined,
          syncStatus: "SYNCED",
          research: d.research,
        }));
        setDocuments(mapped);
        let sumBytes = 0;
        mapped.forEach((m) => (sumBytes += m.fileSize || 0));
        setTotalBytes(sumBytes);
      } catch (err) {
        console.error("Failed to load backend document metadata:", err);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadVaultData();
  }, []);

  const handleAddPaper = async () => {
    const bridge = window.kriyaVaultBridge;
    if (!bridge || !bridge.isDesktop) {
      setNoticeMessage({
        type: "warning",
        text: "Please launch KRIYA Desktop App to select and save local PDF files directly on your computer.",
      });
      return;
    }

    try {
      const selectedPath = await bridge.selectPdf();
      if (!selectedPath) return;

      const result = await bridge.importPdf({
        filePath: selectedPath,
        researchId: selectedResearchId || undefined,
      });

      if (result.isDuplicate) {
        setNoticeMessage({
          type: "warning",
          text: result.message || "Duplicate SHA-256 detected. Paper is already saved in your Research Vault.",
        });
      } else if (result.success) {
        setNoticeMessage({
          type: "success",
          text: "PDF paper securely saved to Local Research Vault (PDF remained on your computer).",
        });
        await loadVaultData();
        // Trigger background metadata sync if online
        handleSyncMetadata();
      }
    } catch (err: any) {
      setNoticeMessage({
        type: "error",
        text: err.message || "Failed to import PDF paper into Local Vault.",
      });
    }
  };

  const handleOpenPdf = async (doc: VaultDocument) => {
    const bridge = window.kriyaVaultBridge;
    if (!bridge || !bridge.isDesktop) {
      setNoticeMessage({
        type: "warning",
        text: `Local PDF is stored on your desktop computer. Launch KRIYA Desktop app to open "${doc.originalFilename}".`,
      });
      return;
    }

    try {
      await bridge.openPdf(doc.localFileId);
    } catch (err: any) {
      setNoticeMessage({
        type: "error",
        text: err.message || "Failed to open local PDF file.",
      });
    }
  };

  const handleDeleteLocalPdf = async (doc: VaultDocument) => {
    if (!confirm(`Are you sure you want to remove "${doc.originalFilename}" from your Local Research Vault?\n\nNote: This deletes the physical PDF from your computer. Institutional metadata in KRIYA server remains untouched.`)) {
      return;
    }

    const bridge = window.kriyaVaultBridge;
    if (bridge && bridge.isDesktop) {
      try {
        await bridge.deleteLocalPdf(doc.localFileId);
        setNoticeMessage({
          type: "success",
          text: "Physical PDF deleted from local vault. Institutional metadata retained.",
        });
        await loadVaultData();
      } catch (err: any) {
        setNoticeMessage({
          type: "error",
          text: err.message || "Failed to delete local PDF file.",
        });
      }
    }
  };

  const { token: authStateToken } = useAuth();

  const handleSyncMetadata = async () => {
    const bridge = window.kriyaVaultBridge;
    if (!bridge || !bridge.isDesktop) return;

    setIsSyncing(true);
    try {
      const token = authStateToken || getStoredToken() || localStorage.getItem("kriya_access_token") || localStorage.getItem("token") || undefined;
      const res = await bridge.syncMetadataQueue(token);
      if (res.success) {
        setNoticeMessage({
          type: "success",
          text: res.message || "Local vault metadata synchronized with KRIYA server.",
        });
        await loadVaultData();
      } else {
        setNoticeMessage({
          type: "warning",
          text: res.message || "Offline mode: Metadata changes queued locally.",
        });
      }
    } catch (err: any) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const term = searchQuery.toLowerCase();
    const matchesTitle = doc.originalFilename.toLowerCase().includes(term);
    const matchesResearch = doc.research?.title?.toLowerCase().includes(term);
    const matchesDoi = doc.research?.doi?.toLowerCase().includes(term);
    return matchesTitle || matchesResearch || matchesDoi;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">My Research Vault</h1>
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 gap-1 text-[11px] font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> Local-First Storage
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Manage your personal research PDFs locally on your computer. Actual PDF files remain 100% private on your machine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncMetadata}
            disabled={isSyncing}
            className="h-9 px-3 border-[#E2E8F0] text-[#102A43] text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Metadata"}
          </Button>

          <Button
            onClick={handleAddPaper}
            size="sm"
            className="h-9 px-4 bg-[#102A43] hover:bg-[#173F63] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Research Paper
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      {noticeMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
            noticeMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : noticeMessage.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {noticeMessage.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
            {noticeMessage.type === "warning" && <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />}
            {noticeMessage.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
            <span>{noticeMessage.text}</span>
          </div>
          <button onClick={() => setNoticeMessage(null)} className="text-[#64748B] hover:text-[#102A43] font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Desktop vs Web Mode Privacy Assurance Banner */}
      {!isDesktop && (
        <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Info className="h-4 w-4 text-blue-700 shrink-0" />
            <span>Desktop Local Vault Integration</span>
          </div>
          <p className="text-xs text-blue-800/90 leading-relaxed font-medium">
            You are currently viewing KRIYA via Web Browser. Metadata for your registered documents is synchronized below.
            To import, open, or manage local physical PDF files directly on your computer, please run the <strong>KRIYA Desktop App</strong>.
          </p>
        </div>
      )}

      {/* Storage & Vault Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-[#102A43]" /> PDF Papers Saved
          </span>
          <p className="text-xl font-extrabold text-[#102A43]">{documents.length} PDFs</p>
        </div>

        <div className="p-4 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <HardDrive className="h-3.5 w-3.5 text-[#102A43]" /> Vault Storage Usage
          </span>
          <p className="text-xl font-extrabold text-[#102A43]">{formatBytes(totalBytes)}</p>
        </div>

        <div className="p-4 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Metadata Sync
          </span>
          <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1">
            {queuedOpsCount === 0 ? "✓ All Synced" : `${queuedOpsCount} Queued Offline`}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#E2E8F0] bg-white shadow-none space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
            <FolderLock className="h-3.5 w-3.5 text-[#2563EB]" /> Privacy Guarantee
          </span>
          <p className="text-xs font-semibold text-[#102A43] mt-1">
            0 PDF Bytes Uploaded
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <Input
            placeholder="Search papers by filename, title, or DOI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 border-[#E2E8F0]"
          />
        </div>
      </div>

      {/* Local Research Documents List */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden shadow-none">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#102A43] uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#102A43]" /> Saved Research Papers ({filteredDocs.length})
          </h3>
          <span className="text-[11px] text-[#64748B] font-medium">
            Local Directory: <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">{vaultPath || "ResearchVault/papers/"}</code>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#64748B] font-semibold">
            Loading Research Vault documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderLock className="h-10 w-10 text-[#64748B]/40 mx-auto" />
            <p className="text-sm font-bold text-[#102A43]">No Research Papers Saved Yet</p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto font-medium">
              Click <strong>"Add Research Paper"</strong> to import a PDF file. The PDF will remain safely on your computer while metadata links to your KRIYA profile.
            </p>
            <Button size="sm" onClick={handleAddPaper} className="bg-[#102A43] text-white text-xs font-semibold mt-2">
              <Plus className="h-4 w-4 mr-1.5" /> Add Research Paper
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredDocs.map((doc) => (
              <div key={doc.localFileId} className="p-4 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-xs text-[#102A43] truncate">{doc.originalFilename}</p>
                      <Badge variant="outline" className="text-[10px] font-bold text-slate-600 bg-slate-100 border-slate-200">
                        {formatBytes(doc.fileSize)}
                      </Badge>
                      {doc.syncStatus === "SYNCED" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[9px] font-bold">
                          Metadata Synced
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[9px] font-bold">
                          Queued Offline
                        </Badge>
                      )}
                    </div>

                    {doc.research && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs font-semibold text-[#2563EB] flex items-center gap-1">
                          <LinkIcon className="h-3 w-3 shrink-0" />
                          Linked Research: {doc.research.title}
                        </p>
                        {doc.research.doi && (
                          <p className="text-[10px] text-[#64748B]">DOI: {doc.research.doi}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-1 flex items-center gap-3 text-[10px] text-[#64748B]">
                      <span>Hash: <code className="font-mono text-[9px]">{doc.fileHash.slice(0, 12)}...</code></span>
                      <span>Imported: {new Date(doc.importedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenPdf(doc)}
                    className="h-8 text-xs font-semibold text-[#102A43] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open PDF
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDetailsDoc(doc)}
                    className="h-8 text-xs font-medium text-[#64748B] hover:text-[#102A43]"
                  >
                    <Info className="h-3.5 w-3.5 mr-1" /> Metadata
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteLocalPdf(doc)}
                    className="h-8 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    title="Remove PDF from local computer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Metadata Modal */}
      {detailsDoc && (
        <Dialog open={!!detailsDoc} onOpenChange={() => setDetailsDoc(null)}>
          <DialogContent className="max-w-md bg-white border border-[#E2E8F0]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#102A43]">Research Document Metadata</DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Metadata index stored in local vault and KRIYA PostgreSQL server.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs pt-2">
              <div>
                <span className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">Filename</span>
                <p className="font-semibold text-[#102A43] font-mono mt-0.5">{detailsDoc.originalFilename}</p>
              </div>

              <div>
                <span className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">Local Document ID</span>
                <p className="font-mono text-[#102A43] bg-slate-100 p-1.5 rounded border border-slate-200 text-[11px] mt-0.5">{detailsDoc.localFileId}</p>
              </div>

              <div>
                <span className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">SHA-256 Cryptographic Hash</span>
                <p className="font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 text-[10px] break-all mt-0.5">{detailsDoc.fileHash}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">File Size</span>
                  <p className="font-semibold text-[#102A43] mt-0.5">{formatBytes(detailsDoc.fileSize)}</p>
                </div>
                <div>
                  <span className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">Vault Storage</span>
                  <p className="font-semibold text-emerald-700 mt-0.5">100% Local Machine</p>
                </div>
              </div>

              {detailsDoc.research && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="font-bold text-[#64748B] uppercase tracking-wider text-[10px]">Linked Institutional Paper</span>
                  <p className="font-bold text-[#2563EB] mt-0.5">{detailsDoc.research.title}</p>
                  {detailsDoc.research.doi && <p className="text-[11px] text-[#64748B]">DOI: {detailsDoc.research.doi}</p>}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
