import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/better-auth/auth';
import { getQuotes, searchStocks } from '@/lib/actions/finnhub.actions';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import SearchCommand from '@/components/SearchCommand';
import WatchlistButton from '@/components/WatchlistButton';
import { formatChangePercent, formatPrice, getChangeColorClass } from '@/lib/utils';

const formatAddedAt = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const WatchlistPage = async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/sign-in');

    const userId = session.user.id;
    const [items, initialStocks] = await Promise.all([
        getUserWatchlist(userId),
        searchStocks(),
    ]);
    const quotes = items.length > 0 ? await getQuotes(items.map((item) => item.symbol)) : {};
    const hasQuotes = Object.keys(quotes).length > 0;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="watchlist-title">Watchlist</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        {items.length === 0
                            ? 'The short list. Yours.'
                            : `${items.length} ${items.length === 1 ? 'name' : 'names'}`}
                    </p>
                </div>
                {items.length > 0 && (
                    <SearchCommand
                        renderAs="button"
                        label="Add a name"
                        initialStocks={initialStocks}
                        addOnSelect
                        userId={userId}
                    />
                )}
            </div>

            {items.length === 0 ? (
                <div className="watchlist-empty items-start text-left py-8">
                    <p className="empty-description mb-5">
                        Quiet so far. Save something you actually follow.
                    </p>
                    <SearchCommand
                        renderAs="button"
                        label="Add a name"
                        initialStocks={initialStocks}
                        addOnSelect
                        userId={userId}
                    />
                </div>
            ) : (
                <div className="watchlist-table">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header px-4 py-3">Symbol</th>
                                <th className="px-4 py-3">Company</th>
                                {hasQuotes && <th className="px-4 py-3">Price</th>}
                                {hasQuotes && <th className="px-4 py-3">Change</th>}
                                <th className="px-4 py-3">Added</th>
                                <th className="px-4 py-3 text-right">Watchlist</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => {
                                const quote = quotes[item.symbol.toUpperCase()];
                                return (
                                    <tr key={`${item.symbol}-${item.company}-${index}`} className="table-row">
                                        <td className="table-cell px-4">
                                            <Link
                                                href={`/stocks/${item.symbol}`}
                                                className="font-medium text-cream hover:text-coral"
                                            >
                                                {item.symbol}
                                            </Link>
                                        </td>
                                        <td className="table-cell px-4 text-gray-400">{item.company}</td>
                                        {hasQuotes && (
                                            <td className="table-cell px-4 text-gray-200">
                                                {quote ? formatPrice(quote.price) : '—'}
                                            </td>
                                        )}
                                        {hasQuotes && (
                                            <td className={`table-cell px-4 ${getChangeColorClass(quote?.changePercent)}`}>
                                                {quote ? formatChangePercent(quote.changePercent) : '—'}
                                            </td>
                                        )}
                                        <td className="table-cell px-4 text-gray-500">
                                            {formatAddedAt(item.addedAt)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <WatchlistButton
                                                userId={userId}
                                                symbol={item.symbol}
                                                company={item.company}
                                                isInWatchlist
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WatchlistPage;
