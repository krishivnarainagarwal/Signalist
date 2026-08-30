'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {LogOut} from "lucide-react";
import NavItems from "@/components/NavItems";
import {signOut} from "@/lib/actions/auth.actions";

const isRemoteImage = (value?: string | null) =>
    typeof value === "string" && /^https?:\/\//i.test(value.trim());

const avatarLetter = (user: User) => {
    const fromName = user.name?.trim()?.[0];
    if (fromName) return fromName.toUpperCase();
    const fromEmail = user.email?.trim()?.[0];
    if (fromEmail) return fromEmail.toUpperCase();
    return "A";
};

const UserAvatar = ({ user, className }: { user: User; className: string }) => {
    const src = isRemoteImage(user.image) ? user.image!.trim() : undefined;
    return (
        <Avatar className={className}>
            {src ? <AvatarImage src={src} alt={user.name || "AlphaIQ"} /> : null}
            <AvatarFallback className="bg-coral text-cream text-sm font-semibold">
                {avatarLetter(user)}
            </AvatarFallback>
        </Avatar>
    );
};

const UserDropdown = ({ user, initialStocks }: { user: User; initialStocks: StockWithWatchlistStatus[] }) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 text-gray-500 hover:text-cream">
                    <UserAvatar user={user} className="h-8 w-8" />
                    <div className="hidden md:flex flex-col items-start">
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="text-gray-500 bg-gray-800 border-gray-600">
                <DropdownMenuLabel>
                    <div className="flex relative items-center gap-3 py-2">
                        <UserAvatar user={user} className="h-10 w-10" />
                        <div className="flex flex-col">
                            <span className='text-base font-medium text-gray-400'>
                                {user.name}
                            </span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600"/>
                <DropdownMenuItem onClick={handleSignOut} className="text-cream text-md font-medium focus:bg-transparent focus:text-coral transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
                    Sign out
                </DropdownMenuItem>
                <DropdownMenuSeparator className="hidden sm:block bg-gray-600"/>
                <nav className="sm:hidden">
                    <NavItems initialStocks={initialStocks} />
                </nav>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown