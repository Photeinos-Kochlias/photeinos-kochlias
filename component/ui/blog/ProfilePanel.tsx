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
    const [displayName, setDisplayName] = useState(profile?.displayName || "");
    const [bio, setBio] = useState(profile?.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
    const [isPublic, setIsPublic] = useState(profile?.isPublic ?? true);
    const [status, setStatus] = useState("Profile ready");
    const [followCount, setFollowCount] = useState(0);
    const [profileName, setProfileName] = useState(currentUser?.name || "");
    const router = useRouter();

    useEffect(() => {
        setDisplayName(profile?.displayName || "");
        setBio(profile?.bio || "");
        setAvatarUrl(profile?.avatarUrl || "");
        setIsPublic(profile?.isPublic ?? true);
        setFollowCount(profile?.followers?.length || 0);
        setProfileName(currentUser?.name || profile?.displayName || "");
    }, [currentUser, profile]);

    const saveProfile = async () => {
        if (!currentUser) {
            setStatus("Please sign in first.");
            return;
        }

        const nextDisplayName = displayName.trim() || currentUser.name || "User";

        try {
            const response = await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-blog-user-email": currentUser.email,
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    username:
                        profile?.username ||
                        currentUser.name.toLowerCase().replace(/\s+/g, "-"),
                    email: currentUser.email,
                    displayName: nextDisplayName,
                    bio,
                    avatarUrl,
                    isPublic,
                    followers: profile?.followers || [],
                    following: profile?.following || [],
                }),
            });

            if (!response.ok) {
                throw new Error("Save failed");
            }

            setProfileName(nextDisplayName);
            setStatus("Profile saved");
            onProfileSaved();
        } catch {
            setStatus("Failed to save profile");
        }
    };

    const deleteAccount = async () => {
        if (!currentUser) {
            setStatus("Please sign in first.");
            return;
        }

        const confirmed = window.confirm("Delete this account and all related content?");
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch("/api/auth/delete", {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Delete failed");
            }

            localStorage.removeItem("blog-user-email");
            router.replace("/login");
        } catch {
            setStatus("Failed to delete account");
        }
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-sky-600">
                        Profile
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">My profile</h2>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">
                        Current user
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                        {profileName || currentUser?.name || "No user selected"}
                    </p>
                    <p className="text-sm text-slate-500">
                        {currentUser?.email || ""}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                        <span className="rounded-full bg-white px-3 py-1">
                            Followers {followCount}
                        </span>
                    </div>
                </div>

                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                        Display name
                    </span>
                    <input
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />
                </label>

                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                        Bio
                    </span>
                    <textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />
                </label>

                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                        Avatar URL
                    </span>
                    <input
                        value={avatarUrl}
                        onChange={(event) => setAvatarUrl(event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={() => setIsPublic((value) => !value)}
                    />
                    Public profile
                </label>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={saveProfile}
                        className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white"
                    >
                        Save profile
                    </button>
                    <button
                        type="button"
                        onClick={deleteAccount}
                        className="rounded-full border border-rose-300 px-5 py-3 font-semibold text-rose-700"
                    >
                        Delete account
                    </button>
                </div>
                <p className="text-sm text-slate-500">{status}</p>
            </div>
        </section>
    );
}

