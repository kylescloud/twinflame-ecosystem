import { useTokenPairs, derivePools } from "@/hooks/useDexScreener";
import { ExternalLink, Loader2, Droplet } from "lucide-react";

interface Props {
  symbol: string;
  colSpan: number;
}

const formatNum = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const TokenPoolsRow = ({ symbol, colSpan }: Props) => {
  const { pairs, loading, error } = useTokenPairs(symbol);
  const pools = derivePools(pairs);

  return (
    <tr className="border-b border-border/20 bg-muted/10">
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Droplet className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Liquidity Pools — {symbol}</span>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        {!loading && pools.length === 0 && (
          <p className="py-2 text-xs text-muted-foreground">
            {error ? `Failed to load pools (${error})` : "No on-chain pools indexed for this token on Polygon."}
          </p>
        )}

        {pools.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border/30">
            <table className="w-full text-xs">
              <thead className="bg-muted/20">
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Pair</th>
                  <th className="px-3 py-2 text-left font-medium">DEX</th>
                  <th className="px-3 py-2 text-right font-medium">TVL</th>
                  <th className="px-3 py-2 text-right font-medium">24h Vol</th>
                  <th className="px-3 py-2 text-right font-medium">APR</th>
                  <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">24h Txns</th>
                  <th className="px-3 py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {pools.slice(0, 6).map((p) => (
                  <tr key={p.pairAddress} className="border-t border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-medium text-foreground">{p.pair}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.dex}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatNum(p.tvl)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatNum(p.volume24h)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-[hsl(142,70%,50%)]">
                      {p.apr.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                      {p.txns24h.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </td>
    </tr>
  );
};

export default TokenPoolsRow;
