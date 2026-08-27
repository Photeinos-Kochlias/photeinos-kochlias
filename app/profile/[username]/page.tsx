import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { loadAuthorProfiles, serializePosts } from "@/lib/post-display";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileOverview } from "../../../component/ui/blog/ProfileOverview";
import type { CurrentUser, Profile } from "../../../component/ui/blog/types";

function toProfile(document: {
    userId?: string;
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    followers?: string[];
    following?: string[];
}): Profile {
    return {
        userId: document.userId || "",
        username: document.username,
        email: document.email,
        displayName: document.displayName || "Anonymous",
        bio: document.bio || "",
        avatarUrl: document.avatarUrl || "",
        isPublic: document.isPublic ?? true,
        followers: Array.isArray(document.followers)
            ? document.followers
            : [],
        following: Array.isArray(document.following)
            ? document.following
            : [],
    };
}

async function getProfile(username: string) {
    const decodedUsername = decodeURIComponent(username);
    const client = await getMongoClient();
    const db = client.db(getDatabaseName());

    return db.collection("profiles").findOne({
        $or: [
            { username: decodedUsername },
            { username },
            { userId: decodedUsername },
            { email: decodedUsername },
        ],
    });
}

async function getPostsByAuthor(
    userId: string,
    username: string,
    email: string | undefined,
    isOwner: boolean,
) {
    const client = await getMongoClient();
    const db = client.db(getDatabaseName());

    const filters = [];
    if (userId) {
        filters.push({ authorId: userId });
    }
    if (username) {
        filters.push({ authorUsername: username });
    }
    if (email) {
        filters.push({ authorEmail: email });
    }

    const posts = await db
        .collection("posts")
        .find(filters.length > 0 ? { $or: filters } : {})
        .sort({
            id: -1,
        })
        .toArray();

    const visiblePosts = posts.filter((post) => {
        if (isOwner) {
            return true;
        }
        return post.visibility === "public";
    });

    const profiles = await loadAuthorProfiles(
        db.collection("profiles"),
        visiblePosts,
    );

    return serializePosts(visiblePosts, profiles);
}

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const session = await auth();

    const profileDocument = await getProfile(username);

    if (!profileDocument) {
        notFound();
    }

    const profile = toProfile({
        userId:
            typeof profileDocument.userId === "string"
                ? profileDocument.userId
                : "",
        username:
            typeof profileDocument.username === "string"
                ? profileDocument.username
                : undefined,
        email:
            typeof profileDocument.email === "string"
                ? profileDocument.email
                : undefined,
        displayName:
            typeof profileDocument.displayName === "string"
                ? profileDocument.displayName
                : undefined,
        bio:
            typeof profileDocument.bio === "string"
                ? profileDocument.bio
                : undefined,
        avatarUrl:
            typeof profileDocument.avatarUrl === "string"
                ? profileDocument.avatarUrl
                : undefined,
        isPublic:
            typeof profileDocument.isPublic === "boolean"
                ? profileDocument.isPublic
                : undefined,
        followers: Array.isArray(profileDocument.followers)
            ? profileDocument.followers.filter(
                  (value): value is string => typeof value === "string",
              )
            : [],
        following: Array.isArray(profileDocument.following)
            ? profileDocument.following.filter(
                  (value): value is string => typeof value === "string",
              )
            : [],
    });

    const sessionEmail = session?.user?.email || "";
    const sessionUserId = session?.user?.id || "";

    const isOwner =
        (sessionEmail !== "" && sessionEmail === profile.email) ||
        (sessionUserId !== "" && sessionUserId === profile.userId);

    const currentUser: CurrentUser | null =
        isOwner && session?.user?.email
            ? {
                  id: sessionUserId || profile.userId,
                  name:
                      session.user.name ||
                      profile.displayName ||
                      session.user.email,
                  email: session.user.email,
              }
            : session?.user?.email
              ? {
                    id: sessionUserId || session.user.email,
                    name: session.user.name || session.user.email,
                    email: session.user.email,
                }
              : null;

    const currentUserId = sessionUserId || sessionEmail;
    const isFollowing =
        currentUserId !== "" &&
        (profile.followers || []).includes(currentUserId);

    const posts = await getPostsByAuthor(
        profile.userId,
        profile.username || username,
        profile.email,
        isOwner,
    );

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <ProfileOverview
                    profile={profile}
                    isOwner={isOwner}
                    currentUser={currentUser}
                    isFollowing={isFollowing}
                />

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
                                            Like {post.likes || 0}
                                        </span>

                                        <span>
                                            Reply{" "}
                                            {post.replies?.length || 0}
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
