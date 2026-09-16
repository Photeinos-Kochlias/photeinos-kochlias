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
        const session = await auth();
        if (!session?.user?.id || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const title = String(body.title || "").trim();
        const content = String(body.content || "").trim();
        const visibility = body.visibility === "private" ? "private" : "public";
        const imageUrl = String(body.imageUrl || "").trim();
        if (!title || !content || title.length > 200 || content.length > 10000 || imageUrl.length > 2048) {
            return NextResponse.json({ error: "Invalid post content" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const authorId = session.user.id;
        const sessionEmail = session.user.email;

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
            title,
            content,
            authorId,
            authorName:
                profile?.displayName ||
                session.user.name ||
                "Anonymous",
            authorUsername:
                profile?.username || session.user.username || "",
            authorEmail:
                profile?.email || sessionEmail,
            visibility,
            imageUrl,
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
