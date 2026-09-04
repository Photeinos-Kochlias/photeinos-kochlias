"use client";

import { useCallback, useEffect, useState } from "react";

type Notification = {
    id: string;
    actorName: string;
    type: "follow" | "like" | "reply" | "post";
    postId?: number;
    createdAt: string;
    readAt: string | null;
};

const notificationText: Record<Notification["type"], string> = {
    follow: "followed you",
    like: "liked your post",
    reply: "replied to your post",
    post: "published a new post",
};

export function NotificationBell({ userId }: { userId?: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const loadNotifications = useCallback(async () => {
        if (!userId) {
            return;
        }

        const response = await fetch("/api/notifications", {
            cache: "no-store",
        });
        if (!response.ok) {
            return;
        }

        const data = (await response.json()) as {
            notifications: Notification[];
            unreadCount: number;
        };
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
    }, [userId]);

    useEffect(() => {
        const initialLoad = window.setTimeout(() => {
            void loadNotifications();
        }, 0);

        const handleFocus = () => void loadNotifications();
        window.addEventListener("focus", handleFocus);
        const timer = window.setInterval(loadNotifications, 30000);

        return () => {
            window.clearTimeout(initialLoad);
            window.removeEventListener("focus", handleFocus);
            window.clearInterval(timer);
        };
    }, [loadNotifications]);

    const openNotifications = async () => {
        setOpen((value) => !value);
        if (unreadCount === 0) {
            return;
        }

        const response = await fetch("/api/notifications", {
            method: "PATCH",
        });
        if (response.ok) {
            setUnreadCount(0);
            setNotifications((items) =>
                items.map((item) => ({ ...item, readAt: new Date().toISOString() })),
            );
        }
    };

    if (!userId) {
        return null;
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => void openNotifications()}
                className="relative rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={open}
            >
                Notifications
                {unreadCount > 0 ? (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 top-12 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="flex items-center justify-between px-2 pb-2">
                        <h2 className="font-semibold text-slate-900">Notifications</h2>
                        <span className="text-xs text-slate-500">Latest 30</span>
                    </div>
                    {notifications.length === 0 ? (
                        <p className="px-2 py-5 text-sm text-slate-500">No notifications yet.</p>
                    ) : (
                        <ul className="max-h-80 space-y-1 overflow-y-auto">
                            {notifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={`rounded-xl px-2 py-2 text-sm ${notification.readAt ? "" : "bg-sky-50"}`}
                                >
                                    <p className="text-slate-800">
                                        <strong>{notification.actorName}</strong>{" "}
                                        {notificationText[notification.type]}
                                    </p>
                                    <time className="text-xs text-slate-500">
                                        {new Date(notification.createdAt).toLocaleString("ja-JP")}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </div>
    );
}