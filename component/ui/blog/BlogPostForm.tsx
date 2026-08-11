import type { FormEvent } from "react";

type BlogPostFormProps = {
    title: string;
    content: string;
    editId: number | null;
    status: string;
    onTitleChange: (value: string) => void;
    onContentChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
};

export function BlogPostForm({
    title,
    content,
    editId,
    status,
    onTitleChange,
    onContentChange,
    onSubmit,
    onCancel,
}: BlogPostFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
            <div className="mb-6">
                <p className="text-sm font-semibold text-sky-600">
                    {editId ? "Edit" : "Post new"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                    {editId ? "Renew articles" : "Create blogs"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{status}</p>
            </div>

            <label className="mb-4 block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                    タイトル
                </span>
                <input
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="ex) ???"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
            </label>

            <label className="mb-6 block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                    本文
                </span>
                <textarea
                    value={content}
                    onChange={(event) => onContentChange(event.target.value)}
                    placeholder="Write article"
                    rows={8}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
            </label>

            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
                >
                    {editId ? "Renew" : "Post"}
                </button>
                {editId ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        キャンセル
                    </button>
                ) : null}
            </div>
        </form>
    );
}
