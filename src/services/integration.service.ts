import apiClient from "./apiClient";

export interface DoiMetadataPreview {
  doi: string;
  title: string;
  abstract: string;
  authors: { authorName: string; authorOrder: number }[];
  journal?: string;
  conference?: string;
  publicationYear: number;
  citationCount: number;
  keywords: string[];
  publisher?: string;
  sourceApi: "OpenAlex" | "Crossref";
}

export const previewDoiMetadata = async (doi: string): Promise<{ message: string; metadata: DoiMetadataPreview }> => {
  const response = await apiClient.get<{ message: string; metadata: DoiMetadataPreview }>("/integrations/doi/preview", {
    params: { doi },
  });
  return response.data;
};
