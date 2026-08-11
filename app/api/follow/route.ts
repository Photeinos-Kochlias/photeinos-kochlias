import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const client = await getMongoClient();
    const db = client.db(getDatabaseName());

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as { id?: string }).id || session.user.email;
    const currentProfile = await db.collection("profiles").findOne({ userId: currentUserId });
    const targetProfile = await db.collection("profiles").findOne({ userId: body.targetUserId });

    if (!targetProfile) {
      return NextResponse.json({ error: "Target profile not found" }, { status: 404 });
    }

    const following = Array.isArray(currentProfile?.following) ? currentProfile.following : [];
    const followers = Array.isArray(targetProfile.followers) ? targetProfile.followers : [];
    const willFollow = !following.includes(body.targetUserId);

    const nextFollowing = willFollow ? [...following, body.targetUserId] : following.filter((value: string) => value !== body.targetUserId);
    const nextFollowers = willFollow ? [...followers, currentUserId] : followers.filter((value: string) => value !== currentUserId);

    await db.collection("profiles").updateOne({ userId: currentUserId }, { $set: { following: nextFollowing } }, { upsert: true });
    await db.collection("profiles").updateOne({ userId: body.targetUserId }, { $set: { followers: nextFollowers } }, { upsert: true });

    return NextResponse.json({ following: willFollow, followers: nextFollowers.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
  }
}
