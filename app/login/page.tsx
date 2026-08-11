"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            setError(data.error || "Login failed");
            return;
        }

        localStorage.setItem("blog-user-email", email.trim().toLowerCase());
        router.replace("/");
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl">
                <h1 className="text-2xl font-semibold">Sign in</h1>
                <p className="mt-2 text-sm text-slate-400">Use your email and password to continue.</p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3" required />
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3" required />
                    <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white">Continue</button>
                </form>
                {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
                <p className="mt-4 text-sm text-slate-400">
                    No account yet? <Link href="/register" className="text-sky-400">Create one</Link>
                </p>
            </div>
        </main>
    );
}
