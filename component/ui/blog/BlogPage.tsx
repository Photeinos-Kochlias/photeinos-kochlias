"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthorAvatar } from "./AuthorAvatar";
import { BlogHero } from "./BlogHero";
import { BlogPostForm } from "./BlogPostForm";
import { BlogPostList } from "./BlogPostList";
import { NotificationBell } from "./NotificationBell";
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
        handleUpdate,
        handleDelete,
        handleReact,
        currentUser,
        postCreatedMessage,
        setPostCreatedMessage,
    } = useBlogPosts();

    /*
    *===================================
    *POST CREATION BANNER 時間経過で消滅
    *===================================
    */
    useEffect(() => {
        if (!postCreatedMessage) {
            return;
        }

        const timer = window.setTimeout(() => {
            setPostCreatedMessage(null);
        }, 4000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [postCreatedMessage, setPostCreatedMessage]);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [sessionEmail, setSessionEmail] = useState<string | null>(null);

    const [view, setView] = useState<"timeline" | "compose">(
        "timeline",
    );

    const composeRef = useRef<HTMLDivElement | null>(null);

    const router = useRouter();

    /*
     * =========================
     * Profile
     * =========================
     */

    useEffect(() => {
        const loadProfile = async () => {
            if (!currentUser) {
                setProfile(null);
                return;
            }

            try {
                const response = await fetch(
                    `/api/profile?userId=${currentUser.id}`,
                    { cache: "no-store" },
                );

                if (response.ok) {
                    const data = (await response.json()) as Profile;
                    setProfile(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        void loadProfile();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<Profile>;
            if (customEvent.detail) {
                setProfile(customEvent.detail);
            } else {
                void loadProfile();
            }
        };

        const handleFocus = () => {
            void loadProfile();
        };

        window.addEventListener("profile-updated", handleProfileUpdated);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("profile-updated", handleProfileUpdated);
            window.removeEventListener("focus", handleFocus);
        };
    }, [currentUser]);

    /*
     * =========================
     * Authentication
     * =========================
     */

    useEffect(() => {
        const storedEmail =
            typeof window !== "undefined"
                ? localStorage.getItem("blog-user-email")
                : null;

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

    /*
     * =========================
     * Timeline scroll position
     * =========================
     */

    useEffect(() => {
        if (view !== "timeline") {
            sessionStorage.setItem(
                "blog-timeline-scroll",
                String(window.scrollY || 0),
            );

            return;
        }

        const savedScroll = Number(
            sessionStorage.getItem("blog-timeline-scroll") || "0",
        );

        requestAnimationFrame(() => {
            window.scrollTo({
                top: savedScroll,
                behavior: "auto",
            });
        });
    }, [view]);

    useEffect(() => {
        if (view !== "timeline") {
            return;
        }

        const handleScroll = () => {
            sessionStorage.setItem(
                "blog-timeline-scroll",
                String(window.scrollY || 0),
            );
        };

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [view]);

    /*
     * =========================
     * Create post
     * =========================
     */

    const handleCreatePost = () => {
        resetForm();

        setView("compose");

        requestAnimationFrame(() => {
            composeRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    /*
     * =========================
     * Sign out
     * =========================
     */

    const handleSignOut = () => {
        localStorage.removeItem("blog-user-email");
        setSessionEmail(null);
        router.replace("/login");
    };

    const openOwnProfile = () => {
        if (profile?.username) {
            router.push(`/profile/${profile.username}`);
            return;
        }

        if (currentUser?.id) {
            void fetch(`/api/profile?userId=${currentUser.id}`).then(
                async (response) => {
                    if (!response.ok) {
                        return;
                    }

                    const data = (await response.json()) as Profile;
                    setProfile(data);

                    if (data.username) {
                        router.push(`/profile/${data.username}`);
                    }
                },
            );
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            {/*
            //*==============================
            //*POST CREATION BANNER
            //*==============================
             */}
            {postCreatedMessage && (
                <div className="fixed left-1/2 top-6 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-600">
                            ✓
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">
                                Post created
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                {postCreatedMessage}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setPostCreatedMessage(null)}
                            className="text-xl leading-none text-slate-400 transition hover:text-slate-700"
                            aria-label="Close notification"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                {/*
                //*=========================
                //*Header
                //*=========================
                */}

                <header className="sticky top-0 z-30 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Home
                            </p>

                            <h1 className="text-2xl font-semibold text-slate-900">
                                MURMUR
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {sessionEmail ? (
                                <>
                                    <div className="flex rounded-full border border-slate-300 bg-slate-50 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setView("timeline")}
                                            className={`rounded-full px-3 py-2 text-sm font-medium ${
                                                view === "timeline"
                                                    ? "bg-slate-900 text-white"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            Timeline
                                        </button>

                                        <button
                                            type="button"
                                            onClick={openOwnProfile}
                                            className="rounded-full px-3 py-2 text-sm font-medium text-slate-700"
                                        >
                                            Profile
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCreatePost}
                                            className={`rounded-full px-3 py-2 text-sm font-medium ${
                                                view === "compose"
                                                    ? "bg-slate-900 text-white"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            NewPost
                                        </button>
                                    </div>

                                    <NotificationBell userId={currentUser?.id} />

                                    <button
                                        type="button"
                                        onClick={() => router.push("/search")}
                                        className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Search
                                    </button>

                                    {profile?.username ? (
                                        <AuthorAvatar
                                            name={
                                                profile.displayName ||
                                                currentUser?.name
                                            }
                                            username={profile.username}
                                            avatarUrl={profile.avatarUrl}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={openOwnProfile}
                                            aria-label="Open your profile"
                                        >
                                            <AuthorAvatar
                                                name={currentUser?.name}
                                                avatarUrl={profile?.avatarUrl}
                                            />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => router.push("/login")}
                                    className="rounded-full bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                                >
                                    Sign in with email
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/*
                //*=========================
                //*Hero
                //*=========================
                */}

                <BlogHero postCount={posts.length} />

                {/*
                //*=========================
                //*New post
                //*=========================
                */}

                {view === "compose" ? (
                    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div ref={composeRef} className="space-y-8">
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
                            <h2 className="text-xl font-semibold">
                                Create a new post
                            </h2>

                            <p className="mt-3 text-sm text-slate-600">
                                Use this panel to write a new blog post. Once it
                                is published, it will appear in the timeline.
                            </p>
                        </div>
                    </section>
                ) : null}

                {/*
                //*=========================
                //*Timeline
                //*=========================
                */}

                {view === "timeline" ? (
                    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-8">
                            <BlogPostList
                                posts={posts}
                                currentUserId={currentUser?.id || null}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                                onReact={handleReact}
                            />
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">Timeline</h2>

                            <p className="mt-3 text-sm text-slate-600">
                                Browse public posts and open any thread to
                                reply.
                            </p>
                        </div>
                    </section>
                ) : null}
            </div>
        </main>
    );
}
