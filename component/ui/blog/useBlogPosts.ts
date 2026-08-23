"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

import type {
    CreatePostPayload,
    CurrentUser,
    Post,
    UpdatePostPayload,
    Visibility,
} from "./types";

export function useBlogPosts() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [visibility, setVisibility] =
        useState<Visibility>("public");

    const [posts, setPosts] = useState<Post[]>([]);

    const [editId, setEditId] =
        useState<number | null>(null);

    const [status, setStatus] =
        useState("Loading posts...");

    const [currentUser, setCurrentUser] =
        useState<CurrentUser | null>(null);

    /*
     * =========================
     * Load posts
     * =========================
     */

    const loadPosts = useCallback(async () => {
        try {
            const response = await fetch("/api/posts", {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(
                    "Failed to load posts",
                );
            }

            const data =
                (await response.json()) as Post[];

            setPosts(data);
            setStatus("Make new post.");
        } catch (error) {
            console.error(error);

            setStatus(
                "Unable to load posts from the database.",
            );
        }
    }, []);

    /*
     * =========================
     * Load current user
     * =========================
     */

    const loadCurrentUser = useCallback(
        async () => {
            try {
                const response = await fetch(
                    "/api/auth/me",
                    {
                        cache: "no-store",
                    },
                );

                if (!response.ok) {
                    setCurrentUser(null);
                    return;
                }

                const data =
                    (await response.json()) as CurrentUser;

                setCurrentUser(data);
            } catch (error) {
                console.error(error);
                setCurrentUser(null);
            }
        },
        [],
    );

    /*
     * =========================
     * Initial load
     * =========================
     */

    useEffect(() => {
        void loadPosts();
        void loadCurrentUser();
    }, [loadPosts, loadCurrentUser]);

    /*
     * =========================
     * Reset form
     * =========================
     */

    const resetForm = () => {
        setTitle("");
        setContent("");
        setImageUrl("");
        setVisibility("public");
        setEditId(null);
    };

    /*
     * =========================
     * Create / update from form
     * =========================
     */

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        const trimmedImageUrl = imageUrl.trim();

        /*
         * タイトルは任意
         */
        if (!trimmedContent) {
            setStatus(
                "Article is required.",
            );
            return;
        }

        if (!currentUser) {
            setStatus(
                "Please sign in first.",
            );
            return;
        }

        try {
            /*
             * =========================
             * Update
             * =========================
             */

            if (editId !== null) {
                const payload: UpdatePostPayload = {
                    title: trimmedTitle,
                    content: trimmedContent,
                    visibility,
                    imageUrl: trimmedImageUrl,
                };

                const response = await fetch(
                    `/api/posts/${editId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-blog-user-email":
                                currentUser.email,
                        },
                        body: JSON.stringify(payload),
                    },
                );

                if (!response.ok) {
                    const data =
                        await response
                            .json()
                            .catch(() => null);

                    throw new Error(
                        data?.error ||
                            "Update failed",
                    );
                }

                resetForm();

                await loadPosts();

                setStatus(
                    "Post updated.",
                );

                return;
            }

            /*
             * =========================
             * Create
             * =========================
             */

            const payload: CreatePostPayload = {
                title: trimmedTitle,
                content: trimmedContent,

                authorId: currentUser.id,
                authorName: currentUser.name,
                authorEmail: currentUser.email,
                authorUsername:
                    currentUser.username || "",

                visibility,
                imageUrl: trimmedImageUrl,
            };

            const response = await fetch(
                "/api/posts",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-blog-user-email":
                            currentUser.email,
                    },
                    body: JSON.stringify(payload),
                },
            );

            if (!response.ok) {
                const data =
                    await response
                        .json()
                        .catch(() => null);

                throw new Error(
                    data?.error ||
                        "Create failed",
                );
            }

            resetForm();

            await loadPosts();

            setStatus(
                "New post successfully created.",
            );
        } catch (error) {
            console.error(error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to save post.",
            );
        }
    };

    /*
     * =========================
     * Edit
     * =========================
     */

    const handleEdit = (post: Post) => {
        if (!currentUser) {
            setStatus(
                "Please sign in first.",
            );
            return;
        }

        if (
            post.authorId !==
            currentUser.id
        ) {
            setStatus(
                "You can only edit your own posts.",
            );
            return;
        }

        setEditId(post.id);
        setTitle(post.title || "");
        setContent(post.content);
        setImageUrl(post.imageUrl || "");
        setVisibility(
            post.visibility || "public",
        );

        setStatus(
            "Editing. Save your change.",
        );
    };

    /*
     * =========================
     * Inline update
     *
     * 引数順を BlogPostList と統一
     * =========================
     */

    const handleUpdate = async (
        postId: number,
        nextTitle: string,
        nextContent: string,
        nextVisibility: Visibility,
        nextImageUrl: string,
    ): Promise<boolean> => {
        if (!currentUser) {
            setStatus(
                "Please sign in first.",
            );

            return false;
        }

        const post = posts.find(
            (item) => item.id === postId,
        );

        if (!post) {
            setStatus(
                "Post not found.",
            );

            return false;
        }

        if (
            post.authorId !==
            currentUser.id
        ) {
            setStatus(
                "You can only edit your own posts.",
            );

            return false;
        }

        const trimmedTitle =
            nextTitle.trim();

        const trimmedContent =
            nextContent.trim();

        const trimmedImageUrl =
            nextImageUrl.trim();

        /*
         * タイトルは任意
         */
        if (!trimmedContent) {
            setStatus(
                "Article is required.",
            );

            return false;
        }

        try {
            setStatus("Saving...");

            const payload: UpdatePostPayload = {
                title: trimmedTitle,
                content: trimmedContent,
                visibility:
                    nextVisibility,
                imageUrl:
                    trimmedImageUrl,
            };

            const response = await fetch(
                `/api/posts/${postId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-blog-user-email":
                            currentUser.email,
                    },
                    body: JSON.stringify(
                        payload,
                    ),
                },
            );

            if (!response.ok) {
                const data =
                    await response
                        .json()
                        .catch(() => null);

                throw new Error(
                    data?.error ||
                        "Failed to update post.",
                );
            }

            const updatedPost =
                (await response
                    .json()
                    .catch(
                        () => null,
                    )) as Post | null;

            setPosts(
                (currentPosts) =>
                    currentPosts.map(
                        (item) => {
                            if (
                                item.id !==
                                postId
                            ) {
                                return item;
                            }

                            if (
                                updatedPost?.id
                            ) {
                                return updatedPost;
                            }

                            return {
                                ...item,

                                title:
                                    trimmedTitle,

                                content:
                                    trimmedContent,

                                imageUrl:
                                    trimmedImageUrl,

                                visibility:
                                    nextVisibility,
                            };
                        },
                    ),
            );

            setStatus(
                "Post updated.",
            );

            return true;
        } catch (error) {
            console.error(error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to update post.",
            );

            return false;
        }
    };

    /*
     * =========================
     * Delete
     * =========================
     */

    const handleDelete = async (
        postId: number,
    ) => {
        if (!currentUser) {
            setStatus(
                "Please sign in first.",
            );

            return;
        }

        const post = posts.find(
            (item) => item.id === postId,
        );

        if (!post) {
            setStatus(
                "Post not found.",
            );

            return;
        }

        if (
            post.authorId !==
            currentUser.id
        ) {
            setStatus(
                "You can only delete your own posts.",
            );

            return;
        }

        try {
            const response = await fetch(
                `/api/posts/${postId}`,
                {
                    method: "DELETE",
                    headers: {
                        "x-blog-user-email":
                            currentUser.email,
                    },
                },
            );

            if (!response.ok) {
                const data =
                    await response
                        .json()
                        .catch(() => null);

                throw new Error(
                    data?.error ||
                        "Delete failed",
                );
            }

            setPosts(
                (currentPosts) =>
                    currentPosts.filter(
                        (item) =>
                            item.id !==
                            postId,
                    ),
            );

            if (
                editId === postId
            ) {
                resetForm();
            }

            setStatus(
                "Post deleted.",
            );
        } catch (error) {
            console.error(error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to delete post.",
            );
        }
    };

    /*
     * =========================
     * Like
     * =========================
     */

    const handleReact = async (
        postId: number,
    ) => {
        if (!currentUser) {
            setStatus(
                "Please sign in first.",
            );

            return;
        }

        try {
            const response = await fetch(
                `/api/posts/${postId}/react`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-blog-user-email":
                            currentUser.email,
                    },

                    body: JSON.stringify({
                        userId:
                            currentUser.id,
                    }),
                },
            );

            if (!response.ok) {
                const data =
                    await response
                        .json()
                        .catch(
                            () => null,
                        );

                throw new Error(
                    data?.error ||
                        "Reaction failed",
                );
            }

            await loadPosts();

            setStatus(
                "Reaction updated.",
            );
        } catch (error) {
            console.error(error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to update reaction.",
            );
        }
    };

    return {
        title,
        setTitle,

        content,
        setContent,

        imageUrl,
        setImageUrl,

        visibility,
        setVisibility,

        posts,

        editId,

        status,

        resetForm,

        handleSubmit,
        handleEdit,
        handleUpdate,
        handleDelete,
        handleReact,

        currentUser,
    };
}