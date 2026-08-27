"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthorAvatar } from "@/component/ui/blog/AuthorAvatar";
import type { Post, PostReply, Profile } from "@/component/ui/blog/types";

export default function PostDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [post, setPost] = useState<Post | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [reply, setReply] = useState("");
    const [status, setStatus] = useState("Loading...");

    useEffect(() => {
        const loadPost = async () => {
            try {
                const response = await fetch(`/api/posts/${params.id}`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    setStatus("Failed to load post");
                    return;
                }

                const data = (await response.json()) as Post;

                setPost(data);
                setStatus("Ready to reply");

                // 投稿者プロフィールを取得 (guest以外)
                if (data.authorId && data.authorId !== "guest") {
                    const profileResponse = await fetch(
                        `/api/profile?userId=${encodeURIComponent(
                            data.authorId,
                        )}`,
                        { cache: "no-store" },
                    );

                    if (profileResponse.ok) {
                        const profileData =
                            (await profileResponse.json()) as Profile;

                        setProfile(profileData);
                    }
                }
            } catch (error) {
                console.error(error);
                setStatus("Failed to load post");
            }
        };

        void loadPost();

        const handleSync = () => {
            void loadPost();
        };

        window.addEventListener("profile-updated", handleSync);
        window.addEventListener("focus", handleSync);

        return () => {
            window.removeEventListener("profile-updated", handleSync);
            window.removeEventListener("focus", handleSync);
        };
    }, [params.id]);

    const submitReply = async () => {
        if (!reply.trim() || !post) {
            return;
        }

        try {
            const response = await fetch(
                `/api/posts/${post.id}/reply`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: reply.trim(),
                    }),
                },
            );

            if (!response.ok) {
                setStatus("Failed to add reply");
                return;
            }

            const nextReply = (await response.json()) as PostReply;

            setPost((current) =>
                current
                    ? {
                          ...current,
                          replies: [
                              ...(current.replies || []),
                              nextReply,
                          ],
                      }
                    : current,
            );

            setReply("");
            setStatus("Reply added");
        } catch (error) {
            console.error(error);
            setStatus("Failed to add reply");
        }
    };

    if (!post) {
        return (
            <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <p>{status}</p>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Back
                    </button>
                </div>
            </main>
        );
    }

    const authorName =
        profile?.displayName || post.authorName || "Anonymous";
    const authorUsername =
        profile?.username || post.authorUsername;
    const authorAvatarUrl =
        profile?.avatarUrl || post.authorAvatarUrl;

    return (
        <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
            <div className="mx-auto flex max-w-3xl flex-col gap-6">

                {/* Post */}
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-sky-600">
                                Post thread
                            </p>

                            <h1 className="mt-1 text-2xl font-semibold">
                                {post.title}
                            </h1>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Back
                        </button>
                    </div>

                    {/* Author */}
                    <div className="mt-6 flex items-center gap-3">
                        <AuthorAvatar
                            name={authorName}
                            username={authorUsername}
                            avatarUrl={authorAvatarUrl}
                            size="lg"
                        />

                        <div className="min-w-0">
                            {authorUsername ? (
                                <Link
                                    href={`/profile/${authorUsername}`}
                                    className="font-semibold text-slate-900 hover:text-sky-600"
                                >
                                    {authorName}
                                </Link>
                            ) : (
                                <p className="font-semibold text-slate-900">
                                    {authorName}
                                </p>
                            )}

                            {authorUsername ? (
                                <Link
                                    href={`/profile/${authorUsername}`}
                                    className="text-sm text-sky-600 hover:underline"
                                >
                                    @{authorUsername}
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    {/* Post content */}
                    <div className="mt-6">
                        <p className="whitespace-pre-wrap leading-8 text-slate-800">
                            {post.content}
                        </p>
                    </div>

                    {/* Post image */}
                    {post.imageUrl ? (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="max-h-[600px] w-full object-contain"
                            />
                        </div>
                    ) : null}

                    {/* Post information */}
                    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 text-sm text-slate-500">
                        <span>
                            Likes {post.likes ?? 0}
                        </span>

                        <span>
                            Replies {post.replies?.length ?? 0}
                        </span>

                        <span>
                            {post.createdAt}
                        </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                        {status}
                    </p>
                </article>

                {/* Reply form */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">
                        Reply
                    </h2>

                    <textarea
                        value={reply}
                        onChange={(event) =>
                            setReply(event.target.value)
                        }
                        rows={4}
                        placeholder="Write a reply"
                        className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />

                    <div className="mt-4 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void submitReply()}
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                            Send reply
                        </button>

                        <Link
                            href="/"
                            className="text-sm font-semibold text-sky-600 hover:underline"
                        >
                            Back to home
                        </Link>
                    </div>
                </section>

                {/* Replies */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Replies
                        </h2>

                        <span className="text-sm text-slate-500">
                            {post.replies?.length ?? 0}
                        </span>
                    </div>

                    <div className="mt-4 space-y-3">
                        {(post.replies || []).length > 0 ? (
                            post.replies?.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl bg-slate-50 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <AuthorAvatar
                                            name={item.authorName}
                                            username={item.authorUsername}
                                            avatarUrl={item.authorAvatarUrl}
                                            size="sm"
                                        />

                                        <div>
                                            {item.authorUsername ? (
                                                <Link
                                                    href={`/profile/${item.authorUsername}`}
                                                    className="text-sm font-semibold text-slate-700 hover:text-sky-600"
                                                >
                                                    {item.authorName ||
                                                        "Anonymous"}
                                                </Link>
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {item.authorName ||
                                                        "Anonymous"}
                                                </p>
                                            )}

                                            <p className="text-xs text-slate-500">
                                                {item.createdAt}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                        {item.content}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="py-6 text-center text-sm text-slate-500">
                                No replies yet.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}