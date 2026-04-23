import { useState, useEffect, useCallback, useRef } from "react";

// CoinGecko IDs for Polygon ecosystem tokens
const COINGECKO_IDS: Record<string, string> = {
  POL: "matic-network",
  WETH: "weth",
  USDC: "usd-coin",
  WBTC: "wrapped-bitcoin",
  AAVE: "aave",
  LINK: "chainlink",
  QCK: "quickswap",
};

export interface LiveCoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  market_cap_rank: number;
  sparkline_in_7d?: { price: number[] };
}

interface UsePolygonMarketDataReturn {
  coins: LiveCoinData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isLive: boolean;
  refetch: () => void;
}

const POLL_INTERVAL = 30_000; // 30s — CoinGecko free tier limit
const API_BASE = "https://api.coingecko.com/api/v3";

export function usePolygonMarketData(): UsePolygonMarketDataReturn {
  const [coins, setCoins] = useState<LiveCoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const url = `${API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h`;

      const res = await fetch(url);
      if (!res.ok) {
        // Rate limited — keep stale data, mark not live
        if (res.status === 429) {
          setIsLive(false);
          return;
        }
        throw new Error(`CoinGecko API ${res.status}`);
      }

      const data: LiveCoinData[] = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
      setIsLive(true);
      setError(null);
    } catch (err: any) {
      console.warn("CoinGecko fetch failed, using cached data:", err.message);
      setError(err.message);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { coins, loading, error, lastUpdated, isLive, refetch: fetchData };
}

// Map CoinGecko data back to our symbol-keyed format
export function getCoinGeckoSymbol(cgId: string): string | undefined {
  return Object.entries(COINGECKO_IDS).find(([, v]) => v === cgId)?.[0];
}

export { COINGECKO_IDS };
