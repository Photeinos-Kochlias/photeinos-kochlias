import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
        const hasLiked = likedBy.includes(userId);

        const updatedLikedBy = hasLiked
            ? likedBy.filter((value: string) => value !== userId)
            : [...likedBy, userId];

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

        if (!hasLiked) {
            await createNotification(db.collection("notifications"), {
                recipientId: String(post.authorId || ""),
                actorId: userId,
                actorName: session.user.name || "Someone",
                type: "like",
                postId: Number(id),
            });
        }

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
