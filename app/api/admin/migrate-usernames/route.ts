import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

/**
 * アルファベットを含まない表示名（日本語など）でも有効な username を生成する。
 * ASCII スラッグが空になる場合は fallback を返す。
 */
function slugify(value: string, fallback: string): string {
    const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    return slug || fallback;
}

/**
 * POST /api/admin/migrate-usernames
 *
 * username が未設定・空の profiles / users を一括マイグレーションし、
 * 関連する posts の authorUsername も同期する。
 * 管理者（サインイン済みユーザー）のみ実行可能。
 */
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db(getDatabaseName());

    // ─── 1. username が空の profiles を取得 ───────────────────────────
    const profiles = await db
        .collection("profiles")
        .find({
            $or: [
                { username: { $exists: false } },
                { username: "" },
                { username: null },
            ],
        })
        .toArray();

    const profileResults: Array<{ userId: string; username: string }> = [];

    for (const profile of profiles) {
        const userId = String(profile.userId || profile._id);
        const newUsername = slugify(
            profile.displayName || profile.email || "",
            userId,
        );

        // profiles 更新
        await db.collection("profiles").updateOne(
            { _id: profile._id },
            { $set: { username: newUsername } },
        );

        // posts の authorUsername を同期（authorId / authorEmail で照合）
        const orConditions: object[] = [{ authorId: userId }];
        if (profile.email) {
            orConditions.push({ authorEmail: profile.email });
        }
        await db.collection("posts").updateMany(
            { $or: orConditions },
            {
                $set: {
                    authorUsername: newUsername,
                    ...(profile.displayName
                        ? { authorName: profile.displayName }
                        : {}),
                },
            },
        );

        // replies 内の authorUsername も同期
        await db.collection("posts").updateMany(
            { "replies.authorId": userId },
            {
                $set: {
                    "replies.$[elem].authorUsername": newUsername,
                    ...(profile.displayName
                        ? { "replies.$[elem].authorName": profile.displayName }
                        : {}),
                },
            },
            { arrayFilters: [{ "elem.authorId": userId }] },
        );

        profileResults.push({ userId, username: newUsername });
    }

    // ─── 2. username が空の users を取得 ──────────────────────────────
    const users = await db
        .collection("users")
        .find({
            $or: [
                { username: { $exists: false } },
                { username: "" },
                { username: null },
            ],
        })
        .toArray();

    const userResults: Array<{ userId: string; username: string }> = [];

    for (const user of users) {
        const userId = user._id.toString();
        const newUsername = slugify(
            user.displayName || user.email || "",
            userId,
        );

        // users 更新
        if (ObjectId.isValid(userId)) {
            await db.collection("users").updateOne(
                { _id: new ObjectId(userId) },
                { $set: { username: newUsername } },
            );
        }

        // 対応する profiles も更新（まだ存在しない場合は upsert）
        await db.collection("profiles").updateOne(
            { userId },
            {
                $set: { username: newUsername },
                $setOnInsert: {
                    userId,
                    email: user.email || "",
                    displayName: user.displayName || "",
                    bio: "",
                    avatarUrl: "",
                    isPublic: true,
                    followers: [],
                    following: [],
                },
            },
            { upsert: true },
        );

        // posts の authorUsername を同期
        const orConditions: object[] = [{ authorId: userId }];
        if (user.email) {
            orConditions.push({ authorEmail: user.email });
        }
        await db.collection("posts").updateMany(
            { $or: orConditions },
            { $set: { authorUsername: newUsername } },
        );

        userResults.push({ userId, username: newUsername });
    }

    // ─── 3. posts に authorUsername がない投稿を profiles/users から補完 ──
    const postsWithoutUsername = await db
        .collection("posts")
        .find({
            $or: [
                { authorUsername: { $exists: false } },
                { authorUsername: "" },
                { authorUsername: null },
            ],
        })
        .toArray();

    let postFixed = 0;
    for (const post of postsWithoutUsername) {
        const profile = post.authorId
            ? await db.collection("profiles").findOne({ userId: post.authorId })
            : null;
        const user = post.authorEmail
            ? await db.collection("users").findOne({ email: post.authorEmail })
            : null;

        const username =
            profile?.username ||
            user?.username ||
            slugify(
                post.authorName || post.authorEmail || "",
                post.authorId || "unknown",
            );

        if (username) {
            await db
                .collection("posts")
                .updateOne(
                    { _id: post._id },
                    { $set: { authorUsername: username } },
                );
            postFixed++;
        }
    }

    return NextResponse.json({
        ok: true,
        summary: {
            profilesFixed: profileResults.length,
            usersFixed: userResults.length,
            postsFixed: postFixed,
        },
        profiles: profileResults,
        users: userResults,
    });
}

