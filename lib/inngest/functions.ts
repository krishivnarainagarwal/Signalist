import { inngest } from "@/lib/inngest/client";
import { sendWelcomeEmail } from "@/lib/nodemailer";

export const sendSignUpEmail = inngest.createFunction(
    {
        id: "sign-up-email",
        triggers: { event: "app/user.created" },
    },
    async ({ event, step }) => {
        const email = String(event.data?.email ?? "");
        const name = String(event.data?.name ?? "there");
        const country = String(event.data?.country ?? "unspecified");
        const investmentGoals = String(event.data?.investmentGoals ?? "unspecified");
        const riskTolerance = String(event.data?.riskTolerance ?? "unspecified");
        const preferredIndustry = String(event.data?.preferredIndustry ?? "unspecified");

        const prompt =
            "Write 2 short sentences welcoming a new investor. " +
            "Be specific to their profile. No subject line and no sign-off.\n" +
            `Country: ${country}\n` +
            `Goals: ${investmentGoals}\n` +
            `Risk: ${riskTolerance}\n` +
            `Industry: ${preferredIndustry}`;

        const response = await step.ai.infer("draft-onboarding-intro", {
            model: step.ai.models.openai({
                model: "gpt-4o",
                apiKey: process.env.GEMINI_API_KEY,
                baseUrl: "https://genai.rcac.purdue.edu/api",
            }),
            body: {
                model: "llama3.1:latest",
                stream: false,
                messages: [{ role: "user", content: prompt }],
            },
        });

        await step.run("deliver-onboarding-mail", async () => {
            if (!email) {
                throw new Error("Missing email on app/user.created");
            }

            const intro =
                response.choices?.[0]?.message?.content?.trim() ||
                "Your account is ready. Start with a watchlist and a few names you already know.";

            return sendWelcomeEmail({ email, name, intro });
        });

        return { ok: true };
    }
);