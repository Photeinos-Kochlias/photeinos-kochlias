"use client";

import Link from "next/link";
import { useState } from "react";
import type { Post } from "./types";

type BlogPostListProps = {
    posts: Post[];
    currentUserId: string | null;
    onUpdate: (
        postId: number,
        title: string,
        content: string,
        visibility: "public" | "private" | "followers",
        imageUrl: string,
    ) => Promise<boolean>;
    onDelete: (postId: number) => void;
    onReact: (postId: number) => void;
};

export function BlogPostList({
    posts,
    currentUserId,
    onUpdate,
    onDelete,
    onReact,
}: BlogPostListProps) {
    const [editingId, setEditingId] = useState<number | null>(null);

    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [editVisibility, setEditVisibility] = useState<
        "public" | "private" | "followers"
    >("public");

    const [editStatus, setEditStatus] = useState("");

    // 削除確認用
    const [deleteTargetId, setDeleteTargetId] =
        useState<number | null>(null);

    const startEdit = (post: Post) => {
        setEditingId(post.id);
        setEditTitle(post.title || "");
        setEditContent(post.content);
        setEditImageUrl(post.imageUrl || "");
        setEditVisibility(post.visibility || "public");
        setEditStatus("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle("");
        setEditContent("");
        setEditImageUrl("");
        setEditVisibility("public");
        setEditStatus("");
    };

    const saveEdit = async (postId: number) => {
        const title = editTitle.trim();
        const content = editContent.trim();

        if (!content) {
            setEditStatus("Article is required.");
            return;
        }

        setEditStatus("Saving...");

        const success = await onUpdate(
            postId,
            title,
            content,
            editVisibility,
            editImageUrl.trim(),
        );

        if (success) {
            setEditStatus("Saved.");
            setEditingId(null);
        } else {
            setEditStatus("Failed to save.");
        }
    };

    const handleDeleteClick = (postId: number) => {
        setDeleteTargetId(postId);
    };

    const cancelDelete = () => {
        setDeleteTargetId(null);
    };

    const confirmDelete = () => {
        if (deleteTargetId === null) {
            return;
        }

        onDelete(deleteTargetId);
        setDeleteTargetId(null);
    };

    const deleteTarget = posts.find(
        (post) => post.id === deleteTargetId,
    );

    return (
        <>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-sky-600">
                            Latest article
                        </p>

                        <h2 className="mt-2 text-2xl font-semibold">
                            Posts
                        </h2>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {posts.length} posts
                    </span>
                </div>

                <div className="space-y-4">
                    {posts.map((post) => {
                        const isEditing =
                            editingId === post.id;

                        const isOwner =
                            currentUserId !== null &&
                            post.authorId === currentUserId;

                        return (
                            <article
                                key={post.id}
                                onClick={() => {
                                    if (!isEditing) {
                                        window.location.href =
                                            `/post/${post.id}`;
                                    }
                                }}
                                className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 transition ${
                                    isEditing
                                        ? ""
                                        : "cursor-pointer hover:border-slate-300 hover:bg-white hover:shadow-md"
                                }`}
                            >
                                {/* Header */}

                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white">
                                            {(post.authorName ||
                                                "A")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            {post.title ? (
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    {post.title}
                                                </h3>
                                            ) : null}

                                            <p className="text-sm text-slate-600">
                                                {post.authorName ||
                                                    "Anonymous"}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="text-sm text-slate-500">
                                        {post.createdAt}
                                    </span>
                                </div>

                                {/* 編集 */}

                                {isEditing ? (
                                    <div
                                        className="mt-5 space-y-4"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-slate-700">
                                                Title
                                            </span>

                                            <input
                                                value={editTitle}
                                                onChange={(event) =>
                                                    setEditTitle(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-slate-700">
                                                Article
                                            </span>

                                            <textarea
                                                value={editContent}
                                                onChange={(event) =>
                                                    setEditContent(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                rows={8}
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-slate-700">
                                                Image URL
                                            </span>

                                            <input
                                                value={editImageUrl}
                                                onChange={(event) =>
                                                    setEditImageUrl(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-slate-700">
                                                Visibility
                                            </span>

                                            <select
                                                value={
                                                    editVisibility
                                                }
                                                onChange={(event) =>
                                                    setEditVisibility(
                                                        event.target
                                                            .value as
                                                            | "public"
                                                            | "private"
                                                            | "followers",
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="public">
                                                    Visible to
                                                    everyone
                                                </option>

                                                <option value="followers">
                                                    Visible to
                                                    followers
                                                </option>

                                                <option value="private">
                                                    Visible to no
                                                    one
                                                </option>
                                            </select>
                                        </label>

                                        {editStatus ? (
                                            <p className="text-sm text-slate-500">
                                                {editStatus}
                                            </p>
                                        ) : null}

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void saveEdit(
                                                        post.id,
                                                    )
                                                }
                                                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                            >
                                                Save
                                            </button>

                                            <button
                                                type="button"
                                                onClick={
                                                    cancelEdit
                                                }
                                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* 通常表示 */}

                                        <p className="mt-2 text-sm leading-7 text-slate-700">
                                            {post.content}
                                        </p>

                                        {post.imageUrl ? (
                                            <img
                                                src={
                                                    post.imageUrl
                                                }
                                                alt={
                                                    post.title ||
                                                    "Post image"
                                                }
                                                className="mt-4 h-48 w-full rounded-2xl object-cover"
                                            />
                                        ) : null}

                                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                            {post.authorUsername ? (
                                                <Link
                                                    href={`/profile/${post.authorUsername}`}
                                                    onClick={(
                                                        event,
                                                    ) => {
                                                        event.stopPropagation();
                                                    }}
                                                    className="text-sky-600 underline"
                                                >
                                                    {
                                                        post.authorUsername
                                                    }
                                                </Link>
                                            ) : null}

                                            <span>
                                                公開:{" "}
                                                {post.visibility ||
                                                    "public"}
                                            </span>

                                            <span>
                                                いいね:{" "}
                                                {post.likes || 0}
                                            </span>

                                            <span>
                                                返信:{" "}
                                                {post.replies
                                                    ?.length ||
                                                    0}
                                            </span>
                                        </div>

                                        <div
                                            className="mt-4 flex flex-wrap gap-2"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                            }}
                                        >
                                            {isOwner ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startEdit(
                                                            post,
                                                        )
                                                    }
                                                    className="rounded-full bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                                                >
                                                    edit
                                                </button>
                                            ) : null}

                                            <Link
                                                href={`/post/${post.id}`}
                                                className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                reply
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onReact(
                                                        post.id,
                                                    )
                                                }
                                                className="rounded-full bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
                                            >
                                                like
                                            </button>

                                            {isOwner ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            post.id,
                                                        )
                                                    }
                                                    className="rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                                                >
                                                    delete
                                                </button>
                                            ) : null}
                                        </div>
                                    </>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>

            {/* =========================
                Delete Confirmation Modal
                ========================= */}

            {deleteTargetId !== null ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
                    onClick={cancelDelete}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-dialog-title"
                        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-6 w-6 text-rose-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v4m0 4h.01M10.29 3.86l-7.36 12.73A2 2 0 004.66 20h14.68a2 2 0 001.73-3.41L13.71 3.86a2 2 0 00-3.42 0z"
                                />
                            </svg>
                        </div>

                        <h2
                            id="delete-dialog-title"
                            className="mt-5 text-xl font-semibold text-slate-900"
                        >
                            Delete this post?
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            {deleteTarget?.title
                                ? `"${deleteTarget.title}" will be permanently deleted.`
                                : "This post will be permanently deleted."}
                        </p>

                        <p className="mt-2 text-sm font-medium text-rose-600">
                            This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}