"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CreatePostPayload, CurrentUser, Post, UpdatePostPayload } from "./types";

export function useBlogPosts() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");
    const [posts, setPosts] = useState<Post[]>([]);
    const [editId, setEditId] = useState<number | null>(null);
    const [status, setStatus] = useState("Loading posts...");
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const loadPosts = async () => {
        try {
            const response = await fetch("/api/posts");
            if (!response.ok) {
                throw new Error("Failed to load posts");
            }
            const data = (await response.json()) as Post[];
            setPosts(data);
            setStatus("Make new post.");
        } catch {
            setStatus("Unable to load posts from the database.");
        }
    };

    const loadCurrentUser = async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (!response.ok) {
                setCurrentUser(null);
                return;
            }

            const data = (await response.json()) as CurrentUser;
            setCurrentUser(data);
        } catch {
            setCurrentUser(null);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadPosts();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadCurrentUser();
    }, []);

    const resetForm = () => {
        setTitle("");
        setContent("");
        setImageUrl("");
        setVisibility("public");
        setEditId(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        if (!trimmedTitle || !trimmedContent) {
            setStatus("Title and article");
            return;
        }

        try {
            if (editId !== null) {
                const payload: UpdatePostPayload = {
                    title: trimmedTitle,
                    content: trimmedContent,
                    visibility,
                    imageUrl,
                };

                const response = await fetch(`/api/posts/${editId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "x-blog-user-email": currentUser?.email || "",
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error("Update failed");
                }

                setStatus("post renewed.");
                resetForm();
                await loadPosts();
                return;
            }

            const payload: CreatePostPayload = {
                title: trimmedTitle,
                content: trimmedContent,
                authorId: currentUser?.id,
                authorName: currentUser?.name,
                authorEmail: currentUser?.email,
                visibility,
                imageUrl,
            };

            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-blog-user-email": currentUser?.email || "",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Create failed");
            }

            setStatus("new post added");
            resetForm();
            await loadPosts();
        } catch {
            setStatus("Failed to save post.");
        }
    };

    const handleEdit = (post: Post) => {
        setEditId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setImageUrl(post.imageUrl || "");
        setVisibility(post.visibility || "public");
        setStatus("Editing. Save your change.");
    };

    const handleDelete = async (postId: number) => {
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: "DELETE",
                headers: {
                    "x-blog-user-email": currentUser?.email || "",
                },
            });

            if (!response.ok) {
                throw new Error("Delete failed");
            }

            if (editId === postId) {
                resetForm();
            }

            setStatus("Post deleted.");
            await loadPosts();
        } catch {
            setStatus("Failed to delete post.");
        }
    };

    const handleReact = async (postId: number) => {
        try {
            const response = await fetch(`/api/posts/${postId}/react`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-blog-user-email": currentUser?.email || "",
                },
                body: JSON.stringify({ userId: currentUser?.id }),
            });

            if (!response.ok) {
                throw new Error("Reaction failed");
            }

            await loadPosts();
            setStatus("Reaction updated.");
        } catch {
            setStatus("Failed to update reaction.");
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
        handleDelete,
        handleReact,
        currentUser,
    };
}
