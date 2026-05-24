const prisma = require("../lib/prisma");

function formatSchool(school) {
  return {
    id: school.id,
    name: school.name,
    location: school.location || "N/A",
    rooms: school.classrooms || 0,
    students: school.studentsCount,
    teachers: school.teachersCount,
    status: school.status,
    principalName: school.principalName || "",
    contactEmail: school.contactEmail || "",
    phone: school.phone || "",
    address: school.address || "",
    notes: school.notes || "",
    createdAt: school.createdAt,
  };
}

async function getSchools() {
  const schools = await prisma.school.findMany({ orderBy: { id: "asc" } });
  return schools.map(formatSchool);
}

async function getSchoolById(id) {
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) return null;
  return formatSchool(school);
}

async function createSchool(data) {
  const school = await prisma.school.create({
    data: {
      name: data.name,
      location: data.location || null,
      principalName: data.principalName || null,
      contactEmail: data.contactEmail || null,
      classrooms: data.classrooms || 0,
      teachersCount: data.teachers || 0,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });
  return formatSchool(school);
}

async function updateSchool(id, data) {
  const school = await prisma.school.update({
    where: { id },
    data: {
      name: data.name,
      location: data.location || null,
      principalName: data.principalName || null,
      contactEmail: data.contactEmail || null,
      classrooms: data.classrooms ?? undefined,
      teachersCount: data.teachers ?? undefined,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });
  return formatSchool(school);
}

module.exports = { getSchools, getSchoolById, createSchool, updateSchool };
