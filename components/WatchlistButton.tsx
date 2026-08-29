'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { cn } from '@/lib/utils';

const WatchlistButton = ({
    userId,
    symbol,
    company,
    isInWatchlist,
}: WatchlistButtonProps) => {
    const router = useRouter();
    const [added, setAdded] = useState(isInWatchlist);
    const [pending, setPending] = useState(false);

    const handleClick = async () => {
        if (pending) return;
        setPending(true);
        const next = !added;
        setAdded(next);

        try {
            if (next) {
                await addToWatchlist({ userId, symbol, company });
            } else {
                await removeFromWatchlist({ userId, symbol });
            }
            router.refresh();
        } catch (error) {
            console.error('Watchlist toggle failed', error);
            setAdded(!next);
        } finally {
            setPending(false);
        }
    };

    return (
        <button
            type="button"
            disabled={pending}
            onClick={handleClick}
            className={cn('watchlist-btn !w-fit h-9 px-4 text-sm', added && 'watchlist-remove')}
        >
            {added ? 'In watchlist' : 'Add to watchlist'}
        </button>
    );
};

export const WatchlistRemoveButton = ({
    userId,
    symbol,
}: {
    userId: string;
    symbol: string;
}) => {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    const handleClick = async () => {
        if (pending) return;
        setPending(true);
        try {
            await removeFromWatchlist({ userId, symbol });
            router.refresh();
        } catch (error) {
            console.error('Watchlist remove failed', error);
            setPending(false);
        }
    };

    return (
        <button
            type="button"
            disabled={pending}
            onClick={handleClick}
            className="text-sm text-red-500 hover:text-red-400 disabled:opacity-50"
        >
            {pending ? 'Removing…' : 'Remove'}
        </button>
    );
};

export default WatchlistButton;
