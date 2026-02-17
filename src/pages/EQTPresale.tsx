import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock, DollarSign, Users, Vote, Calendar, TrendingUp, CheckCircle, Coins, PieChart, Clock, BadgeCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import Navbar from "@/components/Navbar";
import EmberParticles from "@/components/EmberParticles";
import KYCVerificationModal, { type KYCStatus } from "@/components/KYCVerificationModal";

const PRESALE_PRICE = 3.50;
const LAUNCH_PRICE = 5.00;
const DISCOUNT = Math.round((1 - PRESALE_PRICE / LAUNCH_PRICE) * 100);

const ALLOCATION = [
  { label: "Seed Round", pct: "20%", color: "bg-equity" },
  { label: "Team & Advisors", pct: "25%", color: "bg-primary" },
  { label: "Treasury", pct: "15%", color: "bg-accent" },
  { label: "Community", pct: "10%", color: "bg-secondary" },
  { label: "Public Sale", pct: "10%", color: "bg-muted-foreground" },
  { label: "Future Rounds", pct: "20%", color: "bg-border" },
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Quarterly Dividends",
    description: "Receive 20% of all gross protocol revenues distributed quarterly in USDC stablecoins.",
  },
  {
    icon: Vote,
    title: "Treasury Governance",
    description: "Vote on treasury allocation, dividend policies, and strategic protocol decisions.",
  },
  {
    icon: Lock,
    title: "Fixed Supply",
    description: "Only 1,000,000 EQT will ever exist. Scarcity drives long-term value appreciation.",
  },
  {
    icon: TrendingUp,
    title: "Revenue Sharing",
    description: "Earn passive income proportional to your holdings from all ecosystem fees and activities.",
  },
  {
    icon: Shield,
    title: "Regulatory Compliance",
    description: "Fully compliant security token with KYC/AML verification ensuring legal protection.",
  },
  {
    icon: Users,
    title: "Early Adopter Perks",
    description: "Pre-launch buyers get priority access to future rounds, airdrops, and governance proposals.",
  },
];

const TIMELINE = [
  { phase: "Pre-Sale Open", date: "Q2 2025", status: "active" },
  { phase: "KYC Verification", date: "Q2 2025", status: "active" },
  { phase: "Token Distribution", date: "Q3 2025", status: "upcoming" },
  { phase: "Mainnet Launch", date: "Q3 2025", status: "upcoming" },
  { phase: "First Dividend", date: "Q4 2025", status: "upcoming" },
];

