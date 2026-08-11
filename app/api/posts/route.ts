import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

export async function GET() {
    try {
        const session = await auth();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const posts = await db
            .collection("posts")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const visiblePosts = posts.filter((post) => {
            const isOwner = session?.user?.email && post.authorEmail === session.user.email;
            if (isOwner) {
                return true;
            }
            return post.visibility === "public";
        });

        return NextResponse.json(
            visiblePosts.map((post) => ({
                id: post.id,
                title: post.title,
                content: post.content,
                createdAt: post.createdAt,
                authorId: post.authorId,
                authorName: post.authorName,
                authorUsername: post.authorUsername,
                visibility: post.visibility,
                imageUrl: post.imageUrl,
                likes: post.likes ?? 0,
                likedBy: post.likedBy ?? [],
                replies: post.replies ?? [],
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
            authorId: body.authorId || "guest",
            authorName: body.authorName || "Anonymous",
            authorUsername: body.authorUsername || "",
            authorEmail: body.authorEmail || "",
            visibility: body.visibility || "public",
            imageUrl: body.imageUrl || "",
            likes: 0,
            likedBy: [],
            replies: [],
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
