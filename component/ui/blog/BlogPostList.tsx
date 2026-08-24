"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthorAvatar } from "./AuthorAvatar";
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

    // Likeクリック直後のアニメーション用
    const [likedPostId, setLikedPostId] = useState<number | null>(null);

    // Delete確認用
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(
        null,
    );

    /*
     * =========================
     * Edit
     * =========================
     */

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

    /*
     * =========================
     * Like
     * =========================
     */

    const handleLike = (postId: number) => {
        // クリックした投稿をアニメーション対象にする
        setLikedPostId(postId);

        // 実際のLike処理
        onReact(postId);

        // 0.5秒後にアニメーションだけ解除
        // Like状態そのものは解除しない
        window.setTimeout(() => {
            setLikedPostId((current) =>
                current === postId ? null : current,
            );
        }, 500);
    };

    /*
     * =========================
     * Delete
     * =========================
     */

    const handleDeleteClick = (postId: number) => {
        setDeleteTargetId(postId);
    };

    const handleDeleteConfirm = () => {
        if (deleteTargetId === null) {
            return;
        }

        onDelete(deleteTargetId);
        setDeleteTargetId(null);
    };

    const handleDeleteCancel = () => {
        setDeleteTargetId(null);
    };

    return (
        <>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                {/* =========================
                    Header
                ========================= */}

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

                {/* =========================
                    Posts
                ========================= */}

                <div className="space-y-4">
                    {posts.map((post) => {
                        const isEditing = editingId === post.id;

                        const isOwner =
                            currentUserId !== null &&
                            post.authorId === currentUserId;

                        /*
                         * 現在ログインしているユーザーが
                         * この投稿にLikeしているか
                         */
                        const isLiked =
                            currentUserId !== null &&
                            Array.isArray(post.likedBy) &&
                            post.likedBy.includes(currentUserId);

                        /*
                         * Likeクリック直後の演出中か
                         */
                        const isLikeAnimating =
                            likedPostId === post.id;

                        return (
                            <article
                                key={post.id}
                                onClick={() => {
                                    if (!isEditing) {
                                        window.location.href = `/post/${post.id}`;
                                    }
                                }}
                                className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 transition ${
                                    isEditing
                                        ? ""
                                        : "cursor-pointer hover:border-slate-300 hover:bg-white hover:shadow-md"
                                }`}
                            >
                                {/* =========================
                                    Header
                                ========================= */}

                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <AuthorAvatar
                                            name={post.authorName}
                                            username={
                                                post.authorUsername
                                            }
                                            avatarUrl={
                                                post.authorAvatarUrl
                                            }
                                        />

                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {post.title ||
                                                    "Untitled"}
                                            </h3>

                                            {post.authorUsername ? (
                                                <Link
                                                    href={`/profile/${post.authorUsername}`}
                                                    onClick={(
                                                        event,
                                                    ) => {
                                                        event.stopPropagation();
                                                    }}
                                                    className="text-sm text-slate-600 hover:text-sky-600 hover:underline"
                                                >
                                                    {post.authorName ||
                                                        "Anonymous"}
                                                </Link>
                                            ) : (
                                                <p className="text-sm text-slate-600">
                                                    {post.authorName ||
                                                        "Anonymous"}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <span className="text-sm text-slate-500">
                                        {post.createdAt}
                                    </span>
                                </div>

                                {/* =========================
                                    Edit mode
                                ========================= */}

                                {isEditing ? (
                                    <div
                                        className="mt-5 space-y-4"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
                                        {/* Title */}

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-slate-700">
                                                Title
                                            </span>

                                            <input
                                                value={editTitle}
                                                onChange={(event) =>
                                                    setEditTitle(
                                                        event.target
                                                            .value,
                                                    )
                                                }
                                                placeholder="Optional"
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                            />
                                        </label>

                                        {/* Article */}

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-slate-700">
                                                Article
                                            </span>

                                            <textarea
                                                value={editContent}
                                                onChange={(event) =>
                                                    setEditContent(
                                                        event.target
                                                            .value,
                                                    )
                                                }
                                                rows={8}
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                            />
                                        </label>

                                        {/* Image URL */}

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-slate-700">
                                                Image URL
                                            </span>

                                            <input
                                                value={editImageUrl}
                                                onChange={(event) =>
                                                    setEditImageUrl(
                                                        event.target
                                                            .value,
                                                    )
                                                }
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                            />
                                        </label>

                                        {/* Visibility */}

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
                                                    Visible to everyone
                                                </option>

                                                <option value="followers">
                                                    Visible to followers
                                                </option>

                                                <option value="private">
                                                    Visible to no one
                                                </option>
                                            </select>
                                        </label>

                                        {/* Status */}

                                        {editStatus ? (
                                            <p className="text-sm text-slate-500">
                                                {editStatus}
                                            </p>
                                        ) : null}

                                        {/* Buttons */}

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
                                                onClick={cancelEdit}
                                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* =========================
                                            Content
                                        ========================= */}

                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                            {post.content}
                                        </p>

                                        {/* Image */}

                                        {post.imageUrl ? (
                                            <img
                                                src={post.imageUrl}
                                                alt={
                                                    post.title ||
                                                    "Post image"
                                                }
                                                className="mt-4 h-48 w-full rounded-2xl object-cover"
                                                onError={(
                                                    event,
                                                ) => {
                                                    event.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        ) : null}

                                        {/* =========================
                                            Meta
                                        ========================= */}

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

                                        {/* =========================
                                            Actions
                                        ========================= */}

                                        <div
                                            className="mt-4 flex flex-wrap gap-2"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                            }}
                                        >
                                            {/* Edit */}

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

                                            {/* Reply */}

                                            <Link
                                                href={`/post/${post.id}`}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                }}
                                                className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                reply
                                            </Link>

                                            {/* Like */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleLike(
                                                        post.id,
                                                    )
                                                }
                                                className={`relative overflow-hidden rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                                    isLiked
                                                        ? "bg-pink-600 text-white shadow-md shadow-pink-200"
                                                        : "bg-amber-500 text-white hover:bg-amber-400"
                                                } ${
                                                    isLikeAnimating
                                                        ? "scale-110"
                                                        : "scale-100"
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block transition-transform duration-300 ${
                                                        isLikeAnimating
                                                            ? "scale-125"
                                                            : "scale-100"
                                                    }`}
                                                >
                                                    {isLiked
                                                        ? "♥"
                                                        : "♡"}
                                                </span>

                                                <span className="ml-1">
                                                    {post.likes || 0}
                                                </span>

                                                {/* Like animation */}

                                                {isLikeAnimating ? (
                                                    <span
                                                        className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-pink-300 opacity-50"
                                                        aria-hidden="true"
                                                    />
                                                ) : null}
                                            </button>

                                            {/* Delete */}

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
                Delete confirmation modal
            ========================= */}

            {deleteTargetId !== null ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
                    onClick={handleDeleteCancel}
                >
                    <div
                        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        <div className="mb-5">
                            <p className="text-sm font-semibold text-rose-600">
                                Delete post
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                Delete this post?
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                This action cannot be undone. The post
                                and its contents will be permanently
                                deleted.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleDeleteCancel}
                                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
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