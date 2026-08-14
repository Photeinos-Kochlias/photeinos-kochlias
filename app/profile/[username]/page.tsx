import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "../../../component/ui/blog/FollowButton";
import type { Post } from "../../../component/ui/blog/types";

async function getProfile(username: string) {
    const client = await getMongoClient();
    const db = client.db(getDatabaseName());

    return db.collection("profiles").findOne({
        username,
    });
}

async function getPostsByAuthor(
    username: string,
): Promise<Post[]> {
    const client = await getMongoClient();
    const db = client.db(getDatabaseName());

    return db
        .collection<Post>("posts")
        .find({
            authorUsername: username,
            visibility: "public",
        })
        .sort({
            createdAt: -1,
        })
        .toArray();
}

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const session = await auth();

    const profile = await getProfile(username);

    if (!profile) {
        notFound();
    }

    const sessionEmail = session?.user?.email || "";

    const isOwner =
        sessionEmail !== "" &&
        sessionEmail === profile.email;

    const currentUserId =
        session?.user?.id || sessionEmail || "guest";

    const following = Array.isArray(profile.following)
        ? profile.following
        : [];

    const isFollowing =
        following.includes(currentUserId);

    const posts = await getPostsByAuthor(username);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">

                {/* =========================
                    Profile
                ========================= */}

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">

                        <div className="flex items-start gap-4">

                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-2xl font-semibold text-white">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    profile.displayName
                                        .charAt(0)
                                        .toUpperCase()
                                )}
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-sky-600">
                                    Profile
                                </p>

                                <h1 className="mt-1 text-3xl font-semibold">
                                    {profile.displayName}
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    @{profile.username}
                                </p>

                                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                    {profile.bio ||
                                        "No bio yet."}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                                    <span className="rounded-full bg-slate-100 px-3 py-1">
                                        Followers{" "}
                                        {Array.isArray(
                                            profile.followers,
                                        )
                                            ? profile.followers
                                                  .length
                                            : 0}
                                    </span>

                                    <span className="rounded-full bg-slate-100 px-3 py-1">
                                        Posts{" "}
                                        {posts.length}
                                    </span>

                                    <span className="rounded-full bg-slate-100 px-3 py-1">
                                        {profile.isPublic
                                            ? "Public"
                                            : "Private"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {!isOwner ? (
                                <FollowButton
                                    targetUserId={
                                        profile.userId
                                    }
                                    targetUsername={
                                        profile.username
                                    }
                                    initialFollowing={
                                        isFollowing
                                    }
                                    initialFollowers={
                                        Array.isArray(
                                            profile.followers,
                                        )
                                            ? profile
                                                  .followers
                                                  .length
                                            : 0
                                    }
                                />
                            ) : (
                                <Link
                                    href="/"
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    Edit profile
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* =========================
                    Posts
                ========================= */}

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-sky-600">
                                Posts
                            </p>

                            <h2 className="mt-1 text-2xl font-semibold">
                                {isOwner
                                    ? "Your posts"
                                    : `${profile.displayName}'s posts`}
                            </h2>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                            {posts.length}
                        </span>
                    </div>

                    <div className="mt-6 space-y-4">
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/post/${post.id}`}
                                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">

                                            {post.title ? (
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    {post.title}
                                                </h3>
                                            ) : null}

                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                                {post.content}
                                            </p>
                                        </div>

                                        <span className="shrink-0 text-sm text-slate-500">
                                            {post.createdAt}
                                        </span>
                                    </div>

                                    {post.imageUrl ? (
                                        <img
                                            src={post.imageUrl}
                                            alt={
                                                post.title ||
                                                "Post image"
                                            }
                                            className="mt-4 h-52 w-full rounded-2xl object-cover"
                                        />
                                    ) : null}

                                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                                        <span>
                                            Like{" "}
                                            {post.likes || 0}
                                        </span>

                                        <span>
                                            Reply{" "}
                                            {post.replies
                                                ?.length || 0}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="rounded-2xl bg-slate-50 p-8 text-center">
                                <p className="text-sm text-slate-500">
                                    No posts yet.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* =========================
                    Back
                ========================= */}

                <div>
                    <Link
                        href="/"
                        className="text-sm font-medium text-sky-600 hover:text-sky-500"
                    >
                        ← Back to timeline
                    </Link>
                </div>
            </div>
        </main>
    );
}