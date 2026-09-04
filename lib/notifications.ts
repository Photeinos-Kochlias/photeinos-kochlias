import type { Collection } from "mongodb";

export type NotificationType = "follow" | "like" | "reply" | "post";

export type NotificationDocument = {
    id: string;
    recipientId: string;
    actorId: string;
    actorName: string;
    type: NotificationType;
    postId?: number;
    createdAt: Date;
    readAt: Date | null;
};

export async function createNotification(
    collection: Collection<NotificationDocument>,
    notification: Omit<NotificationDocument, "id" | "createdAt" | "readAt">,
) {
    if (!notification.recipientId || notification.recipientId === notification.actorId) {
        return;
    }

    await collection.insertOne({
        ...notification,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        readAt: null,
    });
}

export function serializeNotification(notification: NotificationDocument) {
    return {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString() || null,
    };
}