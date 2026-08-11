"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, displayName }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            setError(data.error || "Registration failed");
            return;
        }

        localStorage.setItem("blog-user-email", email.trim().toLowerCase());
        router.replace("/");
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl">
                <h1 className="text-2xl font-semibold">Create account</h1>
                <p className="mt-2 text-sm text-slate-400">Register with email and password.</p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3" required />
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3" required />
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3" required />
                    <button type="submit" className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white">Register</button>
                </form>
                {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
                <p className="mt-4 text-sm text-slate-400">
                    Already have an account? <Link href="/login" className="text-sky-400">Login</Link>
                </p>
            </div>
        </main>
    );
}
