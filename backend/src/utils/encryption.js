const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

function getKey() {
  const key = (process.env.ENCRYPTION_KEY || "").trim();
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 characters");
  }
  return Buffer.from(key, "utf8");
}

function encrypt(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return { content: encrypted.toString("hex"), iv: iv.toString("hex") };
}

function decrypt(contentHex, ivHex) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(contentHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };
