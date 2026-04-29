import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Database, Plus, RefreshCw, Save, Shield, ShieldOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS, NATIVE_USD_PRICES } from "@/lib/contracts";

interface Feed {
  symbol: string;
  address: string;
  priceUsd: number;
  updatedAt: number; // unix seconds
  stale: boolean;
}

const ORACLE_DEPLOYED =
  CONTRACTS.PRICE_ORACLE !== "0x0000000000000000000000000000000000000030";

const initialFeeds = (): Feed[] => {
  const now = Math.floor(Date.now() / 1000);
  return [
    { symbol: "BLAZE", address: CONTRACTS.BLAZE_TOKEN, priceUsd: NATIVE_USD_PRICES.BLAZE, updatedAt: now - 120, stale: false },
    { symbol: "EMBER", address: CONTRACTS.EMBER_TOKEN, priceUsd: NATIVE_USD_PRICES.EMBER, updatedAt: now - 240, stale: false },
    { symbol: "EQT",   address: CONTRACTS.EQT_TOKEN,   priceUsd: NATIVE_USD_PRICES.EQT,   updatedAt: now - 60,  stale: false },
    { symbol: "USDC",  address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", priceUsd: 1.0, updatedAt: now - 30, stale: false },
    { symbol: "WETH",  address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", priceUsd: 3420.5, updatedAt: now - 5400, stale: true },
  ];
};

const formatAge = (updatedAt: number) => {
  const diff = Math.floor(Date.now() / 1000) - updatedAt;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const DexOracle = () => {
  const { address, connect, isConnecting } = useWallet();
  const { toast } = useToast();
  const [feeds, setFeeds] = useState<Feed[]>(initialFeeds);
  const [maxStaleness, setMaxStaleness] = useState(3600); // 1h
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newToken, setNewToken] = useState({ address: "", symbol: "", price: "" });

  // Re-tick "X ago" labels every 30s
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  // Mark stale based on maxStaleness
  useEffect(() => {
    setFeeds((fs) =>
      fs.map((f) => ({ ...f, stale: Date.now() / 1000 - f.updatedAt > maxStaleness })),
    );
  }, [maxStaleness]);

  const isFeeder = !!address; // when contract deployed, gate on hasRole(FEEDER_ROLE, address)

  const saveOne = (sym: string) => {
    if (!address) return connect();
    const draft = drafts[sym];
    const price = parseFloat(draft);
    if (!Number.isFinite(price) || price <= 0) {
      toast({ title: "Invalid price", description: "Enter a positive USD value.", variant: "destructive" });
      return;
    }
    setFeeds((fs) =>
      fs.map((f) =>
        f.symbol === sym ? { ...f, priceUsd: price, updatedAt: Math.floor(Date.now() / 1000), stale: false } : f,
      ),
    );
    setDrafts((d) => ({ ...d, [sym]: "" }));
    toast({
      title: "Price updated",
      description: ORACLE_DEPLOYED
        ? `setPriceUSD(${sym}, ${price}) submitted`
        : `Local update — oracle contract not yet deployed`,
    });
  };

  const batchSave = () => {
    if (!address) return connect();
    const dirty = Object.entries(drafts).filter(([, v]) => v && parseFloat(v) > 0);
    if (dirty.length === 0) {
      toast({ title: "Nothing to update", description: "Edit at least one price before batching." });
      return;
    }
    setFeeds((fs) =>
      fs.map((f) => {
        const v = drafts[f.symbol];
        if (!v) return f;
        return { ...f, priceUsd: parseFloat(v), updatedAt: Math.floor(Date.now() / 1000), stale: false };
      }),
    );
    setDrafts({});
    toast({ title: "Batch update submitted", description: `${dirty.length} feeds updated atomically.` });
  };

  const addFeed = () => {
    if (!address) return connect();
    if (!newToken.address || !newToken.symbol || !newToken.price) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    const price = parseFloat(newToken.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    setFeeds((fs) => [
      ...fs,
      { symbol: newToken.symbol, address: newToken.address, priceUsd: price, updatedAt: Math.floor(Date.now() / 1000), stale: false },
    ]);
    setNewToken({ address: "", symbol: "", price: "" });
    toast({ title: "Token registered", description: `${newToken.symbol} added to oracle registry.` });
  };

  const stats = useMemo(() => {
    const stale = feeds.filter((f) => f.stale).length;
    return { total: feeds.length, stale, fresh: feeds.length - stale };
  }, [feeds]);

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Database className="h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Oracle Admin</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage USD price feeds consumed by <code className="rounded bg-muted/40 px-1">TwinFlameSwap</code> and{" "}
          <code className="rounded bg-muted/40 px-1">TwinFlameLending</code>. Requires <code>FEEDER_ROLE</code>.
        </p>
      </motion.div>

      {!ORACLE_DEPLOYED && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <div className="text-xs text-amber-100/90">
              <p className="font-semibold text-amber-300">Preview mode</p>
              <p className="mt-1">
                The PriceOracle contract is not deployed yet. Updates here are local-only and will be wired to{" "}
                <code>setPriceUSD</code> / <code>batchSetPriceUSD</code> once <code>CONTRACTS.PRICE_ORACLE</code> is set.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Feeds", value: stats.total.toString(), icon: Activity, color: "text-primary" },
          { label: "Fresh", value: stats.fresh.toString(), icon: CheckCircle2, color: "text-[hsl(142,70%,50%)]" },
          { label: "Stale", value: stats.stale.toString(), icon: AlertTriangle, color: "text-amber-400" },
          { label: "Max Staleness", value: `${Math.floor(maxStaleness / 60)}m`, icon: RefreshCw, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
              <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role status */}
      <Card className="border-border/40 bg-card/60">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm">
            {isFeeder ? <Shield className="h-4 w-4 text-[hsl(142,70%,50%)]" /> : <ShieldOff className="h-4 w-4 text-muted-foreground" />}
            <span className="text-foreground">FEEDER_ROLE:</span>
            <span className={isFeeder ? "text-[hsl(142,70%,50%)]" : "text-muted-foreground"}>
              {isFeeder ? "Granted" : "Connect wallet to verify"}
            </span>
          </div>
          {!address && (
            <Button onClick={connect} disabled={isConnecting} size="sm" className="bg-gradient-fire text-primary-foreground">
              Connect Wallet
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feeds table */}
      <Card className="border-border/40 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <h2 className="font-display text-base font-semibold text-foreground">Price Feeds</h2>
          <Button onClick={batchSave} size="sm" disabled={!isFeeder} className="bg-gradient-fire text-primary-foreground hover:opacity-90">
            <Save className="mr-1.5 h-3.5 w-3.5" /> Batch Update
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left">Token</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-right">Current (USD)</th>
                <th className="px-4 py-3 text-right">Updated</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">New Price</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {feeds.map((f) => (
                <tr key={f.symbol} className="border-b border-border/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{f.symbol}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {f.address.slice(0, 6)}…{f.address.slice(-4)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">${f.priceUsd.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{formatAge(f.updatedAt)}</td>
                  <td className="px-4 py-3 text-center">
                    {f.stale ? (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">Stale</span>
                    ) : (
                      <span className="rounded-full bg-[hsl(142,70%,50%)]/10 px-2 py-0.5 text-[10px] font-medium text-[hsl(142,70%,50%)]">Fresh</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder={f.priceUsd.toString()}
                      value={drafts[f.symbol] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [f.symbol]: e.target.value }))}
                      disabled={!isFeeder}
                      className="ml-auto h-8 w-28 border-border/50 bg-muted/20 text-right text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => saveOne(f.symbol)}
                      disabled={!isFeeder || !drafts[f.symbol]}
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add new token */}
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Plus className="h-4 w-4 text-primary" /> Register New Token
          </h3>
          <div className="grid gap-3 sm:grid-cols-[1fr,140px,140px,auto]">
            <Input
              placeholder="0x… token address"
              value={newToken.address}
              onChange={(e) => setNewToken({ ...newToken, address: e.target.value })}
              disabled={!isFeeder}
              className="border-border/50 bg-muted/20 font-mono text-xs"
            />
            <Input
              placeholder="Symbol (e.g. WBTC)"
              value={newToken.symbol}
              onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
              disabled={!isFeeder}
              className="border-border/50 bg-muted/20"
            />
            <Input
              type="number"
              placeholder="USD price"
              value={newToken.price}
              onChange={(e) => setNewToken({ ...newToken, price: e.target.value })}
              disabled={!isFeeder}
              className="border-border/50 bg-muted/20"
            />
            <Button onClick={addFeed} disabled={!isFeeder} className="bg-gradient-fire text-primary-foreground hover:opacity-90">
              Register
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staleness config */}
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-foreground">Staleness Threshold</h3>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={maxStaleness}
              onChange={(e) => setMaxStaleness(parseInt(e.target.value || "0", 10))}
              disabled={!isFeeder}
              className="w-40 border-border/50 bg-muted/20"
            />
            <span className="text-xs text-muted-foreground">seconds (currently {Math.floor(maxStaleness / 60)} min)</span>
            <Button
              size="sm"
              variant="outline"
              disabled={!isFeeder}
              onClick={() => toast({ title: "Threshold updated", description: `setMaxStaleness(${maxStaleness})` })}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DexOracle;
