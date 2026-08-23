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
        handleUpdate,
        handleDelete,
        handleReact,
        currentUser,
        refreshCurrentUser,
    } = useBlogPosts();

    const [profile, setProfile] =
        useState<Profile | null>(null);

    const [sessionEmail, setSessionEmail] =
        useState<string | null>(null);

    const [view, setView] = useState<
        "timeline" | "profile" | "compose"
    >("timeline");

    const [showProfileEditor, setShowProfileEditor] =
        useState(false);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const composeRef =
        useRef<HTMLDivElement | null>(null);

    const router = useRouter();

    /*
     * =========================
     * Profile
     * =========================
     */

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        let cancelled = false;

        const loadProfile = async () => {
            try {
                const response = await fetch(
                    `/api/profile?userId=${currentUser.id}`,
                    {
                        cache: "no-store",
                    },
                );

                if (!response.ok) {
                    return;
                }

                const data =
                    (await response.json()) as Profile;

                if (!cancelled) {
                    setProfile(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        void loadProfile();

        return () => {
            cancelled = true;
        };
    }, [currentUser]);

    /*
     * =========================
     * Authentication
     * =========================
     */

    useEffect(() => {
        let cancelled = false;

        const checkAuthentication = async () => {
            if (currentUser?.email) {
                if (!cancelled) {
                    setSessionEmail(
                        currentUser.email,
                    );
                }

                return;
            }

            const storedEmail =
                localStorage.getItem(
                    "blog-user-email",
                );

            if (storedEmail) {
                if (!cancelled) {
                    setSessionEmail(storedEmail);
                }

                return;
            }

            if (!cancelled) {
                router.replace("/login");
            }
        };

        void checkAuthentication();

        return () => {
            cancelled = true;
        };
    }, [currentUser, router]);

    /*
     * =========================
     * Timeline scroll
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
            sessionStorage.getItem(
                "blog-timeline-scroll",
            ) || "0",
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

        window.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true,
            },
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            );
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
        localStorage.removeItem(
            "blog-user-email",
        );

        setSessionEmail(null);

        router.replace("/login");
    };

    /*
     * =========================
     * Profile edit
     * =========================
     */

    const handleProfileEdit = () => {
        setShowProfileEditor(true);
    };

    /*
     * =========================
     * Profile saved
     * =========================
     */

    const handleProfileSaved = async () => {
        if (!currentUser) {
            return;
        }

        /*
         * Profile APIから最新プロフィールを取得
         */

        try {
            const response = await fetch(
                `/api/profile?userId=${currentUser.id}`,
                {
                    cache: "no-store",
                },
            );

            if (response.ok) {
                const data =
                    (await response.json()) as Profile;

                setProfile(data);
            }

            /*
             * /api/auth/me も更新
             *
             * これが重要。
             * TimelineのauthorName等を更新する。
             */
            await refreshCurrentUser();

            /*
             * 編集モード終了
             */
            setShowProfileEditor(false);

            /*
             * タイムラインも最新状態にする
             */
            setView("profile");
        } catch (error) {
            console.error(error);
        }
    };

    /*
     * =========================
     * New post success
     * =========================
     */

    useEffect(() => {
        if (!status.includes("successfully created")) {
            return;
        }

        setSuccessMessage(
            "New post successfully created.",
        );

        const timer = window.setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [status]);

    /*
     * =========================
     * Render
     * =========================
     */

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">

                {/* Success banner */}

                {successMessage ? (
                    <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 shadow-lg">
                            <p className="text-sm font-semibold text-emerald-700">
                                {successMessage}
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* =========================
                    Header
                ========================= */}

                <header className="sticky top-0 z-30 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                                Home
                            </p>

                            <h1 className="text-2xl font-semibold">
                                MURMUR
                            </h1>
                        </div>

                        {sessionEmail ? (
                            <div className="flex flex-wrap items-center gap-2">

                                <div className="flex rounded-full border border-slate-300 bg-slate-50 p-1">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setView("timeline")
                                        }
                                        className={`rounded-full px-3 py-2 text-sm font-medium ${
                                            view ===
                                            "timeline"
                                                ? "bg-slate-900 text-white"
                                                : "text-slate-700"
                                        }`}
                                    >
                                        Timeline
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setView("profile")
                                        }
                                        className={`rounded-full px-3 py-2 text-sm font-medium ${
                                            view ===
                                            "profile"
                                                ? "bg-slate-900 text-white"
                                                : "text-slate-700"
                                        }`}
                                    >
                                        Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleCreatePost
                                        }
                                        className={`rounded-full px-3 py-2 text-sm font-medium ${
                                            view ===
                                            "compose"
                                                ? "bg-slate-900 text-white"
                                                : "text-slate-700"
                                        }`}
                                    >
                                        NewPost
                                    </button>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleSignOut
                                    }
                                    className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : null}
                    </div>
                </header>

                {/* =========================
                    Hero
                ========================= */}

                <BlogHero
                    postCount={posts.length}
                />

                {/* =========================
                    Profile
                ========================= */}

                {view === "profile" &&
                currentUser ? (
                    <section className="space-y-8">

                        <ProfilePanel
                            currentUser={currentUser}
                            profile={profile}
                            editing={
                                showProfileEditor
                            }
                            onEdit={
                                handleProfileEdit
                            }
                            onProfileSaved={
                                handleProfileSaved
                            }
                        />

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="mb-6">
                                <p className="text-sm font-semibold text-sky-600">
                                    Your posts
                                </p>

                                <h2 className="mt-2 text-2xl font-semibold">
                                    Posts
                                </h2>
                            </div>

                            <BlogPostList
                                posts={posts
                                    .filter(
                                        (post) =>
                                            post.authorId ===
                                            currentUser.id,
                                    )
                                    .sort(
                                        (
                                            a,
                                            b,
                                        ) =>
                                            new Date(
                                                b.createdAt,
                                            ).getTime() -
                                            new Date(
                                                a.createdAt,
                                            ).getTime(),
                                    )}
                                currentUserId={
                                    currentUser.id
                                }
                                onUpdate={
                                    handleUpdate
                                }
                                onDelete={
                                    handleDelete
                                }
                                onReact={
                                    handleReact
                                }
                            />
                        </section>
                    </section>
                ) : null}

                {/* =========================
                    Compose
                ========================= */}

                {view === "compose" ? (
                    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

                        <div
                            ref={composeRef}
                            className="space-y-8"
                        >
                            <BlogPostForm
                                title={title}
                                content={content}
                                imageUrl={imageUrl}
                                visibility={
                                    visibility
                                }
                                editId={editId}
                                status={status}
                                onTitleChange={
                                    setTitle
                                }
                                onContentChange={
                                    setContent
                                }
                                onImageUrlChange={
                                    setImageUrl
                                }
                                onVisibilityChange={
                                    setVisibility
                                }
                                onSubmit={
                                    handleSubmit
                                }
                                onCancel={
                                    resetForm
                                }
                            />
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">
                                Create a new post
                            </h2>

                            <p className="mt-3 text-sm text-slate-600">
                                Write something and
                                publish it to the
                                timeline.
                            </p>
                        </div>

                    </section>
                ) : null}

                {/* =========================
                    Timeline
                ========================= */}

                {view === "timeline" ? (
                    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

                        <div className="space-y-8">
                            <BlogPostList
                                posts={posts}
                                currentUserId={
                                    currentUser?.id ||
                                    null
                                }
                                onUpdate={
                                    handleUpdate
                                }
                                onDelete={
                                    handleDelete
                                }
                                onReact={
                                    handleReact
                                }
                            />
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">
                                Timeline
                            </h2>

                            <p className="mt-3 text-sm text-slate-600">
                                Browse public posts
                                and open any thread
                                to reply.
                            </p>
                        </div>

                    </section>
                ) : null}

            </div>
        </main>
    );
}