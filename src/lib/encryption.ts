import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "zaproshenya_super_secret_autopost_key_2026";
  // Derive a 32-byte key using SHA-256 to support any secret length safely
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plain-text string using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Return formatted string iv:encryptedText:authTag
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      // If it doesn't match format, return as-is (useful for migrators or unencrypted fallbacks)
      return encryptedText;
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], "hex");
    
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
