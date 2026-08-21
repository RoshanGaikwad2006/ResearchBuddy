import { contextBridge, ipcRenderer } from "electron";

// Secure contextBridge exposure to React renderer window
contextBridge.exposeInMainWorld("kriyaVaultBridge", {
  isDesktop: true,

  selectPdf: async () => {
    return ipcRenderer.invoke("vault:select-pdf");
  },

  importPdf: async (options: { filePath: string; researchId?: string }) => {
    return ipcRenderer.invoke("vault:import-pdf", options);
  },

  listLocalPdfs: async () => {
    return ipcRenderer.invoke("vault:list-pdfs");
  },

  openPdf: async (localFileId: string) => {
    return ipcRenderer.invoke("vault:open-pdf", localFileId);
  },

  deleteLocalPdf: async (localFileId: string) => {
    return ipcRenderer.invoke("vault:delete-pdf", localFileId);
  },

  getVaultInfo: async () => {
    return ipcRenderer.invoke("vault:get-info");
  },

  syncMetadataQueue: async (authToken?: string) => {
    return ipcRenderer.invoke("vault:sync-queue", authToken);
  },
});
