import { NextResponse } from "next/server";

import { getCommit } from "@/lib/announce/github";
import {
    categorizeCommit,
    createAnnouncement,
} from "@/lib/announce/commit";
import { sendGoogleChatMessage } from "@/lib/announce/google-chat";

type VercelWebhookPayload = {
    type?: string;

    payload?: {
        deployment?: {
            id?: string;

            meta?: {
                githubCommitSha?: string;
                githubCommitRef?: string;
            };
        };

        project?: {
            id?: string;
            name?: string;
        };
    };
};

export async function POST(req: Request) {
    try {
        const body: VercelWebhookPayload =
            await req.json();

        console.log(
            "Vercel webhook received:",
            JSON.stringify(body, null, 2)
        );

        const deployment =
            body.payload?.deployment;

        const commitSha =
            deployment?.meta?.githubCommitSha;

        if (!commitSha) {
            console.error(
                "GitHub commit SHA not found"
            );

            return NextResponse.json(
                {
                    success: false,
                    error:
                        "GitHub commit SHA was not found",
                },
                {
                    status: 400,
                }
            );
        }

        const commit =
            await getCommit(commitSha);

        const categorizedCommit =
            categorizeCommit(commit);

        const message =
            createAnnouncement([
                categorizedCommit,
            ]);

        await sendGoogleChatMessage(message);

        return NextResponse.json({
            success: true,
            commit: categorizedCommit,
        });
    } catch (error) {
        console.error(
            "Deploy webhook error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            },
            {
                status: 500,
            }
        );
    }
}