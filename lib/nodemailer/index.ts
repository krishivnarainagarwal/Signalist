import nodemailer from "nodemailer";
import {
    WELCOME_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    },
});

export const sendWelcomeEmail = async ({
                                           email,
                                           name,
                                           intro,
                                       }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
        "{{intro}}",
        intro
    );

    await transporter.sendMail({
        from: `"Ticker" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: "Welcome to Ticker - your stock market toolkit is ready!",
        text: "Thanks for joining Ticker",
        html: htmlTemplate,
    });
};

export const sendNewsSummaryEmail = async ({
                                               email,
                                               date,
                                               newsContent,
                                           }: {
    email: string;
    date: string;
    newsContent: string;
}) => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
        "{{date}}",
        date
    ).replace("{{newsContent}}", newsContent);

    await transporter.sendMail({
        from: `"Ticker News" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `Market News Summary Today - ${date}`,
        text: "Today's market news summary from Ticker",
        html: htmlTemplate,
    });
};