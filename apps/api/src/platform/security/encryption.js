import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export function createEncryptionService({ key, keyVersion = 'v1' }) {
  const material = Buffer.from(key ?? '', 'base64');
  if (material.length !== 32) throw new Error('ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  return Object.freeze({
    encrypt(plaintext) {
      const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', material, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), keyVersion };
    },
    decrypt({ ciphertext, iv, authTag }) {
      const decipher = createDecipheriv('aes-256-gcm', material, Buffer.from(iv, 'base64'));
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
    }
  });
}
