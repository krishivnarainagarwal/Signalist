import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

const purdueModel = (step: { ai: any }) =>
    step.ai.models.openai({
        model: "gpt-4o",
        apiKey: process.env.GEMINI_API_KEY,
        baseUrl: "https://genai.rcac.purdue.edu/api",
    });

const textFromPurdue = (response: any) =>
    response?.choices?.[0]?.message?.content?.trim() ?? "";

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
            model: purdueModel(step),
            body: {
                model: "llama3.1:latest",
                stream: false,
                messages: [{ role: "user", content: prompt }],
            },
        });

        await step.run("deliver-onboarding-mail", async () => {
            if (!email) throw new Error("Missing email on app/user.created");

            return sendWelcomeEmail({
                email,
                name,
                intro:
                    textFromPurdue(response) ||
                    "Your account is ready. Start with a watchlist and a few names you already know.",
            });
        });

        return { ok: true };
    }
);

export const sendDailyNewsSummary = inngest.createFunction(
    {
        id: "daily-news-summary",
        triggers: [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
    },
    async ({ step }) => {
        const users = await step.run("get-all-users", getAllUsersForNewsEmail);

        if (!users?.length) {
            return { success: false, message: "No users found for news email" };
        }

        const results = await step.run("fetch-user-news", async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];

            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = (await getNews(symbols))?.slice(0, 6) || [];
                    if (!articles.length) articles = (await getNews())?.slice(0, 6) || [];
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error("daily-news: error preparing user news", user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }

            return perUser;
        });

        const userNewsSummaries: Array<{
            user: UserForNewsEmail;
            newsContent: string | null;
        }> = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                    "{{newsData}}",
                    JSON.stringify(articles, null, 2)
                );

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: purdueModel(step),
                    body: {
                        model: "llama3.1:latest",
                        stream: false,
                        messages: [{ role: "user", content: prompt }],
                    },
                });

                userNewsSummaries.push({
                    user,
                    newsContent: textFromPurdue(response) || "No market news.",
                });
            } catch (e) {
                console.error("Failed to summarize news for:", user.email, e);
                userNewsSummaries.push({ user, newsContent: null });
            }
        }

        await step.run("send-news-emails", async () => {
            await Promise.all(
                userNewsSummaries.map(({ user, newsContent }) => {
                    if (!newsContent) return Promise.resolve(false);
                    return sendNewsSummaryEmail({
                        email: user.email,
                        date: getFormattedTodayDate(),
                        newsContent,
                    });
                })
            );
        });

        return { success: true, message: "Daily news summary emails sent successfully" };
    }
);