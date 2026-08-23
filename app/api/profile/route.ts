import { NextResponse } from "next/server";

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

        if (!userId) {
            return NextResponse.json(
                {
                    error: "Missing userId",
                },
                {
                    status: 400,
                },
            );
        }

        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const profile = await db.collection("profiles").findOne({
            userId,
        });

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
            {
                error: "Failed to fetch profile",
            },
            {
                status: 500,
            },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const session = await auth();

        const sessionEmail = session?.user?.email || "";

        const sessionUserId = session?.user?.id || "";

        const sessionDisplayName =
            session?.user?.displayName || session?.user?.name || "";

        if (!sessionUserId || !sessionEmail) {
            return NextResponse.json(
                {
                    error: "Unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        if (body.email && sessionEmail && body.email !== sessionEmail) {
            return NextResponse.json(
                {
                    error: "Forbidden",
                },
                {
                    status: 403,
                },
            );
        }

        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const displayName = String(
            body.displayName || sessionDisplayName || sessionEmail || "User",
        ).trim();

        const username =
            body.username ||
            slugify(
                displayName ||
                    body.email ||
                    sessionEmail ||
                    sessionUserId ||
                    "user",
            );

        const email = body.email || sessionEmail;

        const bio = body.bio ?? "";

        const avatarUrl = body.avatarUrl || "";

        const isPublic = body.isPublic ?? true;

        const followers = body.followers || [];

        const following = body.following || [];

        /*
         * =========================
         * Profile
         * =========================
         */

        const result = await db.collection("profiles").updateOne(
            {
                userId: sessionUserId,
            },
            {
                $set: {
                    userId: sessionUserId,

                    username,

                    email,

                    displayName,

                    bio,

                    avatarUrl,

                    isPublic,

                    followers,

                    following,
                },
            },
            {
                upsert: true,
            },
        );

        /*
         * =========================
         * Posts
         * =========================
         *
         * postsには投稿作成時点の
         * authorName / authorUsername
         * が保存されています。
         *
         * プロフィールを変更したら、
         * 既存の投稿も同期します。
         */

        const postsResult = await db.collection("posts").updateMany(
            {
                authorId: sessionUserId,
            },
            {
                $set: {
                    authorName: displayName,

                    authorUsername: username,

                    authorEmail: email,
                },
            },
        );

        return NextResponse.json({
            ok: true,

            modifiedCount: result.modifiedCount || result.upsertedCount || 0,

            updatedPosts: postsResult.modifiedCount,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to save profile",
            },
            {
                status: 500,
            },
        );
    }
}
