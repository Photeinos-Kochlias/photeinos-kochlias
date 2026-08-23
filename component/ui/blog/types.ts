export type Visibility =
    | "public"
    | "private"
    | "followers";

export type CurrentUser = {
    id: string;
    name: string;
    email: string;
    username?: string;
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

export type Post = {
    id: number;
    title: string;
    content: string;
    createdAt: string;

    authorId: string;
    authorName: string;
    authorUsername?: string;
    authorEmail?: string;

    visibility: Visibility;

    imageUrl?: string;

    likes?: number;
    likedBy?: string[];

    replies?: unknown[];
};

export type CreatePostPayload = {
    title: string;
    content: string;

    authorId: string;
    authorName: string;
    authorEmail: string;
    authorUsername?: string;

    visibility: Visibility;
    imageUrl?: string;
};

export type UpdatePostPayload = {
    title: string;
    content: string;
    visibility: Visibility;
    imageUrl?: string;
};