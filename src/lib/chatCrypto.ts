import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALG = 'aes-256-gcm';

function getKey() {
  const raw = process.env.CHAT_SECRET_KEY || 'dev-chat-secret-key';
  // Chuẩn hóa thành 32 bytes
  return createHash('sha256').update(raw).digest();
}

export function encryptText(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12); // GCM IV 12 bytes
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Lưu iv + tag + data trong một chuỗi base64
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptText(cipherText: string | null | undefined): string {
  if (!cipherText) return '';
  try {
    const buf = Buffer.from(cipherText, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const key = getKey();
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return '';
  }
}
