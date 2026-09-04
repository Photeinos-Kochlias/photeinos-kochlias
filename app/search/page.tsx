"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthorAvatar } from "@/component/ui/blog/AuthorAvatar";
import type { Post, Profile } from "@/component/ui/blog/types";

type SearchType = "posts" | "users";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState("");
    const [type, setType] = useState<SearchType>("posts");
    const [posts, setPosts] = useState<Post[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!submittedQuery) {
            return;
        }

        const loadResults = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/search?q=${encodeURIComponent(submittedQuery)}&type=${type}`,
                    { cache: "no-store" },
                );
                if (!response.ok) {
                    return;
                }

                const data = (await response.json()) as {
                    results: Post[] | Profile[];
                };
                if (type === "posts") {
                    setPosts(data.results as Post[]);
                } else {
                    setUsers(data.results as Profile[]);
                }
            } finally {
                setLoading(false);
            }
        };

        void loadResults();
    }, [submittedQuery, type]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmittedQuery(query.trim());
    };

    const resultCount = type === "posts" ? posts.length : users.length;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
                <header className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Explore
                        </p>
                        <h1 className="text-3xl font-semibold">Search MURMUR</h1>
                    </div>
                    <Link
                        href="/"
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                        Back home
                    </Link>
                </header>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
                        <label htmlFor="search-query" className="sr-only">Search</label>
                        <input
                            id="search-query"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search posts, users, or username"
                            className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-sky-500 focus:ring-2"
                        />
                        <button
                            type="submit"
                            className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700"
                        >
                            Search
                        </button>
                    </form>

                    <div className="mt-4 flex rounded-full border border-slate-300 bg-slate-50 p-1 sm:w-fit">
                        {(["posts", "users"] as SearchType[]).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setType(option)}
                                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium capitalize sm:flex-none ${type === option ? "bg-sky-600 text-white" : "text-slate-700"}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            {submittedQuery ? `Results for “${submittedQuery}”` : "Search results"}
                        </h2>
                        {submittedQuery ? <span className="text-sm text-slate-500">{resultCount}</span> : null}
                    </div>

                    {loading ? <p className="mt-6 text-sm text-slate-500">Searching...</p> : null}
                    {!loading && submittedQuery && resultCount === 0 ? (
                        <p className="mt-6 text-sm text-slate-500">No results found.</p>
                    ) : null}

                    {type === "posts" && !loading ? (
                        <div className="mt-5 space-y-3">
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/post/${post.id}`}
                                    className="block rounded-2xl border border-slate-200 p-4 transition hover:border-sky-300 hover:bg-sky-50"
                                >
                                    <p className="text-xs font-medium text-slate-500">@{post.authorUsername}</p>
                                    <h3 className="mt-1 font-semibold">{post.title || "Untitled post"}</h3>
                                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.content}</p>
                                </Link>
                            ))}
                        </div>
                    ) : null}

                    {type === "users" && !loading ? (
                        <div className="mt-5 space-y-3">
                            {users.map((user) => (
                                <Link
                                    key={user.userId}
                                    href={`/profile/${user.username || user.userId}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-sky-300 hover:bg-sky-50"
                                >
                                    <AuthorAvatar name={user.displayName} username={user.username} avatarUrl={user.avatarUrl} />
                                    <span className="min-w-0">
                                        <strong className="block truncate">{user.displayName}</strong>
                                        <span className="text-sm text-slate-500">@{user.username || user.userId}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}