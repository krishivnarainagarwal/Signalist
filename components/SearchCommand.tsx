'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { addToWatchlist } from '@/lib/actions/watchlist.actions';

const EMPTY_STOCKS: StockWithWatchlistStatus[] = [];

const SearchCommand = ({
    renderAs = 'button',
    label = 'Search',
    initialStocks,
    addOnSelect = false,
    userId,
}: SearchCommandProps) => {
    const router = useRouter();
    const fallbackStocks = initialStocks ?? EMPTY_STOCKS;
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(fallbackStocks);

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks.slice(0, 10);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((isOpen) => !isOpen);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const trimmed = searchTerm.trim();

        if (!trimmed) {
            setStocks(fallbackStocks);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setLoading(true);
            try {
                const results = await searchStocks(trimmed);
                if (!cancelled) setStocks(results);
            } catch {
                if (!cancelled) setStocks([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [searchTerm, fallbackStocks]);

    const handleSelectStock = async (stock: StockWithWatchlistStatus) => {
        const ticker = stock.symbol.trim().toUpperCase();
        console.log(ticker);
        setOpen(false);
        setSearchTerm('');
        setStocks(fallbackStocks);

        if (addOnSelect && userId) {
            await addToWatchlist({
                userId,
                symbol: ticker,
                company: stock.name || ticker,
            });
            router.refresh();
            return;
        }

        router.push(`/stocks/${ticker}`);
    };

    return (
        <>
            {renderAs === 'text' ? (
                <span onClick={() => setOpen(true)} className="search-text">
                    {label}
                </span>
            ) : (
                <Button onClick={() => setOpen(true)} className="search-btn">
                    {label}
                </Button>
            )}
            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                shouldFilter={false}
                className="search-dialog"
            >
                <div className="search-field">
                    <CommandInput
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder="Search stocks..."
                        className="search-input"
                    />
                    {loading && <Loader2 className="search-loader" />}
                </div>
                <CommandList className="search-list">
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                    ) : displayStocks.length === 0 ? (
                        <CommandEmpty className="search-list-empty">
                            {isSearchMode ? 'No results found' : 'No stocks available'}
                        </CommandEmpty>
                    ) : (
                        displayStocks.map((stock, index) => (
                            <CommandItem
                                key={`${stock.symbol}-${stock.name}-${index}`}
                                value={`${stock.symbol} ${stock.name}`}
                                onSelect={() => handleSelectStock(stock)}
                                className="search-item"
                            >
                                <span className="font-medium text-gray-100">{stock.symbol}</span>
                                <span className="search-item-name">{stock.name}</span>
                            </CommandItem>
                        ))
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
};

export default SearchCommand;
