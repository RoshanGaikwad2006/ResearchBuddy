import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { StudentService } from "../services/student.service.js";
import { createStudentSchema, updateStudentSchema } from "../validation/student.validation.js";

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

export const getMyStudentProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const student = await StudentService.getByUserId(req.user.id);
    res.status(200).json({ student });
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Student profile not found" });
  }
};

export const createStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only Admin can create Student profiles" });
      return;
    }

    const validatedData = createStudentSchema.parse(req.body);
    const student = await StudentService.create(validatedData);

    res.status(201).json({ message: "Student profile created successfully", student });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create Student" });
  }
};

export const updateStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const currentStudent = await StudentService.getById(id);

    if (req.user?.role !== "ADMIN" && currentStudent.userId !== req.user?.id) {
      res.status(403).json({ message: "You can only edit your own Student profile" });
      return;
    }

    const validatedData = updateStudentSchema.parse(req.body);
    const updated = await StudentService.update(id, validatedData);

    res.status(200).json({ message: "Student profile updated successfully", student: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update Student" });
  }
};

export const deleteStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only Admin can delete Student profiles" });
      return;
    }

    const id = getParamId(req.params.id);
    await StudentService.delete(id);

    res.status(200).json({ message: "Student profile deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete Student" });
  }
};

export const getStudentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const student = await StudentService.getById(id);

    if (
      req.user?.role !== "ADMIN" &&
      req.user?.role !== "RESEARCH_CELL" &&
      req.user?.role !== "FACULTY" &&
      student.userId !== req.user?.id
    ) {
      res.status(403).json({ message: "Forbidden: You cannot access another Student's private profile" });
      return;
    }

    res.status(200).json({ student });
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Student not found" });
  }
};

export const listStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, departmentId, guideFacultyId, page, limit } = req.query;
    const result = await StudentService.list({
      search: search as string | undefined,
      departmentId: departmentId as string | undefined,
      guideFacultyId: guideFacultyId as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to list Students" });
  }
};
