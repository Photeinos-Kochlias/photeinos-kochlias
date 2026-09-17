import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const PASSWORD_PREFIX = "scrypt";

function deriveKey(password: string, salt: string, length: number) {
    return new Promise<Buffer>((resolve, reject) => {
        scryptCallback(password, salt, length, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
            if (error) reject(error);
            else resolve(derivedKey as Buffer);
        });
    });
}

export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("base64url");
    const derivedKey = await deriveKey(password, salt, 64);
    return `${PASSWORD_PREFIX}$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: unknown) {
    if (typeof stored !== "string") return false;
    const [prefix, salt, encodedHash] = stored.split("$");
    if (prefix !== PASSWORD_PREFIX || !salt || !encodedHash) return false;

    try {
        const expected = Buffer.from(encodedHash, "base64url");
        const actual = await deriveKey(password, salt, expected.length);
        return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
        return false;
    }
}
