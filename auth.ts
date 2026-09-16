import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/security";

export async function auth() {
    const cookieStore = await cookies();
    const value = cookieStore.get(SESSION_COOKIE)?.value;

    if (!value) {
        return null;
    }

    try {
        const user = verifySessionToken(value);
        if (!user) {
            return null;
        }

        return { user };
    } catch {
        return null;
    }
}
