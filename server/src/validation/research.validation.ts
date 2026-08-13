import { z } from "zod";

export const authorInputSchema = z.object({
  facultyId: z.string().uuid().optional().nullable(),
  studentId: z.string().uuid().optional().nullable(),
  authorName: z.string().min(1, "Author name is required"),
  authorOrder: z.number().int().min(1).default(1),
  isCorresponding: z.boolean().default(false),
});

export const createResearchSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  abstract: z.string().min(10, "Abstract is required"),
  keywords: z.array(z.string()).min(1, "At least one keyword is required"),
  researchArea: z.string().min(2, "Research area is required"),
  doi: z.string().optional().nullable(),
  journal: z.string().optional().nullable(),
  conference: z.string().optional().nullable(),
  venueType: z.string().optional().nullable(),
  patentNumber: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  publicationYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  pdfUrl: z.string().url().optional().nullable().or(z.literal("")),
  departmentId: z.string().uuid().optional().nullable(),
  authors: z.array(authorInputSchema).min(1, "At least one author is required"),
});

export const updateResearchSchema = createResearchSchema.partial();

export type CreateResearchDTO = z.infer<typeof createResearchSchema>;
export type UpdateResearchDTO = z.infer<typeof updateResearchSchema>;
