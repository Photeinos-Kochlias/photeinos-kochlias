import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "../../../component/ui/blog/FollowButton";
import { Post } from "../../../component/ui/blog/types";

async function getProfile(username: string) {
    const client = await getMongoClient();
    const db = client.db(getDatabaseName());
    return db.collection("profiles").findOne({ username });
}

async function getPostsByAuthor(username: string): Promise<Post[]> {
    const client = await getMongoClient();
    const db = client.db(getDatabaseName());

    return db
        .collection<Post>("posts")
        .find({ authorUsername: username })
        .sort({ createdAt: -1 })
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

    if (!profile) notFound();

    const sessionEmail = session?.user?.email || "";
    const isOwner = sessionEmail === profile.email;
    const currentUserId = sessionEmail || "guest";
    const following = Array.isArray(profile.following) ? profile.following : [];
    const isFollowing = following.includes(currentUserId);
    const posts = await getPostsByAuthor(username);

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                                Profile
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold">
                                {profile.displayName}
                            </h1>
                            <p className="mt-3 max-w-2xl text-slate-300">
                                {profile.bio || "No bio yet."}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isOwner ? (
                                <FollowButton
                                    targetUserId={profile.userId}
                                    targetUsername={profile.username}
                                    initialFollowing={isFollowing}
                                    initialFollowers={
                                        Array.isArray(profile.followers)
                                            ? profile.followers.length
                                            : 0
                                    }
                                />
                            ) : null}
                            {isOwner ? (
                                <Link
                                    href="/"
                                    className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                                >
                                    Edit your posts
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
                        <h2 className="text-xl font-semibold">Recent posts</h2>
                        <div className="mt-4 space-y-3">
                            {posts.length ? (
                                posts.map((post: Post) => (
                                    <div
                                        key={post.id}
                                        className="rounded-xl border border-white/10 bg-slate-800/70 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-semibold">
                                                {post.title}
                                            </h3>
                                            <span className="text-sm text-slate-400">
                                                {post.createdAt}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-300">
                                            {post.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">
                                    No posts yet.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
                        <h2 className="text-xl font-semibold">About</h2>
                        <div className="mt-4 space-y-2 text-sm text-slate-300">
                            <p>Username: {profile.username}</p>
                            <p>Email: {profile.email}</p>
                            <p>
                                Visibility:{" "}
                                {profile.isPublic ? "Public" : "Private"}
                            </p>
                            <p>
                                Followers:{" "}
                                {Array.isArray(profile.followers)
                                    ? profile.followers.length
                                    : 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