const EQTPresale = () => {
  const { address, connect } = useWallet();
  const [amount, setAmount] = useState("");
  const [kycStatus, setKycStatus] = useState<KYCStatus>("unverified");
  const [kycOpen, setKycOpen] = useState(false);
  const qty = parseFloat(amount || "0");
  const cost = qty * PRESALE_PRICE;
  const savings = qty * (LAUNCH_PRICE - PRESALE_PRICE);

  const handleBuyClick = () => {
    if (!address) {
      connect();
    } else if (kycStatus === "unverified") {
      setKycOpen(true);
    }
    // if verified, would proceed to purchase; if pending, button is disabled
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <EmberParticles />
      <Navbar />

      <main className="container mx-auto px-6 pt-28 pb-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-equity/30 bg-equity/10 px-4 py-1.5 text-sm text-[hsl(var(--equity))]">
            <Clock className="h-4 w-4" />
            Pre-Launch Sale — {DISCOUNT}% Discount
          </div>
          <h1 className="font-display text-4xl font-bold md:text-6xl">
            <span className="text-[hsl(var(--equity))]">EQT</span> Equity Token
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Own a share of the TwinFlame protocol. EQT holders receive 20% of all platform revenues
            as quarterly dividends paid in USDC — the first revenue-sharing DeFi token on Polygon.
          </p>
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-[hsl(var(--equity))]">${PRESALE_PRICE.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Pre-Sale Price</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-muted-foreground line-through">${LAUNCH_PRICE.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Launch Price</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-gradient-fire">{DISCOUNT}%</p>
              <p className="text-xs text-muted-foreground">You Save</p>
            </div>
          </div>
        </motion.div>

        {/* Purchase Card + Summary */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Purchase */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="sticky top-28 border-equity/20 bg-card/80 backdrop-blur-sm glow-equity">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--equity))]">
                    <Shield className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="text-xl font-bold">Buy EQT</span>
                    <p className="text-sm font-normal text-muted-foreground">Pre-Sale — ${PRESALE_PRICE.toFixed(2)} / token</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Amount of EQT</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-background/50 text-lg"
                    min="0"
                  />
                </div>

                <div className="space-y-2 rounded-lg border border-border/50 bg-background/30 p-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Price per EQT</span>
                    <span className="text-foreground">${PRESALE_PRICE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quantity</span>
                    <span className="text-foreground">{qty.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2 flex justify-between font-semibold">
                    <span>Total Cost</span>
                    <span className="text-foreground">${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-[hsl(var(--equity))]">
                      <span>You Save</span>
                      <span>${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* KYC Status Badge */}
                {address && kycStatus === "verified" && (
                  <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--equity))]/30 bg-equity/10 p-3">
                    <BadgeCheck className="h-4 w-4 text-[hsl(var(--equity))]" />
                    <span className="text-sm font-medium text-[hsl(var(--equity))]">KYC Verified</span>
                  </div>
                )}
                {address && kycStatus === "pending" && (
                  <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span className="text-sm font-medium text-accent">KYC Under Review (1–3 business days)</span>
                  </div>
                )}

                <Button
                  className="w-full bg-[hsl(var(--equity))] text-primary-foreground font-semibold hover:opacity-90"
                  size="lg"
                  onClick={handleBuyClick}
                  disabled={address ? (kycStatus === "pending" || !amount || qty <= 0) : false}
                >
                  {!address
                    ? "Connect Wallet"
                    : kycStatus === "unverified"
                    ? "Complete KYC to Buy"
                    : kycStatus === "pending"
                    ? "KYC Pending..."
                    : `Buy ${qty.toLocaleString()} EQT`}
                </Button>

                {kycStatus === "unverified" && (
                  <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/30 p-3">
                    <Lock className="mt-0.5 h-4 w-4 text-[hsl(var(--equity))]" />
                    <p className="text-xs text-muted-foreground">
                      EQT is a security token. You must complete KYC/AML verification before purchasing. Tokens are distributed at mainnet launch (Q3 2025).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* What is EQT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8 lg:col-span-3"
          >
            {/* About */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">What is EQT?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  EQT (Equity Token) is the <span className="font-semibold text-foreground">revenue-sharing security token</span> at the heart of TwinFlame Finance. 
                  It represents real ownership in the protocol's economic output — not just governance rights, but actual cash-flow entitlements.
                </p>
                <p>
                  With a <span className="font-semibold text-foreground">fixed supply of 1,000,000 tokens</span>, every EQT you hold entitles you to a proportional share 
                  of <span className="font-semibold text-foreground">20% of all gross protocol revenues</span>. Dividends are distributed quarterly in USDC, providing 
                  predictable, stable income regardless of market conditions.
                </p>
                <p>
                  As a regulated security token, EQT purchases require KYC/AML verification and transfers are restricted to ensure full legal compliance, 
                  protecting both the protocol and its investors.
                </p>
              </CardContent>
            </Card>

            {/* Benefits Grid */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold">What You Get with EQT</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {BENEFITS.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                  >
                    <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm">
                      <CardContent className="flex gap-3 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-equity/10">
                          <b.icon className="h-4 w-4 text-[hsl(var(--equity))]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Token Allocation */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <PieChart className="h-5 w-5 text-[hsl(var(--equity))]" />
                  Token Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex h-4 overflow-hidden rounded-full">
                  {ALLOCATION.map((a) => (
                    <div
                      key={a.label}
                      className={`${a.color} transition-all`}
                      style={{ width: a.pct }}
                      title={`${a.label}: ${a.pct}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ALLOCATION.map((a) => (
                    <div key={a.label} className="flex items-center gap-2 text-sm">
                      <div className={`h-3 w-3 rounded-full ${a.color}`} />
                      <span className="text-muted-foreground">{a.label}</span>
                      <span className="ml-auto font-semibold">{a.pct}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-5 w-5 text-[hsl(var(--equity))]" />
                  Pre-Sale Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {TIMELINE.map((t, i) => (
                    <div key={t.phase} className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        t.status === "active"
                          ? "bg-[hsl(var(--equity))] text-primary-foreground"
                          : "border border-border bg-muted text-muted-foreground"
                      }`}>
                        {t.status === "active" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{t.phase}</p>
                        <p className="text-xs text-muted-foreground">{t.date}</p>
                      </div>
                      {t.status === "active" && (
                        <span className="rounded-full bg-equity/10 px-2 py-0.5 text-xs font-semibold text-[hsl(var(--equity))]">
                          Live
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Supply", value: "1,000,000", icon: Coins },
                { label: "Revenue Share", value: "20%", icon: DollarSign },
                { label: "Dividend Freq.", value: "Quarterly", icon: Calendar },
                { label: "Pre-Sale Discount", value: `${DISCOUNT}%`, icon: TrendingUp },
              ].map((s) => (
                <Card key={s.label} className="border-border/30 bg-card/50 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <s.icon className="mb-2 h-6 w-6 text-[hsl(var(--equity))]" />
                    <p className="font-display text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <KYCVerificationModal
        open={kycOpen}
        onClose={() => setKycOpen(false)}
        onComplete={() => setKycOpen(false)}
        kycStatus={kycStatus}
        setKycStatus={setKycStatus}
      />
    </div>
  );
};

export default EQTPresale;
