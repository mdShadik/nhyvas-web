import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";
import Image from "next/image";
import darkLogo from "@/public/assets/images/logo-horizontal-d.png"
import lightLogo from "@/public/assets/images/logo-horizontal-l.png"
import { useTheme } from "@/context/ThemeContext";

export function NavBar() {
    const {theme} = useTheme()
    const logoUrl = theme === "dark" ? darkLogo : lightLogo
    return (
        <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
                <Image src={logoUrl.src} alt="Nhyvas" width={120} height={60} />
            </Link>
            <nav className="flex items-center gap-4">
                <ThemeToggle />
                <div className="flex items-center gap-2">
                    <Link
                        href="/explore"
                        className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-200 dark:hover:bg-zinc-100/10"
                    >
                        Explore
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                    >
                        Login
                    </Link>
                </div>
            </nav>
        </header>
    );
}