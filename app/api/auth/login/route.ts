import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = (body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 },
            );
        }

        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const user = await db.collection("users").findOne({ email, password });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 },
            );
        }

        const cookieStore = await cookies();
        cookieStore.set(
            "blog-auth",
            JSON.stringify({
                email: user.email,
                id: user._id.toString(),
                name: user.displayName || user.email,
                displayName: user.displayName || user.email,
                username: user.username || user.displayName || user.email,
            }),
            {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
                secure: process.env.NODE_ENV === "production",
            },
        );

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
