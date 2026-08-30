import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AlphaIQLogo from "@/components/AlphaIQLogo";
import { auth } from "@/lib/better-auth/auth";

const Layout = async ({ children }: { children: React.ReactNode }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) redirect("/");

    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo" aria-label="AlphaIQ">
                    <AlphaIQLogo />
                </Link>

                <div className="auth-form mb-10">{children}</div>
            </section>

            <section className="auth-right-section">
                <blockquote className="auth-blockquote max-w-lg">
                    I open three charts and a coffee. That’s the whole morning.
                </blockquote>
                <cite className="auth-testimonial-author">— Mira, still in her first mug</cite>
            </section>
        </main>
    );
};

export default Layout;
