import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import AlphaIQLogo from "@/components/AlphaIQLogo";
import { searchStocks } from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" aria-label="AlphaIQ" className="flex items-center">
                    <AlphaIQLogo />
                </Link>

                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <UserDropdown user={user} initialStocks={initialStocks} />
            </div>
        </header>
    );
};

export default Header;