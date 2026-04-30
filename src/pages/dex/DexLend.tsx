import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Search, Users, Wallet, Plus, Clock, Shield, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import AssetDetailModal from "@/components/dex/AssetDetailModal";
import LendingPanel from "@/components/dex/LendingPanel";
import MyLoansPanel from "@/components/dex/MyLoansPanel";

const POOLED_MARKETS = [
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, totalSupplied: 2450000, totalBorrowed: 1127000, supplyAPY: 4.2, borrowAPY: 8.5, utilization: 46, collateralFactor: 75, liquidationThreshold: 120, category: "volatile" as const },
  { symbol: "EMBER", logo: TOKEN_LOGOS.EMBER, totalSupplied: 8920000, totalBorrowed: 3568000, supplyAPY: 5.8, borrowAPY: 11.2, utilization: 40, collateralFactor: 70, liquidationThreshold: 120, category: "volatile" as const },
  { symbol: "EQT", logo: TOKEN_LOGOS.EQT, totalSupplied: 1200000, totalBorrowed: 360000, supplyAPY: 3.1, borrowAPY: 6.8, utilization: 30, collateralFactor: 65, liquidationThreshold: 115, category: "volatile" as const },
  { symbol: "USDC", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=035", totalSupplied: 15800000, totalBorrowed: 11060000, supplyAPY: 6.2, borrowAPY: 9.4, utilization: 70, collateralFactor: 85, liquidationThreshold: 110, category: "stable" as const },
  { symbol: "WETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=035", totalSupplied: 5200000, totalBorrowed: 2600000, supplyAPY: 2.8, borrowAPY: 5.5, utilization: 50, collateralFactor: 80, liquidationThreshold: 115, category: "volatile" as const },
];

interface P2POffer {
  id: string;
  lender: string;
  token: string;
  logo: string;
  amount: number;
  interestRate: number;
  duration: string;
  collateralToken: string;
  minCollateral: number;
  active: boolean;
}

const P2P_OFFERS: P2POffer[] = [
  { id: "1", lender: "0x8a3f…1b2c", token: "BLAZE", logo: TOKEN_LOGOS.BLAZE, amount: 5000, interestRate: 6.5, duration: "30 days", collateralToken: "EMBER", minCollateral: 7500, active: true },
  { id: "2", lender: "0x7c2d…9e4a", token: "EMBER", logo: TOKEN_LOGOS.EMBER, amount: 15000, interestRate: 7.2, duration: "60 days", collateralToken: "BLAZE", minCollateral: 18000, active: true },
  { id: "3", lender: "0x5f1a…8b3d", token: "BLAZE", logo: TOKEN_LOGOS.BLAZE, amount: 2500, interestRate: 5.8, duration: "14 days", collateralToken: "EQT", minCollateral: 500, active: true },
  { id: "4", lender: "0x9e4c…7b2f", token: "EMBER", logo: TOKEN_LOGOS.EMBER, amount: 8000, interestRate: 8.0, duration: "90 days", collateralToken: "BLAZE", minCollateral: 10000, active: true },
];

