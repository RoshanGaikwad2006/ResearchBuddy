import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";

async function main() {
  const email = "priya.rakibe@kkwagh.edu.in";
  const rawPassword = "password123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
    include: { facultyProfile: true },
  });

  console.log("\n==========================================");
  console.log("PRIYA RAKIBE PASSWORD UPDATED SUCCESSFULLY:");
  console.log(`Email:       ${updatedUser.email}`);
  console.log(`New Password:${rawPassword}`);
  console.log(`Name:        ${updatedUser.name}`);
  console.log(`Role:        ${updatedUser.role}`);
  console.log("==========================================\n");
}

main()
  .catch((err) => {
    console.error("Error updating password:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
