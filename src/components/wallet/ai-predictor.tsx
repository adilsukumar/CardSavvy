import { useState } from "react";
import { askChatbot } from "@/lib/api/chat";
import type { Card } from "@/data/types";
import {
  MapPin,
  Coins,
  PlaneTakeoff,
  TrendingUp,
  Sparkles,
  Loader2,
  ArrowRight,
  LocateFixed,
} from "lucide-react";

export function AiPredictor({ walletCards }: { walletCards: Card[] }) {
  const [loadingContext, setLoadingContext] = useState<string | null>(null);

  // States
  const [locationStr, setLocationStr] = useState("");
  const [locationResult, setLocationResult] = useState("");
  const [locatingGPS, setLocatingGPS] = useState(false);

  const [pointsAmount, setPointsAmount] = useState("");
  const [transferResult, setTransferResult] = useState("");

  const [wishlistPoints, setWishlistPoints] = useState("");
  const [wishlistGoal, setWishlistGoal] = useState("");
  const [wishlistResult, setWishlistResult] = useState("");

  const walletContext = walletCards.map((c) => `- ${c.name} (Rewards: ${c.rewardRate})`).join("\n");

  async function handleLocationOptimize(overrideLocation?: string) {
    const locToUse = overrideLocation || locationStr;
    if (!locToUse) return;
    setLoadingContext("location");
    try {
      const prompt = `My wallet contains these cards:\n${walletContext}\n\nI am currently at: "${locToUse}". \nWhich card should I use right now to maximize rewards? Also briefly advise me whether it's better to pay in Cash or use Points for this type of purchase. Keep it concise, punchy, and highly predictive.`;
      const res = await askChatbot({ data: { messages: [{ role: "user", content: prompt }] } });
      setLocationResult(res.text);
    } catch (e) {
      setLocationResult("Failed to get prediction.");
    }
    setLoadingContext(null);
  }

  async function handleUseGPS() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "CardSavvy/1.0",
              },
            },
          );
          const data = await res.json();
          const addr = data.address;
          const context =
            addr.amenity ||
            addr.shop ||
            addr.leisure ||
            addr.building ||
            addr.road ||
            "Unknown location";
          const city = addr.city || addr.town || addr.village || addr.state || "";

          const fullLoc = `${context}, ${city}`.trim();
          setLocationStr(fullLoc);
          handleLocationOptimize(fullLoc);
        } catch (e) {
          alert("Failed to reverse geocode location.");
        }
        setLocatingGPS(false);
      },
      (err) => {
        alert("Failed to get location: " + err.message);
        setLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleTransferOptimize() {
    if (!pointsAmount) return;
    setLoadingContext("transfer");
    try {
      const prompt = `I have ${pointsAmount} credit card points. Can you search the web for live or current transfer bonuses (like British Airways, Air India, etc) and tell me the absolute best airline or hotel to transfer these points to right now to maximize value?`;
      const res = await askChatbot({ data: { messages: [{ role: "user", content: prompt }] } });
      setTransferResult(res.text);
    } catch (e) {
      setTransferResult("Failed to get prediction.");
    }
    setLoadingContext(null);
  }

  async function handleWishlistPredict() {
    if (!wishlistPoints || !wishlistGoal) return;
    setLoadingContext("wishlist");
    try {
      const prompt = `I have ${wishlistPoints} credit card points. My long-term goal is to acquire: "${wishlistGoal}". \nPlease evaluate the Return on Investment (ROI). Calculate if it is better to burn these points for this item, or if it is better to buy it in cash and save the points. Also predict the future value (e.g., if it's Gold, note that gold appreciates; if it's a flight, note inflation). Give me a direct, predictive ROI rating.`;
      const res = await askChatbot({ data: { messages: [{ role: "user", content: prompt }] } });
      setWishlistResult(res.text);
    } catch (e) {
      setWishlistResult("Failed to get prediction.");
    }
    setLoadingContext(null);
  }

  if (walletCards.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border bg-card p-12 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 font-semibold">AI Predictor Locked</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add cards to your wallet to enable personalized AI optimization.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Location Optimizer */}
      <section className="rounded-2xl border bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-500" />
          <h2 className="text-xl font-semibold">Location & Checkout Optimizer</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Type where you are or what you're buying. We'll tell you which card to swipe and if you
          should use Cash or Points.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="e.g., At a Starbucks in London, buying a $1000 flight, etc."
            className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
            value={locationStr}
            onChange={(e) => setLocationStr(e.target.value)}
          />
          <button
            onClick={handleUseGPS}
            disabled={locatingGPS || loadingContext === "location"}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            title="Use My GPS Location"
          >
            {locatingGPS ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <LocateFixed className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only sm:not-sr-only">Locate</span>
          </button>
          <button
            onClick={() => handleLocationOptimize()}
            disabled={loadingContext === "location"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingContext === "location" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Predict
          </button>
        </div>

        {locationResult && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-white/50 p-4 text-sm dark:border-indigo-900 dark:bg-indigo-950/50">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {locationResult}
            </div>
          </div>
        )}
      </section>

      {/* Transfer Optimizer */}
      <section className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6">
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-semibold">Transfer Partner Maximizer</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your points to find live transfer bonuses (e.g., British Airways, Air India) and
          maximize value.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="e.g., 60,000 Chase Points"
            className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
            value={pointsAmount}
            onChange={(e) => setPointsAmount(e.target.value)}
          />
          <button
            onClick={handleTransferOptimize}
            disabled={loadingContext === "transfer"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingContext === "transfer" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Find Best Transfer
          </button>
        </div>

        {transferResult && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-white/50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/50">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {transferResult}
            </div>
          </div>
        )}
      </section>

      {/* Wishlist ROI Predictor */}
      <section className="rounded-2xl border bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Long-Term Wishlist ROI</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare spending points vs. cash on high-value goals (Gold, Flights). The AI will predict
          the future value and ROI.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Available Points (e.g., 24000)"
            className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
            value={wishlistPoints}
            onChange={(e) => setWishlistPoints(e.target.value)}
          />
          <input
            type="text"
            placeholder="Target Goal (e.g., 1g of 24K Gold)"
            className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
            value={wishlistGoal}
            onChange={(e) => setWishlistGoal(e.target.value)}
          />
          <button
            onClick={handleWishlistPredict}
            disabled={loadingContext === "wishlist"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap"
          >
            {loadingContext === "wishlist" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Coins className="h-4 w-4" />
            )}
            Analyze ROI
          </button>
        </div>

        {wishlistResult && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-white/50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/50">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {wishlistResult}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
