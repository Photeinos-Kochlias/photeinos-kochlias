import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    return NextResponse.json({
        id: session.user.id,
        name: session.user.name || session.user.email,
        email: session.user.email,
        displayName: session.user.displayName || session.user.name || session.user.email,
    });
}
