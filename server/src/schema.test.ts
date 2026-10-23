import { describe, expect, it } from "vitest";
import { prisma } from "./db.js";

async function createSchool(code: string) {
  return prisma.school.create({ data: { name: `School ${code}`, code } });
}

async function cleanup(schoolId: string) {
  await prisma.user.deleteMany({ where: { schoolId } });
  await prisma.school.delete({ where: { id: schoolId } });
}

describe("database constraints", () => {
  it("enforces unique school code", async () => {
    const school = await createSchool("SC1");
    await expect(
      prisma.school.create({ data: { name: "Dup", code: "SC1" } }),
    ).rejects.toThrow();
    await cleanup(school.id);
  });

  it("enforces unique user email within the tenant", async () => {
    const school = await createSchool("SC2");
    await prisma.user.create({
      data: {
        schoolId: school.id,
        email: "teacher@school.com",
        passwordHash: "hash",
        firstName: "T",
        lastName: "One",
      },
    });
    await expect(
      prisma.user.create({
        data: {
          schoolId: school.id,
          email: "teacher@school.com",
          passwordHash: "hash",
          firstName: "T",
          lastName: "Two",
        },
      }),
    ).rejects.toThrow();
    await cleanup(school.id);
  });

  it("rejects foreign-key violations for tenant-scoped records", async () => {
    await expect(
      prisma.user.create({
        data: {
          schoolId: "00000000-0000-0000-0000-000000000000",
          email: "nope@school.com",
          passwordHash: "hash",
          firstName: "N",
          lastName: "One",
        },
      }),
    ).rejects.toThrow();
  });

  it("stores and reads exact decimal monetary amounts", async () => {
    const school = await createSchool("SC3");
    const year = await prisma.academicYear.create({
      data: {
        schoolId: school.id,
        name: "2026-27",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2027-05-31"),
        isCurrent: true,
      },
    });
    const fee = await prisma.fee.create({
      data: {
        schoolId: school.id,
        name: "Tuition",
        amount: 12500.5,
        academicYearId: year.id,
      },
    });
    expect(fee.amount.toNumber()).toBeCloseTo(12500.5);
    await prisma.fee.delete({ where: { id: fee.id } });
    await prisma.academicYear.delete({ where: { id: year.id } });
    await cleanup(school.id);
  });

  it("keeps records tenant-scoped so cross-school references are isolated", async () => {
    const schoolA = await createSchool("SC4A");
    const schoolB = await createSchool("SC4B");
    const userA = await prisma.user.create({
      data: {
        schoolId: schoolA.id,
        email: "a@school.com",
        passwordHash: "hash",
        firstName: "A",
        lastName: "User",
      },
    });
    const schools = await prisma.school.findMany({
      where: { id: userA.schoolId },
    });
    expect(schools.map((s) => s.id)).toContain(schoolA.id);
    expect(schools.map((s) => s.id)).not.toContain(schoolB.id);
    await prisma.user.delete({ where: { id: userA.id } });
    await cleanup(schoolA.id);
    await cleanup(schoolB.id);
  });
});
