"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Post } from "./types";


//デバッグ用Post
const initialPosts: Post[] = [
    {
        id: 1,
        title: "Test blog",
        content: "Let us post!",
        createdAt: "2026/08/01",
    },
    {
        id: 2,
        title: "today",
        content: "blablabla",
        createdAt: "2026/08/05",
    },
];

export function useBlogPosts() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [editId, setEditId] = useState<number | null>(null);
    const [status, setStatus] = useState("Make new post.");

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const savedPosts = window.localStorage.getItem("blog-posts");
        if (!savedPosts) {
            return;
        }

        try {
            const parsedPosts = JSON.parse(savedPosts) as Post[];
            if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setPosts(parsedPosts);
            }
        } catch {
            window.localStorage.removeItem("blog-posts");
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("blog-posts", JSON.stringify(posts));
        }
    }, [posts]);

    const resetForm = () => {
        setTitle("");
        setContent("");
        setEditId(null);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        if (!trimmedTitle || !trimmedContent) {
            setStatus("Title and article");
            return;
        }

        if (editId !== null) {
            setPosts((currentPosts) =>
                currentPosts.map((post) =>
                    post.id === editId
                        ? {
                              ...post,
                              title: trimmedTitle,
                              content: trimmedContent,
                          }
                        : post,
                ),
            );
            setStatus("post renewed.");
            resetForm();
            return;
        }

        const newPost: Post = {
            id: Date.now(),
            title: trimmedTitle,
            content: trimmedContent,
            createdAt: new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
        };

        setPosts((currentPosts) => [newPost, ...currentPosts]);
        setStatus("new post added");
        resetForm();
    };

    const handleEdit = (post: Post) => {
        setEditId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setStatus("Editing. Save your change.");
    };

    const handleDelete = (postId: number) => {
        setPosts((currentPosts) =>
            currentPosts.filter((post) => post.id !== postId),
        );
        if (editId === postId) {
            resetForm();
        }
        setStatus("Post deleted.");
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
