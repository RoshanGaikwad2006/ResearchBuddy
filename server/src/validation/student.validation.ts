import { z } from "zod";

export const createStudentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  rollNumber: z.string().min(2, "Roll Number is required"),
  departmentId: z.string().uuid("Invalid department ID"),
  guideFacultyId: z.string().uuid("Invalid guide faculty ID").optional().nullable(),
  academicYear: z.string().min(2, "Academic year is required"), // e.g. "2023-2027"
});

export const updateStudentSchema = createStudentSchema.partial().omit({ userId: true });

export type CreateStudentDTO = z.infer<typeof createStudentSchema>;
export type UpdateStudentDTO = z.infer<typeof updateStudentSchema>;
