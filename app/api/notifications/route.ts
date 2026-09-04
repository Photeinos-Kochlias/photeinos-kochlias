import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import { serializeNotification } from "@/lib/notifications";

export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = (await getMongoClient()).db(getDatabaseName());
        const notifications = await db
            .collection("notifications")
            .find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .toArray();

        return NextResponse.json({
            notifications: notifications.map((notification) =>
                serializeNotification(notification as never),
            ),
            unreadCount: await db.collection("notifications").countDocuments({
                recipientId: userId,
                readAt: null,
            }),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 },
        );
    }
}

export async function PATCH() {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = (await getMongoClient()).db(getDatabaseName());
        await db.collection("notifications").updateMany(
            { recipientId: userId, readAt: null },
            { $set: { readAt: new Date() } },
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to mark notifications as read" },
            { status: 500 },
        );
    }
}