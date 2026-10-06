import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Create the required Tenant
  const tenant = await prisma.tenants.create({
    data: {
      companyName: "Bruce Wayne Corp"
    }
  });
  console.log(`Created Tenant: ${tenant.companyName} (ID: ${tenant.tenantId})`);

  // 2. Create 12 varied Openings assigned to that Tenant
  const openings = await prisma.opening.createMany({
    data: [
      { tenantId: tenant.tenantId, title: "Senior Frontend Engineer", location: "Gotham", contractType: "Contract", hiringManagerId: "hm-1", experienceMin: 5, experienceMax: 8 },
      { tenantId: tenant.tenantId, title: "Backend Node.js Dev", location: "Remote", contractType: "Full-Time", hiringManagerId: "hm-1", experienceMin: 3, experienceMax: 6 },
      { tenantId: tenant.tenantId, title: "AI/ML Engineer", location: "Gotham", contractType: "Contract", hiringManagerId: "hm-2", experienceMin: 4, experienceMax: 7 },
      { tenantId: tenant.tenantId, title: "DevOps Specialist", location: "Remote", contractType: "Contract", hiringManagerId: "hm-2", experienceMin: 6, experienceMax: 10 },
      { tenantId: tenant.tenantId, title: "Data Scientist", location: "Gotham", contractType: "Full-Time", hiringManagerId: "hm-1", experienceMin: 2, experienceMax: 5 },
      { tenantId: tenant.tenantId, title: "QA Automation Tester", location: "Remote", contractType: "Contract", hiringManagerId: "hm-3", experienceMin: 3, experienceMax: 5 },
      { tenantId: tenant.tenantId, title: "Cloud Architect", location: "Gotham", contractType: "Full-Time", hiringManagerId: "hm-3", experienceMin: 8, experienceMax: 12 },
      { tenantId: tenant.tenantId, title: "UI/UX Designer", location: "Remote", contractType: "Contract", hiringManagerId: "hm-1", experienceMin: 2, experienceMax: 4 },
      { tenantId: tenant.tenantId, title: "Database Admin", location: "Gotham", contractType: "Full-Time", hiringManagerId: "hm-2", experienceMin: 5, experienceMax: 9 },
      { tenantId: tenant.tenantId, title: "Security Analyst", location: "Remote", contractType: "Contract", hiringManagerId: "hm-3", experienceMin: 4, experienceMax: 7 },
      { tenantId: tenant.tenantId, title: "Scrum Master", location: "Gotham", contractType: "Full-Time", hiringManagerId: "hm-1", experienceMin: 3, experienceMax: 6 },
      { tenantId: tenant.tenantId, title: "Product Manager", location: "Remote", contractType: "Contract", hiringManagerId: "hm-2", experienceMin: 5, experienceMax: 10 }
    ]
  });

  console.log(`Successfully seeded ${openings.count} openings!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });