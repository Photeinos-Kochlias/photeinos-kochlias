import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { loadAuthorProfiles, serializePosts } from "@/lib/post-display";
import { createNotification } from "@/lib/notifications";

export async function GET() {
    try {
        const session = await auth();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());
        const posts = await db
            .collection("posts")
            .find({})
            .sort({ id: -1 })
            .toArray();

        const visiblePosts = posts.filter((post) => {
            const isOwner =
                session?.user?.email &&
                post.authorEmail === session.user.email;
            if (isOwner) {
                return true;
            }
            return post.visibility === "public";
        });

        const profiles = await loadAuthorProfiles(
            db.collection("profiles"),
            visiblePosts,
        );

        return NextResponse.json(serializePosts(visiblePosts, profiles));
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
        const session = await auth();
        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const authorId =
            session?.user?.id || body.authorId || "guest";
        const sessionEmail = session?.user?.email || body.authorEmail || "";

        const profile =
            authorId !== "guest" || sessionEmail
                ? await db.collection("profiles").findOne({
                      $or: [
                          ...(authorId !== "guest" ? [{ userId: authorId }] : []),
                          ...(sessionEmail ? [{ email: sessionEmail }] : []),
                      ],
                  })
                : null;

        const newPost = {
            id: Date.now(),
            title: body.title,
            content: body.content,
            authorId,
            authorName:
                profile?.displayName ||
                body.authorName ||
                session?.user?.name ||
                "Anonymous",
            authorUsername:
                profile?.username || body.authorUsername || "",
            authorEmail:
                profile?.email ||
                body.authorEmail ||
                session?.user?.email ||
                "",
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

        const followers = Array.isArray(profile?.followers)
            ? profile.followers
            : [];
        await Promise.all(
            followers.map((recipientId: string) =>
                createNotification(db.collection("notifications"), {
                    recipientId,
                    actorId: authorId,
                    actorName: newPost.authorName,
                    type: "post",
                    postId: newPost.id,
                }),
            ),
        );

        return NextResponse.json(
            {
                ...newPost,
                authorAvatarUrl: profile?.avatarUrl || "",
            },
            { status: 201 },
        );
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
