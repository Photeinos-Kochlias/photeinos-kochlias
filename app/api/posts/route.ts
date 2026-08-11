import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const posts = await db
            .collection("posts")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json(
            posts.map((post) => ({
                id: post.id,
                title: post.title,
                content: post.content,
                createdAt: post.createdAt,
            })),
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch posts" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const newPost = {
            id: Date.now(),
            title: body.title,
            content: body.content,
            createdAt: new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
        };

        await db.collection("posts").insertOne(newPost);

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                error: "Failed to create post. Check MONGODB_URI and MONGODB_DB.",
            },
            { status: 500 },
        );
    }
}
