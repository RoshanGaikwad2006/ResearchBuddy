import { prisma } from "../config/db.js";
import type { CreateFacultyDTO, UpdateFacultyDTO } from "../validation/faculty.validation.js";
import bcrypt from "bcryptjs";

export class FacultyService {
  static async create(data: CreateFacultyDTO) {
    let resolvedUserId = data.userId;

    // Check if user exists by ID or Email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ id: data.userId }, { email: data.userId }],
      },
    });

    // If user does not exist, auto-create a Faculty User account
    if (!user) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const email = data.userId.includes("@") ? data.userId : `faculty.${data.employeeId.toLowerCase()}@university.edu`;

      user = await prisma.user.create({
        data: {
          name: `Faculty (${data.employeeId})`,
          email: email,
          password: hashedPassword,
          role: "FACULTY",
        },
      });
    }

    resolvedUserId = user.id;

    const existingFaculty = await prisma.faculty.findFirst({
      where: {
        OR: [{ userId: resolvedUserId }, { employeeId: data.employeeId }],
      },
    });

    if (existingFaculty) {
      throw new Error(`Faculty profile for '${user.email}' or Employee ID '${data.employeeId}' already exists`);
    }

    return prisma.faculty.create({
      data: {
        userId: resolvedUserId,
        employeeId: data.employeeId,
        designation: data.designation,
        departmentId: data.departmentId,
        orcid: data.orcid || null,
        scholarUrl: data.scholarUrl || null,
        researchInterests: data.researchInterests || [],
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
      },
    });
  }

  static async update(id: string, data: UpdateFacultyDTO) {
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      throw new Error("Faculty profile not found");
    }

    return prisma.faculty.update({
      where: { id },
      data: {
        ...data,
        orcid: data.orcid === "" ? null : data.orcid,
        scholarUrl: data.scholarUrl === "" ? null : data.scholarUrl,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
      },
    });
  }

  static async delete(id: string) {
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      throw new Error("Faculty profile not found");
    }
    return prisma.faculty.delete({ where: { id } });
  }

  static async getById(id: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
        researchAuthorships: {
          include: {
            research: {
              include: {
                authors: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!faculty) {
      throw new Error("Faculty profile not found");
    }

    // Fetch all research created by or co-authored by this faculty
    const createdResearch = await prisma.research.findMany({
      where: {
        OR: [
          { createdById: faculty.userId },
          { authors: { some: { facultyId: faculty.id } } },
        ],
      },
      include: {
        authors: true,
        department: true,
      },
      orderBy: { citationCount: "desc" },
    });

    const map = new Map<string, any>();
    for (const r of createdResearch) {
      map.set(r.id, r);
    }
    for (const ra of faculty.researchAuthorships || []) {
      if (ra.research) {
        map.set(ra.research.id, ra.research);
      }
    }

    const allPublications = Array.from(map.values()).sort((a, b) => b.citationCount - a.citationCount);

    return {
      ...faculty,
      publications: allPublications,
    };
  }

  static async getByUserId(userId: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        department: true,
        researchAuthorships: {
          include: {
            research: {
              include: {
                authors: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!faculty) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && (user.role === "FACULTY" || user.role === "ADMIN")) {
        let dept = await prisma.department.findFirst();
        if (!dept) {
          dept = await prisma.department.create({
            data: { code: "CSE", name: "Computer Science & Engineering" },
          });
        }

        const newFaculty = await prisma.faculty.create({
          data: {
            userId: user.id,
            employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            designation: "Faculty Member",
            departmentId: dept.id,
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
            department: true,
            researchAuthorships: { include: { research: true } },
          },
        });
        return newFaculty;
      }
      throw new Error("Faculty profile not found for current user");
    }

    return faculty;
  }

  static async list(params: {
    search?: string;
    departmentId?: string;
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

    if (params.search) {
      where.OR = [
        { employeeId: { contains: params.search, mode: "insensitive" } },
        { designation: { contains: params.search, mode: "insensitive" } },
        { researchInterests: { hasSome: [params.search] } },
        { user: { name: { contains: params.search, mode: "insensitive" } } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          department: true,
        },
      }),
      prisma.faculty.count({ where }),
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
