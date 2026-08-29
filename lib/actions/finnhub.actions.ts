"use server";

import { formatArticle, getDateRange, validateArticle } from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
        ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
        : { cache: "no-store" };

    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Fetch failed ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
    if (!token) throw new Error("FINNHUB API key is not configured");

    const cleanSymbols = (symbols || [])
        .map((s) => s?.trim().toUpperCase())
        .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    if (cleanSymbols.length > 0) {
        const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

        await Promise.all(
            cleanSymbols.map(async (sym) => {
                try {
                    const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
                    const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
                    perSymbolArticles[sym] = (articles || []).filter(validateArticle);
                } catch {
                    perSymbolArticles[sym] = [];
                }
            })
        );

        const collected: MarketNewsArticle[] = [];
        for (let round = 0; round < maxArticles; round++) {
            for (const sym of cleanSymbols) {
                const article = perSymbolArticles[sym]?.shift();
                if (!article || !validateArticle(article)) continue;
                collected.push(formatArticle(article, true, sym, round));
                if (collected.length >= maxArticles) break;
            }
            if (collected.length >= maxArticles) break;
        }

        if (collected.length > 0) {
            collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
            return collected.slice(0, maxArticles);
        }
    }

    const general = await fetchJSON<RawNewsArticle[]>(
        `${FINNHUB_BASE_URL}/news?category=general&token=${token}`,
        300
    );

    return (general || [])
        .filter(validateArticle)
        .slice(0, maxArticles)
        .map((article, index) => formatArticle(article, false, undefined, index));
}