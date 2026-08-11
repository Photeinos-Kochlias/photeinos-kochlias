import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const result = await db
            .collection("posts")
            .updateOne(
                { id: Number(id) },
                { $set: { title: body.title, content: body.content } },
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
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

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
