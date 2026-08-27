import type { Collection, Document } from "mongodb";
import type { Post, PostReply } from "@/component/ui/blog/types";

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function generateUsername(
    preferredUsername?: string,
    displayName?: string,
    email?: string,
    userId?: string,
): string {
    if (preferredUsername) {
        const slug = slugify(preferredUsername);
        if (slug) {
            return slug;
        }
    }

    if (displayName) {
        const slug = slugify(displayName);
        if (slug) {
            return slug;
        }
    }

    if (email) {
        const localPart = email.split("@")[0] || "";
        const slug = slugify(localPart);
        if (slug) {
            return slug;
        }
    }

    if (userId) {
        const slug = slugify(userId);
        if (slug) {
            return slug;
        }
        return `user-${userId.slice(-6)}`;
    }

    return `user-${Date.now().toString(36)}`;
}

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
        authorEmail?: string;
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
    if (authorEmail && indexes.byEmail.has(authorEmail)) {
        return indexes.byEmail.get(authorEmail);
    }
    if (authorUsername && indexes.byUsername.has(authorUsername)) {
        return indexes.byUsername.get(authorUsername);
    }
    return undefined;
}

export function serializePost(
    post: PostDocument,
    profile?: AuthorProfile | null,
    replyProfiles?: ReturnType<typeof indexProfiles>,
): Post {
    const replies = (post.replies || []).map((reply) => {
        const replyEmail = (reply as { authorEmail?: string }).authorEmail;
        const replyProfile = replyProfiles
            ? findProfile(
                  replyProfiles,
                  reply.authorId,
                  reply.authorUsername,
                  replyEmail,
              )
            : undefined;

        const authorName = replyProfile?.displayName || reply.authorName;
        const authorUsername =
            replyProfile?.username ||
            reply.authorUsername ||
            generateUsername(
                undefined,
                authorName,
                replyEmail,
                reply.authorId,
            );

        return {
            id: reply.id,
            content: reply.content,
            authorId: reply.authorId,
            authorName,
            authorUsername,
            authorAvatarUrl: replyProfile?.avatarUrl || "",
            createdAt: reply.createdAt,
        } satisfies PostReply;
    });

    const authorName = profile?.displayName || post.authorName;
    const authorUsername =
        profile?.username ||
        post.authorUsername ||
        generateUsername(
            undefined,
            authorName,
            post.authorEmail,
            post.authorId,
        );

    return {
        id: Number(post.id),
        title: post.title || "",
        content: post.content || "",
        createdAt: post.createdAt || "",
        authorId: post.authorId,
        authorName,
        authorUsername,
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
            if (typeof reply.authorEmail === "string") {
                emails.add(reply.authorEmail);
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
