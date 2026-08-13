import { prisma } from "./config/db.js";

export const CANONICAL_DEPARTMENTS = [
  { code: "CE", name: "Computer Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "AI&DS", name: "Artificial Intelligence and Data Science" },
  { code: "E&TC", name: "Electronics and Telecommunication Engineering" },
];

export async function seedCanonicalDepartments() {
  console.log("=================================================");
  console.log("🏫 SEEDING CANONICAL DEPARTMENTS & FACULTY UPDATE");
  console.log("=================================================\n");

  const deptMap = new Map<string, string>();

  for (const d of CANONICAL_DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: { code: d.code, name: d.name },
    });
    deptMap.set(d.code, dept.id);
    console.log(`   ✓ Department Ready: ${dept.code} — "${dept.name}" (ID: ${dept.id})`);
  }

  const compEngDeptId = deptMap.get("CE");
  if (!compEngDeptId) throw new Error("Computer Engineering department failed to initialize.");

  // Update ALL existing faculty records in database to point to Computer Engineering (CE)
  const updateRes = await prisma.faculty.updateMany({
    data: { departmentId: compEngDeptId },
  });

  console.log(`\n✅ Updated ${updateRes.count} existing faculty records in DB to "Computer Engineering" (CE).`);
}

if (process.argv[1]?.includes("seed_canonical_departments")) {
  seedCanonicalDepartments()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
