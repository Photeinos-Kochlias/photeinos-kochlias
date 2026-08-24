import type { Collection, Document } from "mongodb";
import type { Post, PostReply } from "@/component/ui/blog/types";

export type AuthorProfile = {
    userId?: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
};

type PostDocument = Document & {
    id?: number;
    title?: string;
    content?: string;
    createdAt?: string;
    authorId?: string;
    authorName?: string;
    authorUsername?: string;
    authorEmail?: string;
    visibility?: "public" | "private" | "followers";
    imageUrl?: string;
    likes?: number;
    likedBy?: string[];
    replies?: Array<{
        id: number;
        content: string;
        authorId?: string;
        authorName?: string;
        authorUsername?: string;
        createdAt: string;
    }>;
};

function indexProfiles(profiles: AuthorProfile[]) {
    const byUserId = new Map<string, AuthorProfile>();
    const byUsername = new Map<string, AuthorProfile>();
    const byEmail = new Map<string, AuthorProfile>();

    for (const profile of profiles) {
        if (profile.userId) {
            byUserId.set(profile.userId, profile);
        }
        if (profile.username) {
            byUsername.set(profile.username, profile);
        }
        if (profile.email) {
            byEmail.set(profile.email, profile);
        }
    }

    return { byUserId, byUsername, byEmail };
}

function findProfile(
    indexes: ReturnType<typeof indexProfiles>,
    authorId?: string,
    authorUsername?: string,
    authorEmail?: string,
) {
    if (authorId && indexes.byUserId.has(authorId)) {
        return indexes.byUserId.get(authorId);
    }
    if (authorUsername && indexes.byUsername.has(authorUsername)) {
        return indexes.byUsername.get(authorUsername);
    }
    if (authorEmail && indexes.byEmail.has(authorEmail)) {
        return indexes.byEmail.get(authorEmail);
    }
    return undefined;
}

export function serializePost(
    post: PostDocument,
    profile?: AuthorProfile | null,
    replyProfiles?: ReturnType<typeof indexProfiles>,
): Post {
    const replies = (post.replies || []).map((reply) => {
        const replyProfile = replyProfiles
            ? findProfile(replyProfiles, reply.authorId, reply.authorUsername)
            : undefined;

        return {
            id: reply.id,
            content: reply.content,
            authorId: reply.authorId,
            authorName: replyProfile?.displayName || reply.authorName,
            authorUsername: replyProfile?.username || reply.authorUsername,
            authorAvatarUrl: replyProfile?.avatarUrl || "",
            createdAt: reply.createdAt,
        } satisfies PostReply;
    });

    return {
        id: Number(post.id),
        title: post.title || "",
        content: post.content || "",
        createdAt: post.createdAt || "",
        authorId: post.authorId,
        authorName: profile?.displayName || post.authorName,
        authorUsername: profile?.username || post.authorUsername,
        authorAvatarUrl: profile?.avatarUrl || "",
        visibility: post.visibility,
        imageUrl: post.imageUrl,
        likes: post.likes ?? 0,
        likedBy: post.likedBy ?? [],
        replies,
    };
}

export async function loadAuthorProfiles(
    collection: Collection<Document>,
    posts: Document[],
) {
    const userIds = new Set<string>();
    const usernames = new Set<string>();
    const emails = new Set<string>();

    for (const post of posts as PostDocument[]) {
        if (typeof post.authorId === "string") {
            userIds.add(post.authorId);
        }
        if (typeof post.authorUsername === "string") {
            usernames.add(post.authorUsername);
        }
        if (typeof post.authorEmail === "string") {
            emails.add(post.authorEmail);
        }

        for (const reply of post.replies || []) {
            if (typeof reply.authorId === "string") {
                userIds.add(reply.authorId);
            }
            if (typeof reply.authorUsername === "string") {
                usernames.add(reply.authorUsername);
            }
        }
    }

    const filters = [];
    if (userIds.size > 0) {
        filters.push({ userId: { $in: [...userIds] } });
    }
    if (usernames.size > 0) {
        filters.push({ username: { $in: [...usernames] } });
    }
    if (emails.size > 0) {
        filters.push({ email: { $in: [...emails] } });
    }

    if (filters.length === 0) {
        return indexProfiles([]);
    }

    const profiles = (await collection
        .find({ $or: filters })
        .toArray()) as AuthorProfile[];

    return indexProfiles(profiles);
}

export function serializePosts(
    posts: Document[],
    indexes: ReturnType<typeof indexProfiles>,
): Post[] {
    return posts.map((post) => {
        const document = post as PostDocument;

        return serializePost(
            document,
            findProfile(
                indexes,
                document.authorId,
                document.authorUsername,
                document.authorEmail,
            ),
            indexes,
        );
    });
}
