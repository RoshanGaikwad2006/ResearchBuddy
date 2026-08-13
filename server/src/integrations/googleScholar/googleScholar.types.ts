export interface ScholarPublicationPreview {
  scholarId?: string;
  title: string;
  authors: string;
  year?: number;
  journal?: string;
  conference?: string;
  citationCount: number;
  snippet?: string;
  link?: string;
  doi?: string;
}

export interface GoogleScholarProfilePreview {
  authorId: string;
  name: string;
  affiliation?: string;
  emailDomain?: string;
  thumbnailUrl?: string;
  scholarUrl: string;
  interests: string[];
  totalCitations: number;
  hIndex: number;
  i10Index: number;
  publicationCount: number;
  isLiveScholarData?: boolean;
  publications: ScholarPublicationPreview[];
}
