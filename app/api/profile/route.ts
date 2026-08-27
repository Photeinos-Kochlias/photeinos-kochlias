import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 },
            );
        }

        const profile = await db.collection("profiles").findOne({ userId });
        return NextResponse.json({
            ...(profile || {
                userId,
                displayName: "Anonymous",
                bio: "",
                avatarUrl: "",
                isPublic: true,
            }),
            username:
                profile?.username || slugify(profile?.displayName || userId),
            email: profile?.email || "",
            followers: profile?.followers || [],
            following: profile?.following || [],
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const session = await auth();
        const sessionEmail = session?.user?.email || "";
        const sessionUserId = session?.user?.id || "";
        const sessionDisplayName = session?.user?.displayName || session?.user?.name || "";
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        if (!sessionUserId || !sessionEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (body.email && sessionEmail && body.email !== sessionEmail) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const displayName = String(body.displayName || sessionDisplayName || sessionEmail || "User").trim();
        const username =
            body.username ||
            slugify(displayName || body.email || sessionEmail || sessionUserId || "user");

        const updatedProfile = {
            userId: sessionUserId,
            username,
            email: body.email || sessionEmail,
            displayName,
            bio: body.bio ?? "",
            avatarUrl: body.avatarUrl || "",
            isPublic: body.isPublic ?? true,
            followers: body.followers || [],
            following: body.following || [],
        };

        // 1. profiles コレクション更新
        await db.collection("profiles").updateOne(
            { userId: sessionUserId },
            {
                $set: updatedProfile,
            },
            { upsert: true },
        );

        // 2. users コレクション更新 (displayName, username)
        const userUpdate = {
            displayName,
            username,
        };
        try {
            if (ObjectId.isValid(sessionUserId)) {
                await db.collection("users").updateOne(
                    { _id: new ObjectId(sessionUserId) },
                    { $set: userUpdate },
                );
            }
        } catch {
            // ignore ObjectId parse error
        }
        await db.collection("users").updateOne(
            { email: sessionEmail },
            { $set: userUpdate },
        );

        // 3. posts コレクション内の該当ユーザー投稿 (authorName, authorUsername) を一括更新
        await db.collection("posts").updateMany(
            {
                $or: [
                    { authorId: sessionUserId },
                    { authorEmail: sessionEmail },
                ],
            },
            {
                $set: {
                    authorName: displayName,
                    authorUsername: username,
                },
            },
        );

        // 4. posts コレクション内の replies 配列 (replies.authorId) の authorName, authorUsername も更新
        await db.collection("posts").updateMany(
            { "replies.authorId": sessionUserId },
            {
                $set: {
                    "replies.$[elem].authorName": displayName,
                    "replies.$[elem].authorUsername": username,
                },
            },
            {
                arrayFilters: [{ "elem.authorId": sessionUserId }],
            },
        );

        // 5. blog-auth クッキーの更新 (セッション情報の即時同期)
        const cookieStore = await cookies();
        cookieStore.set(
            "blog-auth",
            JSON.stringify({
                email: sessionEmail,
                id: sessionUserId,
                name: displayName,
                displayName,
                username,
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
            profile: updatedProfile,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to save profile" },
            { status: 500 },
        );
    }
}
