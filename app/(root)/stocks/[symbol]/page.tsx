import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import { getNews, searchStocks } from "@/lib/actions/finnhub.actions";
import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import { auth } from "@/lib/better-auth/auth";
import {
    CANDLE_CHART_WIDGET_CONFIG,
    getTradingViewSymbol,
    SYMBOL_INFO_WIDGET_CONFIG,
} from "@/lib/constants";
import { formatTimeAgo } from "@/lib/utils";

const SCRIPT_BASE = "https://s3.tradingview.com/external-embedding/embed-widget-";

export async function generateMetadata({ params }: StockDetailsPageProps): Promise<Metadata> {
    const { symbol } = await params;
    const ticker = symbol?.trim().toUpperCase();
    return { title: ticker || "Stock" };
}

async function getCompanyNews(symbol: string): Promise<MarketNewsArticle[]> {
    try {
        const articles = await getNews([symbol]);
        return articles.filter(
            (article) =>
                article.category === "company" ||
                article.related?.toUpperCase() === symbol
        );
    } catch (error) {
        console.error("Failed to load company news for", symbol, error);
        return [];
    }
}

const StockDetails = async ({ params }: StockDetailsPageProps) => {
    const { symbol } = await params;
    const ticker = symbol?.trim().toUpperCase();

    if (!ticker) redirect("/");

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    const [news, matches, watchlist] = await Promise.all([
        getCompanyNews(ticker),
        searchStocks(ticker),
        getUserWatchlist(session.user.id),
    ]);

    const stock =
        matches.find((item) => item.symbol.toUpperCase() === ticker) ?? matches[0];
    const tvSymbol = getTradingViewSymbol(ticker, stock?.exchange);
    const isInWatchlist = watchlist.some((item) => item.symbol.toUpperCase() === ticker);

    return (
        <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
            <section className="flex min-w-0 flex-col gap-6 xl:col-span-2">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h1 className="text-3xl font-semibold text-gray-100">{ticker}</h1>
                        {stock?.name && stock.name.toUpperCase() !== ticker && (
                            <p className="text-lg text-gray-400">{stock.name}</p>
                        )}
                        {stock?.exchange && (
                            <span className="text-sm text-gray-500">{stock.exchange}</span>
                        )}
                    </div>
                    <WatchlistButton
                        key={ticker}
                        userId={session.user.id}
                        symbol={ticker}
                        company={stock?.name || ticker}
                        isInWatchlist={isInWatchlist}
                    />
                </header>

                <TradingViewWidget
                    key={`${tvSymbol}-info`}
                    scriptUrl={`${SCRIPT_BASE}symbol-info.js`}
                    config={SYMBOL_INFO_WIDGET_CONFIG(tvSymbol)}
                    height={170}
                />

                <TradingViewWidget
                    key={`${tvSymbol}-chart`}
                    scriptUrl={`${SCRIPT_BASE}advanced-chart.js`}
                    config={CANDLE_CHART_WIDGET_CONFIG(tvSymbol)}
                    className="custom-chart"
                    height={600}
                />
            </section>

            <aside className="min-w-0 xl:col-span-1">
                <h2 className="mb-4 text-lg font-semibold text-gray-100">News</h2>
                {news.length === 0 ? (
                    <p className="text-sm text-gray-500">No company news for {ticker}.</p>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {news.map((article, index) => (
                            <li key={`${article.id}-${article.url ?? article.headline}-${index}`}>
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="news-item block"
                                >
                                    <h3 className="news-title mb-2">{article.headline}</h3>
                                    <div className="news-meta mb-0 gap-2">
                                        <span>{article.source}</span>
                                        <span>·</span>
                                        <span>{formatTimeAgo(article.datetime)}</span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>
        </div>
    );
};

export default StockDetails;
