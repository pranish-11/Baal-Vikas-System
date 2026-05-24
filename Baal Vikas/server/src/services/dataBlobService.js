const prisma = require("../lib/prisma");

async function getBlob(key) {
  const blob = await prisma.dataBlob.findUnique({ where: { key } });
  return blob ? JSON.parse(blob.data) : null;
}

async function upsertBlob(key, data) {
  const json = JSON.stringify(data);
  const blob = await prisma.dataBlob.upsert({
    where: { key },
    create: { key, data: json },
    update: { data: json },
  });
  return { key: blob.key, data: JSON.parse(blob.data) };
}

async function deleteBlob(key) {
  try {
    await prisma.dataBlob.delete({ where: { key } });
    return { success: true };
  } catch {
    const err = new Error("Blob not found");
    err.statusCode = 404;
    throw err;
  }
}

async function listBlobs() {
  const blobs = await prisma.dataBlob.findMany({ select: { key: true, updatedAt: true } });
  return blobs.map(b => ({ key: b.key, updatedAt: b.updatedAt.toISOString() }));
}

module.exports = { getBlob, upsertBlob, deleteBlob, listBlobs };
