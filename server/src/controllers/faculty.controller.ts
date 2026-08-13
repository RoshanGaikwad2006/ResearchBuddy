import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { FacultyService } from "../services/faculty.service.js";
import { FacultyResearchIdentityService } from "../services/facultyResearchIdentity.service.js";
import { ScholarSyncAgent } from "../integrations/googleScholar/scholarSyncAgent.service.js";
import { createFacultySchema, updateFacultySchema } from "../validation/faculty.validation.js";

const getParamId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
};

export const getMyFacultyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const faculty = await FacultyService.getByUserId(req.user.id);
    res.status(200).json({ faculty });
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Faculty profile not found" });
  }
};

export const getMyResearchIdentity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const faculty = await FacultyService.getByUserId(req.user.id);
    const identity = await FacultyResearchIdentityService.getFacultyResearchIdentity(faculty.id);
    res.status(200).json(identity);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch research identity" });
  }
};

export const updateMyResearchIdentity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const faculty = await FacultyService.getByUserId(req.user.id);
    const updated = await FacultyResearchIdentityService.updateResearchIdentity(faculty.id, req.body);
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update research identity" });
  }
};

export const syncMyResearchProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const faculty = await FacultyService.getByUserId(req.user.id);
    const syncItem = await ScholarSyncAgent.syncSingleFaculty(faculty.id, { triggerType: "MANUAL_FACULTY" });
    res.status(200).json({ message: "Synchronization completed successfully", item: syncItem });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to sync research profile" });
  }
};

export const createFaculty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only Admin can create Faculty profiles" });
      return;
    }

    const validatedData = createFacultySchema.parse(req.body);
    const faculty = await FacultyService.create(validatedData);

    res.status(201).json({ message: "Faculty profile created successfully", faculty });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create Faculty" });
  }
};

export const updateFaculty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const currentFaculty = await FacultyService.getById(id);

    if (req.user?.role !== "ADMIN" && currentFaculty.userId !== req.user?.id) {
      res.status(403).json({ message: "You can only edit your own Faculty profile" });
      return;
    }

    const validatedData = updateFacultySchema.parse(req.body);
    const updated = await FacultyService.update(id, validatedData);

    res.status(200).json({ message: "Faculty profile updated successfully", faculty: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update Faculty" });
  }
};

export const deleteFaculty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({ message: "Only Admin can delete Faculty profiles" });
      return;
    }

    const id = getParamId(req.params.id);
    await FacultyService.delete(id);

    res.status(200).json({ message: "Faculty profile deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete Faculty" });
  }
};

export const getFacultyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const faculty = await FacultyService.getById(id);

    res.status(200).json({ faculty });
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Faculty not found" });
  }
};

export const listFaculty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, departmentId, page, limit } = req.query;
    const result = await FacultyService.list({
      search: search as string | undefined,
      departmentId: departmentId as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to list Faculty" });
  }
};
