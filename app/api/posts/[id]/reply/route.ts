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
        const body = await request.json();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const post = await db.collection("posts").findOne({ id: Number(id) });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const authorId = session?.user?.id || "guest";
        const sessionEmail = session?.user?.email || "";

        const profile =
            authorId !== "guest" || sessionEmail
                ? await db.collection("profiles").findOne({
                    $or: [
                        ...(authorId !== "guest"
                            ? [{ userId: authorId }]
                            : []),
                        ...(sessionEmail ? [{ email: sessionEmail }] : []),
                    ],
                })
                : null;

        const reply = {
            id: Date.now(),
            content: String(body.content || "").trim(),
            authorId,
            authorEmail: sessionEmail,
            authorName:
                profile?.displayName || session?.user?.name || "Anonymous",
            authorUsername: profile?.username || "",
            createdAt: new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
        };

        if (!reply.content) {
            return NextResponse.json(
                { error: "Reply is required" },
                { status: 400 },
            );
        }

        await db.collection("posts").updateOne({ id: Number(id) }, {
            $push: { replies: reply },
        } as never);

        await createNotification(db.collection("notifications"), {
            recipientId: String(post.authorId || ""),
            actorId: authorId,
            actorName: reply.authorName,
            type: "reply",
            postId: Number(id),
        });

        return NextResponse.json(
            {
                ...reply,
                authorAvatarUrl: profile?.avatarUrl || "",
            },
            { status: 201 },
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to add reply" },
            { status: 500 },
        );
    }
}
