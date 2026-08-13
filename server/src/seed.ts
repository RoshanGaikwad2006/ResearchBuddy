import { prisma } from "./config/db.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding clean database accounts...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create CSE Department
  const cseDept = await prisma.department.upsert({
    where: { code: "CSE" },
    update: {},
    create: {
      code: "CSE",
      name: "Computer Science & Engineering",
    },
  });

  // 2. Create Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      name: "Platform Administrator",
      email: "admin@university.edu",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // 3. Create Research Cell Account
  const researchCellUser = await prisma.user.upsert({
    where: { email: "research.cell@university.edu" },
    update: { password: hashedPassword, role: "RESEARCH_CELL" },
    create: {
      name: "Research Cell Officer",
      email: "research.cell@university.edu",
      password: hashedPassword,
      role: "RESEARCH_CELL",
    },
  });

  // 4. Create Faculty Account & Profile for Kushal Birla
  const kushalUser = await prisma.user.upsert({
    where: { email: "kushalbirla2006@gmail.com" },
    update: { password: hashedPassword, role: "FACULTY" },
    create: {
      name: "Kushal Birla",
      email: "kushalbirla2006@gmail.com",
      password: hashedPassword,
      role: "FACULTY",
    },
  });

  const kushalProfile = await prisma.faculty.upsert({
    where: { employeeId: "EMP-CSE-2025" },
    update: {
      userId: kushalUser.id,
    },
    create: {
      userId: kushalUser.id,
      employeeId: "EMP-CSE-2025",
      designation: "Assistant Professor",
      departmentId: cseDept.id,
      researchInterests: ["Machine Learning", "Deep Learning", "Data Mining"],
    },
  });

  // 5. Create Faculty Account & Profile for Dr. Chaitali Patil
  const chaitaliUser = await prisma.user.upsert({
    where: { email: "chaitali.patil@university.edu" },
    update: { password: hashedPassword, role: "FACULTY" },
    create: {
      name: "Dr. Chaitali Patil",
      email: "chaitali.patil@university.edu",
      password: hashedPassword,
      role: "FACULTY",
    },
  });

  const chaitaliProfile = await prisma.faculty.upsert({
    where: { employeeId: "EMP-CSE-2026" },
    update: {
      userId: chaitaliUser.id,
    },
    create: {
      userId: chaitaliUser.id,
      employeeId: "EMP-CSE-2026",
      designation: "Associate Professor",
      departmentId: cseDept.id,
      researchInterests: ["Cloud Computing", "Cybersecurity", "Blockchain"],
    },
  });

  // 6. Create Faculty Account & Profile for Dr. Dhananjay Kanade
  const dhananjayUser = await prisma.user.upsert({
    where: { email: "dhananjay.kanade@university.edu" },
    update: { password: hashedPassword, role: "FACULTY" },
    create: {
      name: "Dr. Dhananjay Kanade",
      email: "dhananjay.kanade@university.edu",
      password: hashedPassword,
      role: "FACULTY",
    },
  });

  const dhananjayProfile = await prisma.faculty.upsert({
    where: { employeeId: "EMP-CSE-2027" },
    update: {
      userId: dhananjayUser.id,
    },
    create: {
      userId: dhananjayUser.id,
      employeeId: "EMP-CSE-2027",
      designation: "Professor",
      departmentId: cseDept.id,
      researchInterests: ["Distributed Systems", "Algorithms", "High Performance Computing"],
    },
  });

  // 7. Create Student Account & Profile
  const studentUser = await prisma.user.upsert({
    where: { email: "student@university.edu" },
    update: { password: hashedPassword, role: "STUDENT" },
    create: {
      name: "Rohan Sharma",
      email: "student@university.edu",
      password: hashedPassword,
      role: "STUDENT",
    },
  });

  await prisma.student.upsert({
    where: { rollNumber: "23CSE01" },
    update: {
      userId: studentUser.id,
      guideFacultyId: chaitaliProfile.id,
    },
    create: {
      userId: studentUser.id,
      rollNumber: "23CSE01",
      departmentId: cseDept.id,
      guideFacultyId: chaitaliProfile.id,
      academicYear: "2023-2027",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("Created Admin:", adminUser.email);
  console.log("Created Research Cell:", researchCellUser.email);
  console.log("Created Faculty (Kushal):", kushalUser.email);
  console.log("Created Faculty (Chaitali):", chaitaliUser.email);
  console.log("Created Faculty (Dhananjay):", dhananjayUser.email);
  console.log("Created Student:", studentUser.email);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
