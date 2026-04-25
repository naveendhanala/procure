import { PrismaClient, Role, UnitOfMeasure } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL },
  },
});

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  // Create Sites
  const site1 = await prisma.site.upsert({
    where: { code: "MUM-01" },
    update: {},
    create: {
      name: "Mumbai Site 1",
      code: "MUM-01",
      address: "Plot 42, MIDC Industrial Area",
      city: "Mumbai",
      state: "Maharashtra",
    },
  });

  const site2 = await prisma.site.upsert({
    where: { code: "DEL-01" },
    update: {},
    create: {
      name: "Delhi Site 1",
      code: "DEL-01",
      address: "Sector 62, Noida",
      city: "Delhi NCR",
      state: "Delhi",
    },
  });

  const site3 = await prisma.site.upsert({
    where: { code: "BLR-01" },
    update: {},
    create: {
      name: "Bangalore Site 1",
      code: "BLR-01",
      address: "Electronic City Phase 2",
      city: "Bangalore",
      state: "Karnataka",
    },
  });

  // Workflow: Mumbai has Cluster Head + VP
  await prisma.approvalWorkflowStep.upsert({
    where: { siteId_stepOrder: { siteId: site1.id, stepOrder: 1 } },
    update: {},
    create: { siteId: site1.id, stepOrder: 1, role: "CLUSTER_HEAD" },
  });
  await prisma.approvalWorkflowStep.upsert({
    where: { siteId_stepOrder: { siteId: site1.id, stepOrder: 2 } },
    update: {},
    create: { siteId: site1.id, stepOrder: 2, role: "VICE_PRESIDENT" },
  });

  // Workflow: Delhi has VP only (no Cluster Head)
  await prisma.approvalWorkflowStep.upsert({
    where: { siteId_stepOrder: { siteId: site2.id, stepOrder: 1 } },
    update: {},
    create: { siteId: site2.id, stepOrder: 1, role: "VICE_PRESIDENT" },
  });

  // Workflow: Bangalore has Cluster Head + VP
  await prisma.approvalWorkflowStep.upsert({
    where: { siteId_stepOrder: { siteId: site3.id, stepOrder: 1 } },
    update: {},
    create: { siteId: site3.id, stepOrder: 1, role: "CLUSTER_HEAD" },
  });
  await prisma.approvalWorkflowStep.upsert({
    where: { siteId_stepOrder: { siteId: site3.id, stepOrder: 2 } },
    update: {},
    create: { siteId: site3.id, stepOrder: 2, role: "VICE_PRESIDENT" },
  });

  // Create Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@procure.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@procure.com",
      hashedPassword: password,
      phone: "+91-9999999999",
    },
  });

  const pmMumbai = await prisma.user.upsert({
    where: { email: "pm.mumbai@procure.com" },
    update: {},
    create: {
      name: "Rajesh Kumar",
      email: "pm.mumbai@procure.com",
      hashedPassword: password,
      phone: "+91-9876543210",
    },
  });

  const pmDelhi = await prisma.user.upsert({
    where: { email: "pm.delhi@procure.com" },
    update: {},
    create: {
      name: "Suresh Sharma",
      email: "pm.delhi@procure.com",
      hashedPassword: password,
      phone: "+91-9876543211",
    },
  });

  const chMumbai = await prisma.user.upsert({
    where: { email: "ch.mumbai@procure.com" },
    update: {},
    create: {
      name: "Priya Patel",
      email: "ch.mumbai@procure.com",
      hashedPassword: password,
      phone: "+91-9876543212",
    },
  });

  const vp = await prisma.user.upsert({
    where: { email: "vp@procure.com" },
    update: {},
    create: {
      name: "Anil Mehta",
      email: "vp@procure.com",
      hashedPassword: password,
      phone: "+91-9876543213",
    },
  });

  const hop = await prisma.user.upsert({
    where: { email: "hop@procure.com" },
    update: {},
    create: {
      name: "Meera Singh",
      email: "hop@procure.com",
      hashedPassword: password,
      phone: "+91-9876543214",
    },
  });

  const ptm1 = await prisma.user.upsert({
    where: { email: "buyer1@procure.com" },
    update: {},
    create: {
      name: "Amit Desai",
      email: "buyer1@procure.com",
      hashedPassword: password,
      phone: "+91-9876543215",
    },
  });

  const ptm2 = await prisma.user.upsert({
    where: { email: "buyer2@procure.com" },
    update: {},
    create: {
      name: "Sneha Reddy",
      email: "buyer2@procure.com",
      hashedPassword: password,
      phone: "+91-9876543216",
    },
  });

  const smMumbai = await prisma.user.upsert({
    where: { email: "store.mumbai@procure.com" },
    update: {},
    create: {
      name: "Ramesh Iyer",
      email: "store.mumbai@procure.com",
      hashedPassword: password,
      phone: "+91-9876543217",
    },
  });

  const smDelhi = await prisma.user.upsert({
    where: { email: "store.delhi@procure.com" },
    update: {},
    create: {
      name: "Vikram Tiwari",
      email: "store.delhi@procure.com",
      hashedPassword: password,
      phone: "+91-9876543218",
    },
  });

  // Site Assignments
  const assignments: { userId: string; siteId: string; role: Role }[] = [
    { userId: admin.id, siteId: site1.id, role: "SUPER_ADMIN" },
    { userId: admin.id, siteId: site2.id, role: "SUPER_ADMIN" },
    { userId: admin.id, siteId: site3.id, role: "SUPER_ADMIN" },
    { userId: pmMumbai.id, siteId: site1.id, role: "PROJECT_MANAGER" },
    { userId: pmDelhi.id, siteId: site2.id, role: "PROJECT_MANAGER" },
    { userId: chMumbai.id, siteId: site1.id, role: "CLUSTER_HEAD" },
    { userId: chMumbai.id, siteId: site3.id, role: "CLUSTER_HEAD" },
    { userId: vp.id, siteId: site1.id, role: "VICE_PRESIDENT" },
    { userId: vp.id, siteId: site2.id, role: "VICE_PRESIDENT" },
    { userId: vp.id, siteId: site3.id, role: "VICE_PRESIDENT" },
    { userId: hop.id, siteId: site1.id, role: "HEAD_OF_PROCUREMENT" },
    { userId: hop.id, siteId: site2.id, role: "HEAD_OF_PROCUREMENT" },
    { userId: hop.id, siteId: site3.id, role: "HEAD_OF_PROCUREMENT" },
    { userId: ptm1.id, siteId: site1.id, role: "PROCUREMENT_TEAM_MEMBER" },
    { userId: ptm1.id, siteId: site2.id, role: "PROCUREMENT_TEAM_MEMBER" },
    { userId: ptm2.id, siteId: site1.id, role: "PROCUREMENT_TEAM_MEMBER" },
    { userId: ptm2.id, siteId: site3.id, role: "PROCUREMENT_TEAM_MEMBER" },
    { userId: smMumbai.id, siteId: site1.id, role: "STORE_MANAGER" },
    { userId: smDelhi.id, siteId: site2.id, role: "STORE_MANAGER" },
  ];

  for (const a of assignments) {
    await prisma.userSiteAssignment.upsert({
      where: {
        userId_siteId_role: { userId: a.userId, siteId: a.siteId, role: a.role },
      },
      update: {},
      create: a,
    });
  }

  // Materials
  const materials: {
    name: string;
    code: string;
    category: string;
    unit: UnitOfMeasure;
    hsnCode?: string;
  }[] = [
    { name: "OPC Cement 53 Grade", code: "MAT-CEM-001", category: "Cement", unit: "BAGS", hsnCode: "2523" },
    { name: "PPC Cement", code: "MAT-CEM-002", category: "Cement", unit: "BAGS", hsnCode: "2523" },
    { name: "TMT Steel Bar 8mm", code: "MAT-STL-001", category: "Steel", unit: "TONNES", hsnCode: "7214" },
    { name: "TMT Steel Bar 12mm", code: "MAT-STL-002", category: "Steel", unit: "TONNES", hsnCode: "7214" },
    { name: "TMT Steel Bar 16mm", code: "MAT-STL-003", category: "Steel", unit: "TONNES", hsnCode: "7214" },
    { name: "River Sand", code: "MAT-SND-001", category: "Sand & Aggregate", unit: "CU_METERS" },
    { name: "M-Sand", code: "MAT-SND-002", category: "Sand & Aggregate", unit: "CU_METERS" },
    { name: "20mm Aggregate", code: "MAT-AGG-001", category: "Sand & Aggregate", unit: "CU_METERS" },
    { name: "Red Bricks (First Class)", code: "MAT-BRK-001", category: "Bricks & Blocks", unit: "NOS" },
    { name: "AAC Blocks 600x200x200", code: "MAT-BRK-002", category: "Bricks & Blocks", unit: "NOS" },
    { name: "Plywood 18mm (Commercial)", code: "MAT-PLY-001", category: "Plywood", unit: "SHEETS", hsnCode: "4412" },
    { name: "Plywood 12mm (BWR)", code: "MAT-PLY-002", category: "Plywood", unit: "SHEETS", hsnCode: "4412" },
    { name: "Electrical Cable 2.5 sqmm", code: "MAT-ELC-001", category: "Electrical", unit: "METERS", hsnCode: "8544" },
    { name: "Electrical Cable 4 sqmm", code: "MAT-ELC-002", category: "Electrical", unit: "METERS", hsnCode: "8544" },
    { name: "PVC Pipe 4 inch", code: "MAT-PIP-001", category: "Plumbing", unit: "METERS", hsnCode: "3917" },
    { name: "CPVC Pipe 1 inch", code: "MAT-PIP-002", category: "Plumbing", unit: "METERS", hsnCode: "3917" },
    { name: "Wall Putty (White Cement)", code: "MAT-FIN-001", category: "Finishing", unit: "BAGS" },
    { name: "Primer Paint (Interior)", code: "MAT-FIN-002", category: "Finishing", unit: "LITERS" },
    { name: "Emulsion Paint (Interior)", code: "MAT-FIN-003", category: "Finishing", unit: "LITERS" },
    { name: "Ceramic Floor Tiles 600x600", code: "MAT-TIL-001", category: "Tiles", unit: "SQ_METERS", hsnCode: "6908" },
  ];

  for (const mat of materials) {
    await prisma.material.upsert({
      where: { code: mat.code },
      update: {},
      create: {
        name: mat.name,
        code: mat.code,
        category: mat.category,
        unit: mat.unit,
        hsnCode: mat.hsnCode,
      },
    });
  }

  // Seed some inventory for Mumbai Site
  const allMaterials = await prisma.material.findMany();
  const inventoryData = [
    { code: "MAT-CEM-001", qty: 500 },
    { code: "MAT-CEM-002", qty: 200 },
    { code: "MAT-STL-001", qty: 25 },
    { code: "MAT-STL-002", qty: 40 },
    { code: "MAT-SND-001", qty: 100 },
    { code: "MAT-BRK-001", qty: 10000 },
    { code: "MAT-ELC-001", qty: 2000 },
    { code: "MAT-PIP-001", qty: 500 },
  ];

  for (const inv of inventoryData) {
    const mat = allMaterials.find((m) => m.code === inv.code);
    if (mat) {
      await prisma.inventory.upsert({
        where: {
          siteId_materialId: { siteId: site1.id, materialId: mat.id },
        },
        update: { quantity: inv.qty },
        create: {
          siteId: site1.id,
          materialId: mat.id,
          quantity: inv.qty,
        },
      });
    }
  }

  // Vendors
  const vendors = [
    {
      name: "UltraTech Cement Ltd",
      code: "VEN-001",
      contactPerson: "Sanjay Gupta",
      email: "sales@ultratech.com",
      phone: "+91-2222222222",
      city: "Mumbai",
      state: "Maharashtra",
      gstNumber: "27AABCU1234A1ZV",
      categories: ["Cement"],
    },
    {
      name: "Tata Steel Dealers",
      code: "VEN-002",
      contactPerson: "Vikash Jain",
      email: "orders@tatasteel-dealer.com",
      phone: "+91-3333333333",
      city: "Jamshedpur",
      state: "Jharkhand",
      gstNumber: "20AABCT5678B1ZW",
      categories: ["Steel"],
    },
    {
      name: "BuildMart Supplies",
      code: "VEN-003",
      contactPerson: "Arun Nair",
      email: "info@buildmart.com",
      phone: "+91-4444444444",
      city: "Bangalore",
      state: "Karnataka",
      gstNumber: "29AABCB9012C1ZX",
      categories: ["Sand & Aggregate", "Bricks & Blocks"],
    },
    {
      name: "Havells India Ltd",
      code: "VEN-004",
      contactPerson: "Deepa Malhotra",
      email: "b2b@havells.com",
      phone: "+91-5555555555",
      city: "Delhi",
      state: "Delhi",
      gstNumber: "07AABCH3456D1ZY",
      categories: ["Electrical"],
    },
    {
      name: "Supreme Industries",
      code: "VEN-005",
      contactPerson: "Rohit Khanna",
      email: "sales@supreme.com",
      phone: "+91-6666666666",
      city: "Mumbai",
      state: "Maharashtra",
      gstNumber: "27AABCS7890E1ZZ",
      categories: ["Plumbing"],
    },
  ];

  for (const v of vendors) {
    const vendor = await prisma.vendor.upsert({
      where: { code: v.code },
      update: {},
      create: {
        name: v.name,
        code: v.code,
        contactPerson: v.contactPerson,
        email: v.email,
        phone: v.phone,
        city: v.city,
        state: v.state,
        gstNumber: v.gstNumber,
      },
    });

    for (const cat of v.categories) {
      await prisma.vendorCategory.upsert({
        where: {
          vendorId_category: { vendorId: vendor.id, category: cat },
        },
        update: {},
        create: { vendorId: vendor.id, category: cat },
      });
    }
  }

  console.log("Seed completed successfully!");
  console.log("\nTest accounts (all use password: password123):");
  console.log("  Admin:       admin@procure.com");
  console.log("  PM Mumbai:   pm.mumbai@procure.com");
  console.log("  PM Delhi:    pm.delhi@procure.com");
  console.log("  CH Mumbai:   ch.mumbai@procure.com");
  console.log("  VP:          vp@procure.com");
  console.log("  HoP:         hop@procure.com");
  console.log("  Buyer 1:     buyer1@procure.com");
  console.log("  Buyer 2:     buyer2@procure.com");
  console.log("  Store Mum:   store.mumbai@procure.com");
  console.log("  Store Del:   store.delhi@procure.com");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
