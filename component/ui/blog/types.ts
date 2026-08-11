export type Post = {
    id: number;
    title: string;
    content: string;
    createdAt: string;
};

export type CreatePostPayload = {
    title: string;
    content: string;
};

export type UpdatePostPayload = {
    title: string;
    content: string;
};
