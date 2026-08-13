import { prisma } from "../config/db.js";
import type { CreateStudentDTO, UpdateStudentDTO } from "../validation/student.validation.js";

export class StudentService {
  static async create(data: CreateStudentDTO) {
    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ userId: data.userId }, { rollNumber: data.rollNumber }],
      },
    });

    if (existing) {
      throw new Error("Student profile or Roll Number already exists");
    }

    return prisma.student.create({
      data: {
        userId: data.userId,
        rollNumber: data.rollNumber,
        departmentId: data.departmentId,
        guideFacultyId: data.guideFacultyId || null,
        academicYear: data.academicYear,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
        guideFaculty: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  static async update(id: string, data: UpdateStudentDTO) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new Error("Student profile not found");
    }

    return prisma.student.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
        guideFaculty: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  static async delete(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new Error("Student profile not found");
    }
    return prisma.student.delete({ where: { id } });
  }

  static async getById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
        guideFaculty: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        researchAuthorships: {
          include: {
            research: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Student profile not found");
    }

    return student;
  }

  static async getByUserId(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
        guideFaculty: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        researchAuthorships: {
          include: {
            research: true,
          },
        },
      },
    });

    if (!student) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === "STUDENT") {
        let dept = await prisma.department.findFirst();
        if (!dept) {
          dept = await prisma.department.create({
            data: { code: "CSE", name: "Computer Science & Engineering" },
          });
        }

        const newStudent = await prisma.student.create({
          data: {
            userId: user.id,
            rollNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            departmentId: dept.id,
            academicYear: "2023-2027",
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
            department: true,
            guideFaculty: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
            researchAuthorships: { include: { research: true } },
          },
        });
        return newStudent;
      }
      throw new Error("Student profile not found for current user");
    }

    return student;
  }

  static async list(params: {
    search?: string;
    departmentId?: string;
    guideFacultyId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    if (params.guideFacultyId) {
      where.guideFacultyId = params.guideFacultyId;
    }

    if (params.search) {
      where.OR = [
        { rollNumber: { contains: params.search, mode: "insensitive" } },
        { academicYear: { contains: params.search, mode: "insensitive" } },
        { user: { name: { contains: params.search, mode: "insensitive" } } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          department: true,
          guideFaculty: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
