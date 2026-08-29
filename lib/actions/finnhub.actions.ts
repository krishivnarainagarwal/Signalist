"use server";

import { cache } from "react";
import { formatArticle, getDateRange, validateArticle } from "@/lib/utils";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

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
    const token = getFinnhubToken();
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

function getFinnhubToken() {
    return (process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY ?? "").trim();
}

function mapSearchResult(result: FinnhubSearchResult, exchangeFallback?: string): StockWithWatchlistStatus {
    const symbol = (result.symbol || "").toUpperCase();
    const exchange =
        exchangeFallback ||
        (symbol.includes(".") ? symbol.split(".").slice(1).join(".") : "US");

    return {
        symbol,
        name: result.description || symbol,
        exchange,
        type: result.type || "Stock",
        isInWatchlist: false,
    };
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
        const token = getFinnhubToken();
        if (!token) {
            console.error("Error in stock search:", new Error("FINNHUB API key is not configured"));
            return [];
        }

        const trimmed = typeof query === "string" ? query.trim() : "";
        let results: FinnhubSearchResult[] = [];
        const exchangeBySymbol = new Map<string, string>();

        if (!trimmed) {
            const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
            const profiles = await Promise.all(
                top.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
                        const profile = await fetchJSON<{ name?: string; ticker?: string; exchange?: string }>(url, 3600);
                        return { sym, profile };
                    } catch (error) {
                        console.error("Error fetching profile2 for", sym, error);
                        return { sym, profile: null };
                    }
                })
            );

            results = profiles
                .map(({ sym, profile }) => {
                    const symbol = sym.toUpperCase();
                    const name = profile?.name || profile?.ticker || symbol;
                    if (profile?.exchange) exchangeBySymbol.set(symbol, profile.exchange);
                    return {
                        symbol,
                        description: name,
                        displaySymbol: symbol,
                        type: "Common Stock",
                    } satisfies FinnhubSearchResult;
                })
                .filter((result) => Boolean(result.description));
        } else {
            const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
            const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
            results = Array.isArray(data?.result) ? data.result : [];
        }

        return results
            .filter((result) => Boolean(result.symbol))
            .map((result) => mapSearchResult(result, exchangeBySymbol.get((result.symbol || "").toUpperCase())))
            .slice(0, 15);
    } catch (error) {
        console.error("Error in stock search:", error);
        return [];
    }
});