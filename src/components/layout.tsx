import { Link } from "@tanstack/react-router";
import { CreditCard, Search, Trophy, Wallet, BarChart3, Sparkles } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r bg-white/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] flex flex-col">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-foreground text-lg">CardSavvy</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Main
        </div>
        <NavLink to="/cards" icon={<Search className="h-4 w-4" />}>
          Browse Offers
        </NavLink>
        <NavLink to="/new" icon={<Sparkles className="h-4 w-4" />}>
          New Arrivals
        </NavLink>
        <NavLink to="/rankings" icon={<Trophy className="h-4 w-4" />}>
          Top Rankings
        </NavLink>
        <NavLink to="/compare" icon={<BarChart3 className="h-4 w-4" />}>
          Compare Cards
        </NavLink>

        <div className="mt-8 mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Personal
        </div>
        <NavLink to="/wallet" icon={<Wallet className="h-4 w-4" />}>
          My Wallet
        </NavLink>
      </div>

      <div className="p-4 border-t bg-muted/30">
        <ActiveScrapeButton />
        <div className="mt-4 rounded-xl border bg-card p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Sparkles className="h-12 w-12" />
          </div>
          <p className="text-xs font-medium text-foreground relative z-10">
            Bundled card catalogue with optional community-offer imports.
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground relative z-10">
            Verify terms with the issuer before applying.
          </p>
        </div>
      </div>
    </aside>
  );
}

import { useState } from "react";
import { syncAmexOffers } from "../lib/api/scraper";
import { Loader2, RefreshCw } from "lucide-react";

function ActiveScrapeButton() {
  const [isScraping, setIsScraping] = useState(false);

  async function handleScrape() {
    setIsScraping(true);
    try {
      const res = await syncAmexOffers();
      alert(`Scraped ${res.count} live offers from Reddit r/AmexUK!`);
      window.location.reload(); // Refresh to show new data
    } catch (e: any) {
      alert("Scraping failed: " + e.message);
    } finally {
      setIsScraping(false);
    }
  }

  return (
    <button
      onClick={handleScrape}
      disabled={isScraping}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-primary p-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
    >
      {isScraping ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <RefreshCw className="h-5 w-5" />
      )}
      {isScraping ? "Scraping Web..." : "Scrape Live Offers Now"}
    </button>
  );
}

function NavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white hover:text-foreground hover:shadow-sm"
      activeProps={{
        className: "bg-white text-primary shadow-sm ring-1 ring-primary/10 font-semibold",
      }}
    >
      {icon} {children}
    </Link>
  );
}
