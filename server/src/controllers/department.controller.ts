import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { DepartmentService } from "../services/department.service.js";
import { createDepartmentSchema, updateDepartmentSchema } from "../validation/department.validation.js";

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

export const createDepartment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only Admin can create Departments" });
      return;
    }

    const validatedData = createDepartmentSchema.parse(req.body);
    const department = await DepartmentService.create(validatedData);

    res.status(201).json({ message: "Department created successfully", department });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create Department" });
  }
};

export const updateDepartment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only Admin can update Departments" });
      return;
    }

    const id = getParamId(req.params.id);
    const validatedData = updateDepartmentSchema.parse(req.body);
    const updated = await DepartmentService.update(id, validatedData);

    res.status(200).json({ message: "Department updated successfully", department: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update Department" });
  }
};

export const deleteDepartment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only Admin can delete Departments" });
      return;
    }

    const id = getParamId(req.params.id);
    await DepartmentService.delete(id);

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete Department" });
  }
};

export const getDepartmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const department = await DepartmentService.getById(id);
    res.status(200).json({ department });
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Department not found" });
  }
};

export const listDepartments = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const departments = await DepartmentService.list();
    res.status(200).json({ departments });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to list Departments" });
  }
};
