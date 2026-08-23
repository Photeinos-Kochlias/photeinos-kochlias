"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CurrentUser, Profile } from "./types";

type ProfilePanelProps = {
    currentUser: CurrentUser | null;
    profile: Profile | null;
    onProfileSaved: () => void;
};

export function ProfilePanel({
    currentUser,
    profile,
    onProfileSaved,
}: ProfilePanelProps) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);

    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const [status, setStatus] = useState("");

    /*
     * profile が変更されたときだけ
     * 編集フォームの初期値を更新
     */
    useEffect(() => {
        if (!profile) {
            return;
        }

        setDisplayName(profile.displayName || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatarUrl || "");
        setIsPublic(profile.isPublic ?? true);
    }, [profile]);

    /*
     * =========================
     * Edit start
     * =========================
     */

    const startEdit = () => {
        if (!profile) {
            return;
        }

        setDisplayName(profile.displayName || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatarUrl || "");
        setIsPublic(profile.isPublic ?? true);

        setStatus("");
        setIsEditing(true);
    };

    /*
     * =========================
     * Cancel
     * =========================
     */

    const cancelEdit = () => {
        if (profile) {
            setDisplayName(profile.displayName || "");
            setBio(profile.bio || "");
            setAvatarUrl(profile.avatarUrl || "");
            setIsPublic(profile.isPublic ?? true);
        }

        setStatus("");
        setIsEditing(false);
    };

    /*
     * =========================
     * Save
     * =========================
     */

    const saveProfile = async () => {
        if (!currentUser) {
            setStatus("Please sign in first.");
            return;
        }

        const nextDisplayName =
            displayName.trim() || currentUser.name || "User";

        try {
            setStatus("Saving...");

            const response = await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    email: currentUser.email,

                    username:
                        profile?.username ||
                        nextDisplayName
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, ""),

                    displayName: nextDisplayName,

                    bio: bio.trim(),

                    avatarUrl: avatarUrl.trim(),

                    isPublic,

                    followers: profile?.followers || [],

                    following: profile?.following || [],
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || "Failed to save profile.");
            }

            setStatus("Profile saved.");

            setIsEditing(false);

            /*
             * BlogPage側でプロフィールと
             * postsを再取得
             */
            onProfileSaved();
        } catch (error) {
            console.error(error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to save profile.",
            );
        }
    };

    /*
     * =========================
     * Delete account
     * =========================
     */

    const deleteAccount = async () => {
        if (!currentUser) {
            setStatus("Please sign in first.");
            return;
        }

        const confirmed = window.confirm(
            "Delete this account and all related content?",
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch("/api/auth/delete", {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete account.");
            }

            localStorage.removeItem("blog-user-email");

            router.replace("/login");
        } catch (error) {
            console.error(error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to delete account.",
            );
        }
    };

    /*
     * =========================
     * Display data
     * =========================
     */

    const profileDisplayName =
        profile?.displayName || currentUser?.name || "Anonymous";

    const initial = profileDisplayName.charAt(0).toUpperCase();

    const followerCount = profile?.followers?.length || 0;

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* =========================
                Header
            ========================= */}

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-2xl font-semibold text-white">
                        {profile?.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt={profileDisplayName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            initial
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-sky-600">
                            Profile
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                            {profileDisplayName}
                        </h2>

                        {profile?.username ? (
                            <p className="mt-1 text-sm text-slate-500">
                                @{profile.username}
                            </p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                Followers {followerCount}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1">
                                {profile?.isPublic ? "Public" : "Private"}
                            </span>
                        </div>
                    </div>
                </div>

                {!isEditing ? (
                    <button
                        type="button"
                        onClick={startEdit}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Edit profile
                    </button>
                ) : null}
            </div>

            {/* =========================
                Normal view
            ========================= */}

            {!isEditing ? (
                <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                            Bio
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                            {profile?.bio || "No bio yet."}
                        </p>
                    </div>

                    {currentUser?.email ? (
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-700">
                                Email
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {currentUser.email}
                            </p>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* =========================
                Edit view
            ========================= */}

            {isEditing ? (
                <div className="mt-6 space-y-5">
                    <div>
                        <p className="text-lg font-semibold text-slate-900">
                            Edit profile
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Change your profile information.
                        </p>
                    </div>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                            Display name
                        </span>

                        <input
                            value={displayName}
                            onChange={(event) =>
                                setDisplayName(event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                            Bio
                        </span>

                        <textarea
                            value={bio}
                            onChange={(event) => setBio(event.target.value)}
                            rows={5}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                            Avatar URL
                        </span>

                        <input
                            value={avatarUrl}
                            onChange={(event) =>
                                setAvatarUrl(event.target.value)
                            }
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        />
                    </label>

                    <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(event) =>
                                setIsPublic(event.target.checked)
                            }
                            className="h-4 w-4"
                        />

                        <span>Public profile</span>
                    </label>

                    {status ? (
                        <p className="text-sm text-slate-500">{status}</p>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => void saveProfile()}
                            className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
                        >
                            Save profile
                        </button>

                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={() => void deleteAccount()}
                            className="rounded-full border border-rose-300 px-5 py-3 font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                            Delete account
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
