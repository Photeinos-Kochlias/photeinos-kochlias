import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const post = await db.collection("posts").findOne({ id: Number(id) });
        if (!post) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 },
            );
        }

        const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
        const hasLiked = likedBy.includes(body.userId);

        const updatedLikedBy = hasLiked
            ? likedBy.filter((value: string) => value !== body.userId)
            : [...likedBy, body.userId];

        await db
            .collection("posts")
            .updateOne(
                { id: Number(id) },
                {
                    $set: {
                        likedBy: updatedLikedBy,
                        likes: updatedLikedBy.length,
                    },
                },
            );

        return NextResponse.json({
            ok: true,
            liked: !hasLiked,
            likedBy: updatedLikedBy,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to update reaction" },
            { status: 500 },
        );
    }
}
