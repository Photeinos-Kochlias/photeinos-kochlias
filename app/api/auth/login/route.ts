import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { createSessionToken, getSessionCookieOptions, hashPassword, verifyPassword } from "@/lib/security";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password || email.length > 254 || password.length > 128) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 },
            );
        }

        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const user = await db.collection("users").findOne({ email });

        const isValidPassword = user
            ? await verifyPassword(password, user.password)
            : false;
        const isLegacyPassword =
            user &&
            typeof user.password === "string" &&
            !user.password.startsWith("scrypt$") &&
            user.password === password;

        if (!user || (!isValidPassword && !isLegacyPassword)) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 },
            );
        }

        if (isLegacyPassword) {
            await db.collection("users").updateOne(
                { _id: user._id },
                { $set: { password: await hashPassword(password) } },
            );
        }

        const cookieStore = await cookies();
        cookieStore.set("blog-auth", createSessionToken({
                email: user.email,
                id: user._id.toString(),
                name: user.displayName || user.email,
                displayName: user.displayName || user.email,
                username: user.username || user.displayName || user.email,
            }), getSessionCookieOptions());

        return NextResponse.json({
            ok: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
                username: user.username,
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
