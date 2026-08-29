'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/Database/mongoose';
import { Watchlist } from '@/Database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';

async function resolveUserId(userId?: string) {
    if (userId) return userId;

    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user.id ?? '';
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

export async function getUserWatchlist(userId: string): Promise<WatchlistItemData[]> {
    const uid = await resolveUserId(userId);
    if (!uid) return [];

    try {
        await connectToDatabase();
        const items = await Watchlist.find({ userId: uid }).sort({ addedAt: -1 }).lean();

        return items.map((item) => ({
            userId: String(item.userId),
            symbol: String(item.symbol),
            company: String(item.company),
            addedAt: item.addedAt,
        }));
    } catch (err) {
        console.error('getUserWatchlist error:', err);
        return [];
    }
}

export async function addToWatchlist({
    userId,
    symbol,
    company,
}: {
    userId: string;
    symbol: string;
    company: string;
}) {
    const uid = await resolveUserId(userId);
    const ticker = symbol?.trim().toUpperCase();
    const name = company?.trim() || ticker;

    if (!uid || !ticker) return { success: false };

    try {
        await connectToDatabase();
        await Watchlist.updateOne(
            { userId: uid, symbol: ticker },
            {
                $setOnInsert: {
                    userId: uid,
                    symbol: ticker,
                    company: name,
                    addedAt: new Date(),
                },
            },
            { upsert: true }
        );

        revalidatePath('/watchlist');
        revalidatePath(`/stocks/${ticker}`);
        return { success: true };
    } catch (err) {
        console.error('addToWatchlist error:', err);
        return { success: false };
    }
}

export async function removeFromWatchlist({
    userId,
    symbol,
}: {
    userId: string;
    symbol: string;
}) {
    const uid = await resolveUserId(userId);
    const ticker = symbol?.trim().toUpperCase();

    if (!uid || !ticker) return { success: false };

    try {
        await connectToDatabase();
        await Watchlist.deleteOne({ userId: uid, symbol: ticker });

        revalidatePath('/watchlist');
        revalidatePath(`/stocks/${ticker}`);
        return { success: true };
    } catch (err) {
        console.error('removeFromWatchlist error:', err);
        return { success: false };
    }
}