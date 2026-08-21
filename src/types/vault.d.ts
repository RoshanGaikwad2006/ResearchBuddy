export interface VaultDocument {
  localFileId: string;
  originalFilename: string;
  fileSize: number;
  fileHash: string;
  relativePath: string;
  importedAt: string;
  modifiedAt: string;
  researchId?: string;
  syncStatus?: "SYNCED" | "OFFLINE_QUEUED";
  research?: {
    id: string;
    title: string;
    doi?: string | null;
    publicationYear?: number;
    journal?: string | null;
    conference?: string | null;
  };
}

export interface KriyaVaultBridge {
  isDesktop: boolean;
  selectPdf: () => Promise<string | null>;
  importPdf: (options: { filePath: string; researchId?: string }) => Promise<{
    success: boolean;
    isDuplicate: boolean;
    message: string;
    document?: VaultDocument;
  }>;
  listLocalPdfs: () => Promise<{
    documents: VaultDocument[];
    pdfCount: number;
    totalBytes: number;
    queuedSyncOpsCount: number;
  }>;
  openPdf: (localFileId: string) => Promise<{ success: boolean }>;
  deleteLocalPdf: (localFileId: string) => Promise<{ success: boolean; message: string }>;
  getVaultInfo: () => Promise<{
    vaultPath: string;
    pdfCount: number;
    totalBytes: number;
    queuedOpsCount: number;
  }>;
  syncMetadataQueue: (authToken?: string) => Promise<{
    success: boolean;
    message: string;
    syncedCount: number;
    serverResult?: any;
  }>;
}

declare global {
  interface Window {
    kriyaVaultBridge?: KriyaVaultBridge;
  }
}