const DexLend = () => {
  const { address, connect, isConnecting } = useWallet();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<typeof POOLED_MARKETS[0] | null>(null);
  const [showCreateP2P, setShowCreateP2P] = useState(false);
  const [p2pForm, setP2pForm] = useState({ token: "BLAZE", amount: "", rate: "", duration: "30", collateral: "EMBER", minCollateral: "" });

  const filteredPools = POOLED_MARKETS.filter((m) => !query || m.symbol.toLowerCase().includes(query.toLowerCase()));
  const filteredP2P = P2P_OFFERS.filter((o) => !query || o.token.toLowerCase().includes(query.toLowerCase()));

  const totalTVL = POOLED_MARKETS.reduce((s, m) => s + m.totalSupplied, 0);
  const totalBorrowed = POOLED_MARKETS.reduce((s, m) => s + m.totalBorrowed, 0);

  const handleAcceptOffer = async (offer: P2POffer) => {
    if (!address) { connect(); return; }
    toast({
      title: "Loan Accepted",
      description: `Borrowed ${offer.amount.toLocaleString()} ${offer.token} at ${offer.interestRate}% for ${offer.duration}. 0.5% creation fee applied.`,
    });
  };

  const handleCreateP2P = () => {
    if (!address) { connect(); return; }
    toast({
      title: "P2P Offer Created",
      description: `Lending ${p2pForm.amount} ${p2pForm.token} at ${p2pForm.rate}% APR for ${p2pForm.duration} days. 0.5% creation fee applied.`,
    });
    setShowCreateP2P(false);
    setP2pForm({ token: "BLAZE", amount: "", rate: "", duration: "30", collateral: "EMBER", minCollateral: "" });
  };

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Landmark className="h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Lend & Borrow</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Pooled lending (instant liquidity) + P2P offers (fixed rates, custom terms). Protocol fee: 0.3% pooled, 0.5% P2P creation.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Supplied", value: `$${(totalTVL / 1e6).toFixed(1)}M` },
          { label: "Total Borrowed", value: `$${(totalBorrowed / 1e6).toFixed(1)}M` },
          { label: "Active P2P Offers", value: P2P_OFFERS.filter((o) => o.active).length.toString() },
          { label: "Avg Supply APY", value: `${(POOLED_MARKETS.reduce((s, m) => s + m.supplyAPY, 0) / POOLED_MARKETS.length).toFixed(1)}%` },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* On-chain loan dashboard — uses contract view functions */}
      <MyLoansPanel />

      {/* Production lending panel — supply / borrow / repay / liquidate with live HF */}
      <LendingPanel />

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search assets…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 border-border/50 bg-muted/20" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pooled" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="pooled" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="mr-1.5 h-3.5 w-3.5" /> Pooled Markets
          </TabsTrigger>
          <TabsTrigger value="p2p" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="mr-1.5 h-3.5 w-3.5" /> P2P Offers
          </TabsTrigger>
        </TabsList>

        {/* Pooled Markets */}
        <TabsContent value="pooled">
          <Card className="border-border/40 bg-card/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Asset</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Supplied</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Supply APY</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Borrowed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Borrow APY</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPools.map((m, i) => (
                    <motion.tr
                      key={m.symbol}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedAsset(m)}
                      className="border-b border-border/20 cursor-pointer transition-colors hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={m.logo} alt="" className="h-7 w-7 rounded-full" />
                          <span className="font-semibold text-foreground">{m.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">${(m.totalSupplied / 1e6).toFixed(2)}M</td>
                      <td className="px-4 py-3 text-right font-semibold text-[hsl(142,70%,50%)]">{m.supplyAPY}%</td>
                      <td className="px-4 py-3 text-right text-foreground">${(m.totalBorrowed / 1e6).toFixed(2)}M</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-400">{m.borrowAPY}%</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-muted-foreground">{m.utilization}%</span>
                          <div className="h-1.5 w-16 rounded-full bg-muted/40 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-fire" style={{ width: `${m.utilization}%` }} />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* P2P Offers */}
        <TabsContent value="p2p">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Browse fixed-rate loan offers or create your own</p>
              <Button onClick={() => setShowCreateP2P(true)} size="sm" className="bg-gradient-fire text-primary-foreground hover:opacity-90">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Offer
              </Button>
            </div>

            <div className="space-y-3">
              {filteredP2P.map((offer, i) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/40 bg-card/60">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={offer.logo} alt="" className="h-10 w-10 rounded-full" />
                          <div>
                            <p className="font-semibold text-foreground">{offer.amount.toLocaleString()} {offer.token}</p>
                            <p className="text-xs text-muted-foreground">by {offer.lender}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground">Interest Rate</p>
                            <p className="font-semibold text-[hsl(142,70%,50%)]">{offer.interestRate}% APR</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-semibold text-foreground">{offer.duration}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Min. Collateral</p>
                            <p className="font-semibold text-foreground">{offer.minCollateral.toLocaleString()} {offer.collateralToken}</p>
                          </div>
                        </div>
                        <Button onClick={() => handleAcceptOffer(offer)} size="sm" className="bg-gradient-fire text-primary-foreground hover:opacity-90">
                          Accept <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create P2P Modal */}
      <AnimatePresence>
        {showCreateP2P && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm"
            onClick={() => setShowCreateP2P(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold text-foreground mb-4">Create P2P Loan Offer</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Token to Lend</label>
                  <select
                    value={p2pForm.token}
                    onChange={(e) => setP2pForm({ ...p2pForm, token: e.target.value })}
                    className="w-full rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm text-foreground"
                  >
                    <option value="BLAZE">BLAZE</option>
                    <option value="EMBER">EMBER</option>
                    <option value="EQT">EQT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Amount</label>
                  <Input type="number" placeholder="0.00" value={p2pForm.amount} onChange={(e) => setP2pForm({ ...p2pForm, amount: e.target.value })} className="border-border/50 bg-muted/20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Interest Rate (APR %)</label>
                    <Input type="number" placeholder="6.5" value={p2pForm.rate} onChange={(e) => setP2pForm({ ...p2pForm, rate: e.target.value })} className="border-border/50 bg-muted/20" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Duration (days)</label>
                    <Input type="number" placeholder="30" value={p2pForm.duration} onChange={(e) => setP2pForm({ ...p2pForm, duration: e.target.value })} className="border-border/50 bg-muted/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Collateral Token</label>
                    <select
                      value={p2pForm.collateral}
                      onChange={(e) => setP2pForm({ ...p2pForm, collateral: e.target.value })}
                      className="w-full rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm text-foreground"
                    >
                      <option value="BLAZE">BLAZE</option>
                      <option value="EMBER">EMBER</option>
                      <option value="EQT">EQT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Min. Collateral</label>
                    <Input type="number" placeholder="0.00" value={p2pForm.minCollateral} onChange={(e) => setP2pForm({ ...p2pForm, minCollateral: e.target.value })} className="border-border/50 bg-muted/20" />
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-xs text-muted-foreground">
                  <p>📋 A 0.5% creation fee will be charged when your offer is created.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreateP2P(false)}>Cancel</Button>
                  <Button className="flex-1 bg-gradient-fire text-primary-foreground hover:opacity-90" onClick={handleCreateP2P}>
                    Create Offer
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Detail Modal */}
      <AssetDetailModal open={!!selectedAsset} onClose={() => setSelectedAsset(null)} asset={selectedAsset} />
    </div>
  );
};

export default DexLend;
