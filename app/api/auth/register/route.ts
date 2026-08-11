import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

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
        const email = (body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const displayName = (body.displayName || email || "User").trim();

        if (!email || !password) {
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
        const result = await users.insertOne({
            email,
            password,
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
        cookieStore.set("blog-auth", JSON.stringify({
            email,
            id: result.insertedId.toString(),
            name: displayName,
            displayName,
            username,
        }), {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            secure: process.env.NODE_ENV === "production",
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }
}
