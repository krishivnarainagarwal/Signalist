import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffInMs = now - timestamp * 1000;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInHours > 24) {
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  if (diffInHours >= 1) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatMarketCapValue(marketCap: number): string {
  if (!marketCap || marketCap === 0) return "N/A";
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}T`;
  if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}B`;
  return `$${marketCap.toFixed(2)}M`;
}

export const getDateRange = (days: number) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - days);

  return {
    to: toDate.toISOString().split("T")[0],
    from: fromDate.toISOString().split("T")[0],
  };
};

export const getTodayDateRange = () => {
  const todayString = new Date().toISOString().split("T")[0];
  return { to: todayString, from: todayString };
};

export const calculateNewsDistribution = (symbolsCount: number) => {
  let itemsPerSymbol: number;
  let targetNewsCount = 6;

  if (symbolsCount < 3) {
    itemsPerSymbol = 3;
  } else if (symbolsCount === 3) {
    itemsPerSymbol = 2;
  } else {
    itemsPerSymbol = 1;
    targetNewsCount = 6;
  }

  return { itemsPerSymbol, targetNewsCount };
};

export const validateArticle = (article: RawNewsArticle) =>
    Boolean(article.headline && article.summary && article.url && article.datetime);

export const getTodayString = () => new Date().toISOString().split("T")[0];

export const formatArticle = (
    article: RawNewsArticle,
    isCompanyNews: boolean,
    symbol?: string,
    index: number = 0
) => ({
  id: isCompanyNews
      ? `${Date.now()}-${index}`
      : `${article.id ?? "news"}-${index}`,
  headline: article.headline!.trim(),
  summary: article.summary!.trim().substring(0, isCompanyNews ? 200 : 150) + "...",
  source: article.source || (isCompanyNews ? "Company News" : "Market News"),
  url: article.url!,
  datetime: article.datetime!,
  image: article.image || "",
  category: isCompanyNews ? "company" : article.category || "general",
  related: isCompanyNews ? symbol! : article.related || "",
});

export const formatChangePercent = (changePercent?: number) => {
  if (!changePercent) return "";
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(2)}%`;
};

export const getChangeColorClass = (changePercent?: number) => {
  if (!changePercent) return "text-gray-400";
  return changePercent > 0 ? "text-green-500" : "text-red-500";
};

export const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);

export const getFormattedTodayDate = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

export const formatDateToday = getFormattedTodayDate;

export const getAlertText = (alert: Alert) => {
  const condition = alert.alertType === "upper" ? ">" : "<";
  return `Price ${condition} ${formatPrice(alert.threshold)}`;
};