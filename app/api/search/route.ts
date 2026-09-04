import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { loadAuthorProfiles, serializePosts } from "@/lib/post-display";

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim() || "";
        const type = searchParams.get("type") === "users" ? "users" : "posts";

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        const db = (await getMongoClient()).db(getDatabaseName());
        const pattern = new RegExp(escapeRegex(query), "i");

        if (type === "users") {
            const profiles = await db
                .collection("profiles")
                .find({
                    isPublic: { $ne: false },
                    $or: [{ username: pattern }, { displayName: pattern }],
                })
                .project({
                    _id: 0,
                    userId: 1,
                    username: 1,
                    displayName: 1,
                    bio: 1,
                    avatarUrl: 1,
                    followers: 1,
                    following: 1,
                })
                .limit(30)
                .toArray();

            return NextResponse.json({ results: profiles });
        }

        const posts = await db
            .collection("posts")
            .find({
                visibility: "public",
                $or: [
                    { title: pattern },
                    { content: pattern },
                    { authorUsername: pattern },
                    { authorName: pattern },
                ],
            })
            .sort({ id: -1 })
            .limit(30)
            .toArray();
        const profiles = await loadAuthorProfiles(db.collection("profiles"), posts);

        return NextResponse.json({ results: serializePosts(posts, profiles) });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to search" },
            { status: 500 },
        );
    }
}