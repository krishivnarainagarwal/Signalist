import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/better-auth/auth';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import SearchCommand from '@/components/SearchCommand';
import { WatchlistRemoveButton } from '@/components/WatchlistButton';

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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="watchlist-title">Watchlist</h1>
                {items.length > 0 && (
                    <SearchCommand
                        renderAs="button"
                        label="Add stock"
                        initialStocks={initialStocks}
                        addOnSelect
                        userId={userId}
                    />
                )}
            </div>

            {items.length === 0 ? (
                <div className="watchlist-empty">
                    <p className="empty-description">
                        Your watchlist is empty. Search for a stock to add it.
                    </p>
                    <SearchCommand
                        renderAs="button"
                        label="Add stock"
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
                                <th className="px-4 py-3">Added</th>
                                <th className="px-4 py-3 text-right">Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={`${item.symbol}-${item.company}-${index}`} className="table-row">
                                    <td className="table-cell px-4 py-3">
                                        <Link
                                            href={`/stocks/${item.symbol}`}
                                            className="text-gray-100 hover:text-yellow-500"
                                        >
                                            {item.symbol}
                                        </Link>
                                    </td>
                                    <td className="table-cell px-4 py-3 text-gray-400">{item.company}</td>
                                    <td className="table-cell px-4 py-3 text-gray-500">
                                        {formatAddedAt(item.addedAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <WatchlistRemoveButton userId={userId} symbol={item.symbol} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WatchlistPage;
