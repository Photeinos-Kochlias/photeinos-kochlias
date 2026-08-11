import { cookies } from "next/headers";

export async function auth() {
    const cookieStore = await cookies();
    const value = cookieStore.get("blog-auth")?.value;

    if (!value) {
        return null;
    }

    try {
        const parsed = JSON.parse(value) as {
            email?: string;
            id?: string;
            name?: string;
            displayName?: string;
            username?: string;
        };
        if (!parsed.email) {
            return null;
        }

        return {
            user: {
                email: parsed.email,
                id: parsed.id || parsed.email,
                name: parsed.name || parsed.displayName || parsed.email,
                displayName: parsed.displayName || parsed.name || parsed.email,
                username: parsed.username || parsed.displayName || parsed.email,
            },
        };
    } catch {
        return null;
    }
}
