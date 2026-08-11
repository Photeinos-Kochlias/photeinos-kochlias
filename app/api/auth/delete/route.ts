import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";

export async function DELETE() {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const email = session?.user?.email;

        if (!userId || !email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await getMongoClient();
        const db = client.db(getDatabaseName());

        const userQuery = ObjectId.isValid(userId)
            ? { _id: new ObjectId(userId) }
            : { email };

        const user = await db.collection("users").findOne(userQuery);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await db.collection("users").deleteOne({ _id: user._id });
        await db.collection("profiles").deleteMany({ userId: userId });
        await db.collection("posts").deleteMany({ authorId: userId });

        const cookieStore = await cookies();
        cookieStore.set("blog-auth", "", {
            path: "/",
            maxAge: 0,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
