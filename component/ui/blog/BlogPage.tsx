"use client";

import { BlogHero } from "./BlogHero";
import { BlogPostForm } from "./BlogPostForm";
import { BlogPostList } from "./BlogPostList";
import { useBlogPosts } from "./useBlogPosts";

export function BlogPage() {
    const {
        title,
        setTitle,
        content,
        setContent,
        posts,
        editId,
        status,
        resetForm,
        handleSubmit,
        handleEdit,
        handleDelete,
    } = useBlogPosts();

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <BlogHero postCount={posts.length} />

                <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <BlogPostForm
                        title={title}
                        content={content}
                        editId={editId}
                        status={status}
                        onTitleChange={setTitle}
                        onContentChange={setContent}
                        onSubmit={handleSubmit}
                        onCancel={resetForm}
                    />

                    <BlogPostList
                        posts={posts}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </section>
            </div>
        </main>
    );
}
