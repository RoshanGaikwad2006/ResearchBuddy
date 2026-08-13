import { z } from "zod";

export const createFacultySchema = z.object({
  userId: z.string().min(1, "User ID or User Email is required"),
  employeeId: z.string().min(2, "Employee ID is required"),
  designation: z.string().min(2, "Designation is required"),
  departmentId: z.string().uuid("Invalid department ID"),
  orcid: z.string().optional().nullable().or(z.literal("")),
  scholarUrl: z.string().optional().nullable().or(z.literal("")),
  researchInterests: z.array(z.string()).optional().default([]),
});

export const updateFacultySchema = createFacultySchema.partial().omit({ userId: true });

export type CreateFacultyDTO = z.infer<typeof createFacultySchema>;
export type UpdateFacultyDTO = z.infer<typeof updateFacultySchema>;
