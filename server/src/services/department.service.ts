import { prisma } from "../config/db.js";
import type { CreateDepartmentDTO, UpdateDepartmentDTO } from "../validation/department.validation.js";

export class DepartmentService {
  static async create(data: CreateDepartmentDTO) {
    const existing = await prisma.department.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error(`Department code '${data.code}' already exists`);
    }

    return prisma.department.create({
      data: {
        code: data.code,
        name: data.name,
        headId: data.headId || null,
      },
      include: {
        head: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
  }

  static async update(id: string, data: UpdateDepartmentDTO) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new Error("Department not found");
    }

    return prisma.department.update({
      where: { id },
      data,
      include: {
        head: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
  }

  static async delete(id: string) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new Error("Department not found");
    }
    return prisma.department.delete({ where: { id } });
  }

  static async getById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        faculties: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        students: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            faculties: true,
            students: true,
            researches: true,
          },
        },
      },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    return department;
  }

  static async list() {
    return prisma.department.findMany({
      orderBy: { code: "asc" },
      include: {
        head: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        _count: {
          select: {
            faculties: true,
            students: true,
            researches: true,
          },
        },
      },
    });
  }
}
