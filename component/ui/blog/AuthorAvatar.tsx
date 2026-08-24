"use client";

import Link from "next/link";

type AuthorAvatarProps = {
    name?: string;
    username?: string;
    avatarUrl?: string;
    size?: "sm" | "md" | "lg";
};

const sizeClass = {
    sm: "h-9 w-9 text-sm",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-lg",
};

export function AuthorAvatar({
    name,
    username,
    avatarUrl,
    size = "md",
}: AuthorAvatarProps) {
    const displayName = name || "Anonymous";
    const initial = displayName.charAt(0).toUpperCase();
    const className = `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 font-semibold text-white ${sizeClass[size]}`;

    const content = avatarUrl ? (
        <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
        />
    ) : (
        initial
    );

    if (!username) {
        return <div className={className}>{content}</div>;
    }

    return (
        <Link
            href={`/profile/${username}`}
            onClick={(event) => {
                event.stopPropagation();
            }}
            className={`${className} transition hover:opacity-80`}
            aria-label={`${displayName}'s profile`}
        >
            {content}
        </Link>
    );
}
