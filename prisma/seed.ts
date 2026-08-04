// Local dev convenience: `npm run db:seed`. See lib/demo-seed.ts for what
// actually gets inserted (shared with the production /api/admin/seed-demo
// endpoint).
import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../lib/demo-seed";

const prisma = new PrismaClient();

seedDemoData(prisma)
  .then(() => console.log("Seed complete."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
