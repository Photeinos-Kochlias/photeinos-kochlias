import Link from "next/link";
import type { Post } from "./types";

type BlogPostListProps = {
    posts: Post[];
    currentUserId: string | null;
    onEdit: (post: Post) => void;
    onDelete: (postId: number) => void;
    onReact: (postId: number) => void;
};

export function BlogPostList({
    posts,
    currentUserId,
    onEdit,
    onDelete,
    onReact,
}: BlogPostListProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-sky-600">
                        Latest article
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">Posts</h2>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {posts.length} posts
                </span>
            </div>

            <div className="space-y-4">
                {posts.map((post) => (
                    <article
                        key={post.id}
                        onClick={() => {
                            window.location.href = `/post/${post.id}`;
                        }}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                    {(post.authorName || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {post.title}
                                    </h3>

                                    <p className="text-sm text-slate-600">
                                        {post.authorName || "Anonymous"}
                                    </p>
                                </div>
                            </div>

                            <span className="text-sm text-slate-500">
                                {post.createdAt}
                            </span>
                        </div>

                        <p className="mt-2 text-sm leading-7 text-slate-700">
                            {post.content}
                        </p>

                        {post.imageUrl ? (
                            <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="mt-4 h-48 w-full rounded-2xl object-cover"
                            />
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            {post.authorUsername ? (
                                <Link
                                    href={`/profile/${post.authorUsername}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                    }}
                                    className="text-sky-600 underline"
                                >
                                    {post.authorUsername}
                                </Link>
                            ) : null}

                            <span>公開: {post.visibility || "public"}</span>
                            <span>いいね: {post.likes || 0}</span>
                            <span>返信: {post.replies?.length || 0}</span>
                        </div>

                        <div
                            className="mt-4 flex flex-wrap gap-2"
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            {currentUserId &&
                            post.authorId === currentUserId ? (
                                <button
                                    type="button"
                                    onClick={() => onEdit(post)}
                                    className="rounded-full bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                                >
                                    edit
                                </button>
                            ) : null}

                            <Link
                                href={`/post/${post.id}`}
                                className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                reply
                            </Link>

                            <button
                                type="button"
                                onClick={() => onReact(post.id)}
                                className="rounded-full bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
                            >
                                like
                            </button>

                            {currentUserId &&
                            post.authorId === currentUserId ? (
                                <button
                                    type="button"
                                    onClick={() => onDelete(post.id)}
                                    className="rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                                >
                                    delete
                                </button>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
