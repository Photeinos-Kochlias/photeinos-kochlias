"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BlogHero } from "./BlogHero";
import { BlogPostForm } from "./BlogPostForm";
import { BlogPostList } from "./BlogPostList";
import { ProfilePanel } from "./ProfilePanel";
import { useBlogPosts } from "./useBlogPosts";
import type { Profile } from "./types";

export function BlogPage() {
    const {
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
    } = useBlogPosts();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [sessionEmail, setSessionEmail] = useState<string | null>(null);
    const [view, setView] = useState<"timeline" | "profile" | "compose">("timeline");
    const composeRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        const loadProfile = async () => {
            if (!currentUser) {
                setProfile(null);
                return;
            }

            const response = await fetch(`/api/profile?userId=${currentUser.id}`);
            if (response.ok) {
                const data = (await response.json()) as Profile;
                setProfile(data);
            }
        };

        void loadProfile();
    }, [currentUser]);

    useEffect(() => {
        const storedEmail = typeof window !== "undefined" ? localStorage.getItem("blog-user-email") : null;

        if (currentUser?.email) {
            setSessionEmail(currentUser.email);
            return;
        }

        if (storedEmail) {
            setSessionEmail(storedEmail);
            return;
        }

        router.replace("/login");
    }, [currentUser, router]);

    useEffect(() => {
        if (view !== "timeline") {
            sessionStorage.setItem("blog-timeline-scroll", String(window.scrollY || 0));
            return;
        }

        const savedScroll = Number(sessionStorage.getItem("blog-timeline-scroll") || "0");
        requestAnimationFrame(() => {
            window.scrollTo({ top: savedScroll, behavior: "auto" });
        });
    }, [view]);

    useEffect(() => {
        if (view !== "timeline") {
            return;
        }

        const handleScroll = () => {
            sessionStorage.setItem("blog-timeline-scroll", String(window.scrollY || 0));
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [view]);

    const handleCreatePost = () => {
        setView("compose");
        requestAnimationFrame(() => {
            composeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <header className="sticky top-0 z-30 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Home</p>
                            <h1 className="text-2xl font-semibold text-slate-900">Post Anything</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {sessionEmail ? (
                                <>
                                    <div className="flex rounded-full border border-slate-300 bg-slate-50 p-1">
                                        <button type="button" onClick={() => setView("timeline")} className={`rounded-full px-3 py-2 text-sm font-medium ${view === "timeline" ? "bg-slate-900 text-white" : "text-slate-700"}`}>
                                            Timeline
                                        </button>
                                        <button type="button" onClick={() => setView("profile")} className={`rounded-full px-3 py-2 text-sm font-medium ${view === "profile" ? "bg-slate-900 text-white" : "text-slate-700"}`}>
                                            Profile
                                        </button>
                                        <button type="button" onClick={handleCreatePost} className={`rounded-full px-3 py-2 text-sm font-medium ${view === "compose" ? "bg-slate-900 text-white" : "text-slate-700"}`}>
                                            NewPost
                                        </button>
                                    </div>
                                    <button type="button" onClick={() => {
                                        localStorage.removeItem("blog-user-email");
                                        setSessionEmail(null);
                                        router.replace("/login");
                                    }} className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <button type="button" onClick={() => router.push("/login")} className="rounded-full bg-sky-600 px-3 py-2 text-sm font-medium text-white">
                                    Sign in with email
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <BlogHero postCount={posts.length} />

                {view === "profile" ? (
                    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-8">
                            <ProfilePanel
                                currentUser={currentUser}
                                profile={profile}
                                onProfileSaved={() => {
                                    if (currentUser) {
                                        void fetch(`/api/profile?userId=${currentUser.id}`).then(async (response) => {
                                            if (response.ok) {
                                                const data = (await response.json()) as Profile;
                                                setProfile(data);
                                            }
                                        });
                                    }
                                }}
                            />
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">Your account</h2>
                            <p className="mt-3 text-sm text-slate-600">Your profile is private to your own account. Others can only view public content.</p>
                        </div>
                    </section>
                ) : view === "compose" ? (
                    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-8" ref={composeRef}>
                            <BlogPostForm
                                title={title}
                                content={content}
                                imageUrl={imageUrl}
                                visibility={visibility}
                                editId={editId}
                                status={status}
                                onTitleChange={setTitle}
                                onContentChange={setContent}
                                onImageUrlChange={setImageUrl}
                                onVisibilityChange={setVisibility}
                                onSubmit={handleSubmit}
                                onCancel={resetForm}
                            />
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">Create a new post</h2>
                            <p className="mt-3 text-sm text-slate-600">Use this panel to write a new blog post. Once it is published, it will appear in the timeline.</p>
                        </div>
                    </section>
                ) : (
                    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-8">
                            <BlogPostList
                                posts={posts}
                                currentUserId={currentUser?.id || null}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onReact={handleReact}
                            />
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">Timeline</h2>
                            <p className="mt-3 text-sm text-slate-600">Browse public posts and open any thread to reply.</p>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
