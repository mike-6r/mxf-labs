import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");

  return bits
    .match(/.{1,5}/g)
    ?.map((chunk) => alphabet[parseInt(chunk.padEnd(5, "0"), 2)])
    .join("") || "";
}

function base32Decode(value: string) {
  const clean = value.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";

  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = bits.match(/.{8}/g)?.map((byte) => parseInt(byte, 2)) || [];
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number, digits = 6) {
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** digits).padStart(digits, "0");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

export function currentTotpStep(period = 30) {
  return Math.floor(Date.now() / 1000 / period);
}

export function verifyTotpCode({
  secret,
  code,
  window = 1,
  period = 30,
}: {
  secret: string;
  code: string;
  window?: number;
  period?: number;
}) {
  const cleanCode = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanCode)) return null;

  const current = currentTotpStep(period);
  for (let offset = -window; offset <= window; offset += 1) {
    const step = current + offset;
    if (safeEqual(hotp(secret, step), cleanCode)) {
      return { step };
    }
  }

  return null;
}

export function createOtpAuthUri({
  secret,
  account,
  issuer = "MxF Labs",
}: {
  secret: string;
  account: string;
  issuer?: string;
}) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}
