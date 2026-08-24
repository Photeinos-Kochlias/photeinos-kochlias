import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { loadAuthorProfiles, serializePosts } from "@/lib/post-display";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const post = await db.collection("posts").findOne({ id: Number(id) });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const isOwner = session?.user?.email && post.authorEmail === session.user.email;
        if (!isOwner && post.visibility !== "public") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const profiles = await loadAuthorProfiles(
            db.collection("profiles"),
            [post],
        );

        return NextResponse.json(serializePosts([post], profiles)[0]);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        const sessionEmail = session?.user?.email || "";
        const body = await request.json();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const post = await db.collection("posts").findOne({ id: Number(id) });
        if (!post || post.authorEmail !== sessionEmail) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const result = await db
            .collection("posts")
            .updateOne(
                { id: Number(id) },
                {
                    $set: {
                        title: body.title,
                        content: body.content,
                        visibility: body.visibility || "public",
                        imageUrl: body.imageUrl || "",
                    },
                },
            );

        if (!result.matchedCount) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to update post" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();
        const sessionEmail = session?.user?.email || "";
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const post = await db.collection("posts").findOne({ id: Number(id) });
        if (!post || post.authorEmail !== sessionEmail) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const result = await db
            .collection("posts")
            .deleteOne({ id: Number(id) });

        if (!result.deletedCount) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete post" },
            { status: 500 },
        );
    }
}
