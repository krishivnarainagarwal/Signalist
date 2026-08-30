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

const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    const index = text.toLowerCase().indexOf(term.trim().toLowerCase());
    if (index < 0) return text;
    const end = index + term.trim().length;
    return (
        <>
            {text.slice(0, index)}
            <span className="text-coral">{text.slice(index, end)}</span>
            {text.slice(end)}
        </>
    );
};

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
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="search-text inline-flex items-center gap-2 text-sm text-gray-500"
                >
                    {label}
                    <kbd className="hidden md:inline-flex h-5 items-center rounded-sm border border-gray-600 px-1.5 font-mono text-[10px] text-gray-500">
                        ⌘K
                    </kbd>
                </button>
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
                        placeholder="AAPL, MongoDB…"
                        className="search-input"
                    />
                </div>
                <CommandList className="search-list">
                    {loading && (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                            <Loader2 className="search-loader" />
                            Searching…
                        </div>
                    )}
                    {!loading && displayStocks.length === 0 ? (
                        <CommandEmpty className="search-list-empty">
                            {isSearchMode
                                ? `Nothing for “${searchTerm.trim()}”. Try the ticker.`
                                : 'A name, or a ticker. That’s it.'}
                        </CommandEmpty>
                    ) : (
                        displayStocks.map((stock, index) => (
                            <CommandItem
                                key={`${stock.symbol}-${stock.name}-${stock.exchange}-${index}`}
                                value={`${stock.symbol} ${stock.name} ${stock.exchange}`}
                                onSelect={() => handleSelectStock(stock)}
                                className="search-item"
                            >
                                <span className="font-medium text-gray-100">
                                    {highlightMatch(stock.symbol, searchTerm)}
                                </span>
                                <span className="search-item-name truncate text-sm font-normal text-gray-500">
                                    {highlightMatch(stock.name, searchTerm)}
                                </span>
                                <span className="ml-auto text-[11px] uppercase tracking-wide text-gray-500">
                                    {stock.exchange}
                                </span>
                            </CommandItem>
                        ))
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
};

export default SearchCommand;
