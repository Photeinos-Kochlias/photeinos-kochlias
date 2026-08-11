type BlogHeroProps = {
    postCount: number;
};

export function BlogHero({ postCount }: BlogHeroProps) {
    return (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                        Home
                    </p>
                    <h1 className="text-4xl font-bold sm:text-5xl">
                        MURMUR
                    </h1>
                    <p className="text-lg leading-8 text-slate-300">
                        Say anything you want lol.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
                    <p className="text-sm text-slate-300">Articles</p>
                    <p className="mt-2 text-3xl font-semibold">{postCount}</p>
                </div>
            </div>
        </section>
    );
}
