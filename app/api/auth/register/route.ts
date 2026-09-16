import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { createSessionToken, getSessionCookieOptions, hashPassword } from "@/lib/security";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const displayName = String(body.displayName || email || "User").trim();

        if (!email || !password || email.length > 254 || password.length < 8 || password.length > 128 || displayName.length > 80) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const users = db.collection("users");
        const existing = await users.findOne({ email });

        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const username = slugify(displayName || email);
        const passwordHash = await hashPassword(password);
        const result = await users.insertOne({
            email,
            password: passwordHash,
            displayName,
            username,
            createdAt: new Date().toISOString(),
        });

        await db.collection("profiles").updateOne(
            { userId: result.insertedId.toString() },
            {
                $setOnInsert: {
                    userId: result.insertedId.toString(),
                    username,
                    email,
                    displayName,
                    bio: "",
                    avatarUrl: "",
                    isPublic: true,
                    followers: [],
                    following: [],
                },
            },
            { upsert: true },
        );

        const cookieStore = await cookies();
        cookieStore.set("blog-auth", createSessionToken({
            email,
            id: result.insertedId.toString(),
            name: displayName,
            displayName,
            username,
        }), getSessionCookieOptions());

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }
}
