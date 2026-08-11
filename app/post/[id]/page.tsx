"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Post, PostReply } from "@/component/ui/blog/types";

export default function PostDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [reply, setReply] = useState("");
    const [status, setStatus] = useState("Loading...");

    useEffect(() => {
        const loadPost = async () => {
            const response = await fetch(`/api/posts/${params.id}`);
            if (!response.ok) {
                setStatus("Failed to load post");
                return;
            }
            const data = (await response.json()) as Post;
            setPost(data);
            setStatus("Ready to reply");
        };

        void loadPost();
    }, [params.id]);

    const submitReply = async () => {
        if (!reply.trim() || !post) {
            return;
        }

        const response = await fetch(`/api/posts/${post.id}/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: reply.trim() }),
        });

        if (!response.ok) {
            setStatus("Failed to add reply");
            return;
        }

        const nextReply = (await response.json()) as PostReply;
        setPost((current) => current ? ({ ...current, replies: [...(current.replies || []), nextReply] }) : current);
        setReply("");
        setStatus("Reply added");
    };

    if (!post) {
        return (
            <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <p>{status}</p>
                    <button type="button" onClick={() => router.back()} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                        Back
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-sky-600">Post thread</p>
                            <h1 className="text-2xl font-semibold">{post.title}</h1>
                        </div>
                        <button type="button" onClick={() => router.back()} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                            Back
                        </button>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-600">{post.authorName || "Anonymous"}</p>
                        <p className="mt-2 whitespace-pre-wrap text-slate-800">{post.content}</p>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">{status}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Reply</h2>
                    <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Write a reply" />
                    <div className="mt-4 flex items-center gap-3">
                        <button type="button" onClick={submitReply} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Send reply</button>
                        <Link href="/" className="text-sm font-semibold text-sky-600">Back to home</Link>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Replies</h2>
                    <div className="mt-4 space-y-3">
                        {(post.replies || []).map((item) => (
                            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-700">{item.authorName || "Anonymous"}</p>
                                <p className="mt-2 text-sm text-slate-700">{item.content}</p>
                                <p className="mt-2 text-xs text-slate-500">{item.createdAt}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
