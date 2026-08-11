"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CreatePostPayload, Post, UpdatePostPayload } from "./types";

export function useBlogPosts() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [posts, setPosts] = useState<Post[]>([]);
    const [editId, setEditId] = useState<number | null>(null);
    const [status, setStatus] = useState("Loading posts...");

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

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadPosts();
    }, []);

    const resetForm = () => {
        setTitle("");
        setContent("");
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
                };

                const response = await fetch(`/api/posts/${editId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
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
            };

            const response = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        setStatus("Editing. Save your change.");
    };

    const handleDelete = async (postId: number) => {
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: "DELETE",
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

    return {
        title,
        setTitle,
        content,
        setContent,
        posts,
        editId,
        status,
        resetForm,
        handleSubmit,
        handleEdit,
        handleDelete,
    };
}
