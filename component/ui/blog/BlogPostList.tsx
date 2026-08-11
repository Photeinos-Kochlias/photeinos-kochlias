import type { Post } from "./types";

type BlogPostListProps = {
    posts: Post[];
    onEdit: (post: Post) => void;
    onDelete: (postId: number) => void;
};

export function BlogPostList({ posts, onEdit, onDelete }: BlogPostListProps) {
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
                    {posts.length}posts
                </span>
            </div>

            <div className="space-y-4">
                {posts.map((post) => (
                    <article
                        key={post.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {post.title}
                            </h3>
                            <span className="text-sm text-slate-500">
                                {post.createdAt}
                            </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-700">
                            {post.content}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onEdit(post)}
                                className="rounded-full bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                            >
                                edit
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(post.id)}
                                className="rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                            >
                                delete
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
