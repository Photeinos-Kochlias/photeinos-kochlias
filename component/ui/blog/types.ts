export type PostReply = {
    id: number;
    content: string;
    authorId?: string;
    authorName?: string;
    createdAt: string;
};

export type Post = {
    id: number;
    title: string;
    content: string;
    createdAt: string;

    authorId?: string;
    authorName?: string;
    authorUsername?: string;
    authorAvatarUrl?: string;

    visibility?: "public" | "private" | "followers";

    imageUrl?: string;

    likes?: number;
    likedBy?: string[];

    replies?: PostReply[];
};

export type CreatePostPayload = {
    title?: string;
    content: string;

    authorId?: string;
    authorName?: string;
    authorEmail?: string;
    authorUsername?: string;
    authorAvatarUrl?: string;

    visibility?: "public" | "private" | "followers";

    imageUrl?: string;
};

export type UpdatePostPayload = {
    title?: string;
    content: string;

    visibility?: "public" | "private" | "followers";

    imageUrl?: string;
};

export type Profile = {
    userId: string;

    username?: string;
    email?: string;

    displayName: string;
    bio: string;
    avatarUrl: string;

    isPublic: boolean;

    followers?: string[];
    following?: string[];
};

export type CurrentUser = {
    id: string;
    name: string;
    email: string;
};