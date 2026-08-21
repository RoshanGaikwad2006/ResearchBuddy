import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path, { dirname } from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface VaultFileIndex {
  localFileId: string;
  originalFilename: string;
  fileSize: number;
  fileHash: string;
  relativePath: string;
  importedAt: string;
  modifiedAt: string;
  researchId?: string;
  syncStatus: "SYNCED" | "OFFLINE_QUEUED";
}

export interface SyncQueueItem {
  operationId: string;
  type: "LOCAL_ADD" | "LOCAL_UPDATE" | "LOCAL_DELETE";
  localFileId: string;
  originalFilename?: string;
  fileSize?: number;
  fileHash?: string;
  relativePath?: string;
  researchId?: string;
  timestamp: string;
}

let mainWindow: BrowserWindow | null = null;

// Application Vault Root Directory
function getVaultDir(): string {
  const base = app.getPath("userData");
  const vaultPath = path.join(base, "ResearchVault");

  const subdirs = ["papers", "metadata", "temp", "logs"];
  subdirs.forEach((sub) => {
    const dir = path.join(vaultPath, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return vaultPath;
}

function getVaultIndexFilePath(): string {
  return path.join(getVaultDir(), "metadata", "vault_index.json");
}

function getSyncQueueFilePath(): string {
  return path.join(getVaultDir(), "metadata", "sync_queue.json");
}

function readVaultIndex(): VaultFileIndex[] {
  const file = getVaultIndexFilePath();
  if (!fs.existsSync(file)) return [];
  try {
    const content = fs.readFileSync(file, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to read vault index:", err);
    return [];
  }
}

function saveVaultIndex(index: VaultFileIndex[]): void {
  const file = getVaultIndexFilePath();
  fs.writeFileSync(file, JSON.stringify(index, null, 2), "utf-8");
}

function readSyncQueue(): SyncQueueItem[] {
  const file = getSyncQueueFilePath();
  if (!fs.existsSync(file)) return [];
  try {
    const content = fs.readFileSync(file, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    return [];
  }
}

function saveSyncQueue(queue: SyncQueueItem[]): void {
  const file = getSyncQueueFilePath();
  fs.writeFileSync(file, JSON.stringify(queue, null, 2), "utf-8");
}

function addToSyncQueue(item: SyncQueueItem): void {
  const queue = readSyncQueue();
  queue.push(item);
  saveSyncQueue(queue);
}

// Calculate SHA-256 file hash safely
function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
}

// Path Traversal Security Verification
function isPathInsideVault(targetPath: string): boolean {
  const papersDir = path.resolve(path.join(getVaultDir(), "papers"));
  const resolved = path.resolve(targetPath);
  return resolved.startsWith(papersDir);
}

// IPC Handlers Registration
function registerIpcHandlers() {
  // 1. Native File Picker for PDF Selection
  ipcMain.handle("vault:select-pdf", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Select Research Paper PDF",
      properties: ["openFile"],
      filters: [{ name: "PDF Documents (*.pdf)", extensions: ["pdf"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // 2. Import Selected PDF into Local Vault
  ipcMain.handle("vault:import-pdf", async (_event, options: { filePath: string; researchId?: string }) => {
    const { filePath, researchId } = options;

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File not found at specified path.");
    }

    // Validate Extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== ".pdf") {
      throw new Error("Only PDF files (.pdf) are allowed.");
    }

    // Validate File Size (Max 100 MB)
    const stats = fs.statSync(filePath);
    if (stats.size > 100 * 1024 * 1024) {
      throw new Error("PDF file size exceeds maximum limit of 100MB.");
    }

    // Validate PDF Header Buffer (%PDF-)
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    if (buffer.toString() !== "%PDF-") {
      throw new Error("Corrupted or invalid PDF header.");
    }

    // Calculate SHA-256 Hash
    const hash = await calculateFileHash(filePath);

    // Duplicate Check by Hash in Vault Index
    const index = readVaultIndex();
    const existing = index.find((i) => i.fileHash === hash);
    if (existing) {
      return {
        success: true,
        isDuplicate: true,
        message: "PDF paper is already present in your Research Vault.",
        document: existing,
      };
    }

    // Generate localFileId
    const localFileId = `kriya_local_${crypto.randomBytes(8).toString("hex")}`;
    const sanitizedFilename = path.basename(filePath).replace(/[^a-zA-Z0-9_.-]/g, "_");

    const paperFolder = path.join(getVaultDir(), "papers", localFileId);
    if (!fs.existsSync(paperFolder)) {
      fs.mkdirSync(paperFolder, { recursive: true });
    }

    const destinationPath = path.join(paperFolder, sanitizedFilename);

    // Path Traversal Guard Verification
    if (!isPathInsideVault(destinationPath)) {
      throw new Error("Security Violation: Target path is outside Research Vault sandbox.");
    }

    // Copy PDF File locally into Vault
    fs.copyFileSync(filePath, destinationPath);

    const relativePath = path.relative(getVaultDir(), destinationPath).replace(/\\/g, "/");

    const vaultEntry: VaultFileIndex = {
      localFileId,
      originalFilename: path.basename(filePath),
      fileSize: stats.size,
      fileHash: hash,
      relativePath,
      importedAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      researchId: researchId || undefined,
      syncStatus: "OFFLINE_QUEUED",
    };

    index.push(vaultEntry);
    saveVaultIndex(index);

    // Queue metadata sync operation for server
    addToSyncQueue({
      operationId: `op_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      type: "LOCAL_ADD",
      localFileId,
      originalFilename: vaultEntry.originalFilename,
      fileSize: vaultEntry.fileSize,
      fileHash: vaultEntry.fileHash,
      relativePath: vaultEntry.relativePath,
      researchId: vaultEntry.researchId,
      timestamp: vaultEntry.importedAt,
    });

    return {
      success: true,
      isDuplicate: false,
      message: "PDF paper successfully saved to Local Research Vault.",
      document: vaultEntry,
    };
  });

  // 3. List Local Vault Documents & Metric Summary
  ipcMain.handle("vault:list-pdfs", async () => {
    const index = readVaultIndex();
    let totalBytes = 0;
    index.forEach((item) => {
      totalBytes += item.fileSize || 0;
    });

    const queue = readSyncQueue();

    return {
      documents: index,
      pdfCount: index.length,
      totalBytes,
      queuedSyncOpsCount: queue.length,
    };
  });

  // 4. Securely Open PDF in System Default Viewer
  ipcMain.handle("vault:open-pdf", async (_event, localFileId: string) => {
    const index = readVaultIndex();
    const item = index.find((i) => i.localFileId === localFileId);
    if (!item) {
      throw new Error(`Document ${localFileId} not found in vault index.`);
    }

    const fullPath = path.join(getVaultDir(), item.relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error("Physical PDF file is missing from local disk.");
    }

    // Path Traversal Security Check
    if (!isPathInsideVault(fullPath)) {
      throw new Error("Security Violation: Cannot open file outside Research Vault.");
    }

    const openResult = await shell.openPath(fullPath);
    if (openResult) {
      throw new Error(`Failed to open PDF: ${openResult}`);
    }

    return { success: true };
  });

  // 5. Delete Local Physical PDF File from Vault
  ipcMain.handle("vault:delete-pdf", async (_event, localFileId: string) => {
    let index = readVaultIndex();
    const item = index.find((i) => i.localFileId === localFileId);
    if (!item) {
      return { success: false, message: "Document not found in vault index." };
    }

    const fullPath = path.join(getVaultDir(), item.relativePath);
    if (fs.existsSync(fullPath) && isPathInsideVault(fullPath)) {
      fs.unlinkSync(fullPath);

      const parentFolder = path.dirname(fullPath);
      if (fs.existsSync(parentFolder) && fs.readdirSync(parentFolder).length === 0) {
        fs.rmdirSync(parentFolder);
      }
    }

    index = index.filter((i) => i.localFileId !== localFileId);
    saveVaultIndex(index);

    // Queue delete metadata operation
    addToSyncQueue({
      operationId: `op_del_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      type: "LOCAL_DELETE",
      localFileId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Physical PDF file deleted from local vault. Institutional metadata unaffected.",
    };
  });

  // 6. Get Vault Metadata & Directory Info
  ipcMain.handle("vault:get-info", async () => {
    const vaultPath = getVaultDir();
    const index = readVaultIndex();
    let totalBytes = 0;
    index.forEach((i) => (totalBytes += i.fileSize));
    const queue = readSyncQueue();

    return {
      vaultPath,
      pdfCount: index.length,
      totalBytes,
      queuedOpsCount: queue.length,
    };
  });

  // 7. Sync Local Metadata Queue with Backend Server
  ipcMain.handle("vault:sync-queue", async (_event, authToken?: string) => {
    const queue = readSyncQueue();
    if (queue.length === 0) {
      return { success: true, message: "Sync queue is empty.", syncedCount: 0 };
    }

    if (!authToken) {
      return { success: false, message: "Authentication token required for server sync.", syncedCount: 0 };
    }

    // Post metadata queue to backend server
    const serverUrl = process.env.VITE_BACKEND_URL || "http://localhost:5000";
    try {
      const response = await fetch(`${serverUrl}/api/research-documents/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ operations: queue }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result: any = await response.json();

      // Clear processed items from sync queue and update local index syncStatus
      saveSyncQueue([]);

      const index = readVaultIndex();
      index.forEach((i) => (i.syncStatus = "SYNCED"));
      saveVaultIndex(index);

      return {
        success: true,
        message: "Local metadata queue successfully synchronized with server.",
        syncedCount: queue.length,
        serverResult: result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Offline mode / Sync warning: ${err.message}. Changes remain queued locally.`,
        syncedCount: 0,
      };
    }
  });
}

function createWindow() {
  const preloadJs = path.join(__dirname, "preload.js");
  const preloadTs = path.join(__dirname, "preload.ts");
  const preloadPath = fs.existsSync(preloadJs) ? preloadJs : preloadTs;

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "KRIYA — Institutional Research Platform & Desktop Vault",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: preloadPath,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
  mainWindow.loadURL(devUrl).catch(() => {
    const fallbackFile = path.join(__dirname, "../dist/client/index.html");
    if (fs.existsSync(fallbackFile)) {
      mainWindow?.loadFile(fallbackFile);
    }
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
