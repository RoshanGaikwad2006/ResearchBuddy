import { z } from "zod";

export const createDepartmentSchema = z.object({
  code: z.string().min(2, "Department code is required (e.g. CSE)"),
  name: z.string().min(2, "Department name is required"),
  headId: z.string().uuid("Invalid Head Faculty ID").optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export type CreateDepartmentDTO = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDTO = z.infer<typeof updateDepartmentSchema>;
