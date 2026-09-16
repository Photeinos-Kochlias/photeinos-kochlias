import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "blog-auth";
const PASSWORD_PREFIX = "scrypt";
const MAX_PASSWORD_LENGTH = 128;

function deriveKey(password: string, salt: string, length: number) {
    return new Promise<Buffer>((resolve, reject) => {
        scryptCallback(password, salt, length, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
            if (error) reject(error);
            else resolve(derivedKey as Buffer);
        });
    });
}

export type SessionUser = {
    id: string;
    email: string;
    name: string;
    displayName: string;
    username: string;
};

function getSessionSecret() {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET must be configured with at least 32 characters");
    }
    return secret;
}

function encode(value: string) {
    return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string) {
    return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
    const payload = encode(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
    return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): SessionUser | null {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    try {
        const expected = sign(payload);
        const actualBuffer = Buffer.from(signature, "base64url");
        const expectedBuffer = Buffer.from(expected, "base64url");
        if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
            return null;
        }

        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SessionUser> & { exp?: number };
        if (!parsed.exp || parsed.exp < Date.now() || !parsed.id || !parsed.email) return null;
        return {
            id: parsed.id,
            email: parsed.email,
            name: parsed.name || parsed.displayName || parsed.email,
            displayName: parsed.displayName || parsed.name || parsed.email,
            username: parsed.username || parsed.displayName || parsed.email,
        };
    } catch {
        return null;
    }
}

export async function hashPassword(password: string) {
    if (password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
        throw new Error("Password must be between 8 and 128 characters");
    }
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

export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === "production",
    } as const;
}

export { MAX_PASSWORD_LENGTH, SESSION_COOKIE };
