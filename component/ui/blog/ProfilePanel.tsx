"use client";

import {
    useEffect,
    useState,
} from "react";

import type {
    CurrentUser,
    Profile,
} from "./types";

type ProfilePanelProps = {
    currentUser: CurrentUser | null;
    profile: Profile | null;

    editing: boolean;

    onEdit: () => void;

    onProfileSaved: () => Promise<void>;
};

export function ProfilePanel({
    currentUser,
    profile,
    editing,
    onEdit,
    onProfileSaved,
}: ProfilePanelProps) {
    const [
        displayName,
        setDisplayName,
    ] = useState("");

    const [
        username,
        setUsername,
    ] = useState("");

    const [
        bio,
        setBio,
    ] = useState("");

    const [
        avatarUrl,
        setAvatarUrl,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState("");

    useEffect(() => {
        if (!profile) {
            return;
        }

        setDisplayName(
            profile.displayName || "",
        );

        setUsername(
            profile.username || "",
        );

        setBio(
            profile.bio || "",
        );

        setAvatarUrl(
            profile.avatarUrl || "",
        );
    }, [profile]);

    const handleSave = async () => {
        if (!currentUser) {
            return;
        }

        try {
            setStatus(
                "Saving...",
            );

            const response =
                await fetch(
                    "/api/profile",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            userId:
                                currentUser.id,

                            email:
                                currentUser.email,

                            displayName:
                                displayName.trim(),

                            username:
                                username.trim(),

                            bio:
                                bio.trim(),

                            avatarUrl:
                                avatarUrl.trim(),

                            isPublic:
                                profile?.isPublic ??
                                true,
                        }),
                    },
                );

            const data =
                await response
                    .json()
                    .catch(
                        () => null,
                    );

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        "Failed to save profile.",
                );
            }

            setStatus(
                "Profile updated.",
            );

            await onProfileSaved();
        } catch (error) {
            console.error(error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Failed to save profile.",
            );
        }
    };

    if (!currentUser) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                Please sign in.
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-sky-600">
                        Profile
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                        {profile?.displayName ||
                            currentUser.name}
                    </h2>

                    {profile?.username ? (
                        <p className="mt-1 text-sm text-slate-500">
                            @{profile.username}
                        </p>
                    ) : null}
                </div>

                {!editing ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                        Edit
                    </button>
                ) : null}
            </div>

            {!editing ? (
                <div className="mt-6">
                    <p className="text-sm leading-7 text-slate-600">
                        {profile?.bio ||
                            "No bio yet."}
                    </p>
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                            Display name
                        </span>

                        <input
                            value={displayName}
                            onChange={(event) =>
                                setDisplayName(
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                            Username
                        </span>

                        <input
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                            Bio
                        </span>

                        <textarea
                            value={bio}
                            onChange={(event) =>
                                setBio(
                                    event.target.value,
                                )
                            }
                            rows={5}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                            Avatar URL
                        </span>

                        <input
                            value={avatarUrl}
                            onChange={(event) =>
                                setAvatarUrl(
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        />
                    </label>

                    {status ? (
                        <p className="text-sm text-slate-500">
                            {status}
                        </p>
                    ) : null}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                void handleSave()
                            }
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            onClick={onEdit}
                            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}