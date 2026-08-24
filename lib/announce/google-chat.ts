const webhookUrl =
    process.env.GOOGLE_CHAT_WEBHOOK_URL;

export async function sendGoogleChatMessage(
    message: string
): Promise<void> {
    if (!webhookUrl) {
        throw new Error(
            "GOOGLE_CHAT_WEBHOOK_URL is not set"
        );
    }

    const response = await fetch(
        webhookUrl,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                text: message,
            }),
        }
    );

    if (!response.ok) {
        const errorText =
            await response.text();

        throw new Error(
            `Google Chat webhook failed: ${response.status} ${errorText}`
        );
    }
}