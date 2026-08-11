"use client";

import { useState } from "react";

export function FollowButton({
    targetUserId,
    targetUsername,
    initialFollowing,
    initialFollowers,
}: {
    targetUserId: string;
    targetUsername?: string;
    initialFollowing: boolean;
    initialFollowers: number;
}) {
    const [following, setFollowing] = useState(initialFollowing);
    const [followers, setFollowers] = useState(initialFollowers);

    const toggleFollow = async () => {
        const response = await fetch("/api/follow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId, targetUsername }),
        });

        if (response.ok) {
            const data = await response.json();
            setFollowing(Boolean(data.following));
            setFollowers(data.followers || followers);
        }
    };

    return (
        <button
            type="button"
            onClick={() => void toggleFollow()}
            className={`rounded-full px-3 py-2 text-sm font-medium ${following ? "bg-slate-900 text-white" : "bg-sky-600 text-white"}`}
        >
            {following ? "Following" : "Follow"} · {followers}
        </button>
    );
}
