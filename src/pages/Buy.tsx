import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Shield, ArrowRight, Coins, TrendingUp, Lock, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import Navbar from "@/components/Navbar";
import EmberParticles from "@/components/EmberParticles";
import PriceChart from "@/components/PriceChart";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

const TOKEN_PRICES = { BLAZE: 0.20, EQT: 5.00 };

const BuyTokenCard = ({ token, logo, price, features }: {
  token: string; logo: string; price: number; features: string[];
}) => {
  const { address, connect } = useWallet();
  const [amount, setAmount] = useState("");
  const cost = parseFloat(amount || "0") * price;

  const animClass = token === "BLAZE" ? "animate-blaze-burn" : token === "EQT" ? "animate-eqt-breathe" : "animate-ember-float";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <img src={logo} alt={`${token} token`} className={`h-10 w-10 rounded-full ${animClass}`} />
            <div>
              <span className="text-xl font-bold">{token}</span>
              <p className="text-sm font-normal text-muted-foreground">${price.toFixed(2)} per token</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Amount of {token}</label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background/50 text-lg"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total Cost</span>
              <span className="font-semibold text-foreground">${cost.toFixed(2)} USDC</span>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border/50 bg-background/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Token Benefits</h4>
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <Button
            className="w-full bg-gradient-fire text-primary-foreground font-semibold"
            size="lg"
            onClick={!address ? connect : undefined}
            disabled={address ? (!amount || parseFloat(amount) <= 0) : false}
          >
            {!address ? "Connect Wallet" : `Buy ${amount || 0} ${token}`}
          </Button>

          {token === "EQT" && (
            <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/30 p-3">
              <Lock className="mt-0.5 h-4 w-4 text-accent" />
              <p className="text-xs text-muted-foreground">
                EQT is a security token. Purchase requires KYC verification and is subject to transfer restrictions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Buy = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <EmberParticles />
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            <span className="text-gradient-fire">Buy Tokens</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Purchase BLAZE or EQT to participate in the TwinFlame ecosystem.
          </p>
        </motion.div>

        {/* Price Charts */}
        <div className="mx-auto mb-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <PriceChart token="BLAZE" basePrice={0.20} color="hsl(25, 95%, 53%)" gradientId="blazeGrad" />
          <PriceChart token="EQT" basePrice={5.00} color="hsl(200, 80%, 55%)" gradientId="eqtGrad" />
        </div>

        <Tabs defaultValue="blaze" className="mx-auto max-w-2xl">
          <TabsList className="mb-8 grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="blaze" className="data-[state=active]:bg-gradient-fire data-[state=active]:text-primary-foreground">
              <img src={TOKEN_LOGOS.BLAZE} alt="" className="mr-2 h-4 w-4 rounded-full" /> BLAZE
            </TabsTrigger>
            <TabsTrigger value="eqt" className="data-[state=active]:bg-gradient-fire data-[state=active]:text-primary-foreground">
              <img src={TOKEN_LOGOS.EQT} alt="" className="mr-2 h-4 w-4 rounded-full" /> EQT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blaze">
            <BuyTokenCard
              token="BLAZE"
              logo={TOKEN_LOGOS.BLAZE}
              price={TOKEN_PRICES.BLAZE}
              features={[
                "Governance voting rights on platform decisions",
                "Stake to earn EMBER rewards",
                "Deflationary: 50% of fees buy & burn BLAZE",
                "Fixed supply of 10,000,000 tokens",
              ]}
            />
          </TabsContent>

          <TabsContent value="eqt">
            <BuyTokenCard
              token="EQT"
              logo={TOKEN_LOGOS.EQT}
              price={TOKEN_PRICES.EQT}
              features={[
                "20% of all platform fees as quarterly dividends",
                "Treasury governance voting rights",
                "Fixed supply of 1,000,000 tokens",
                "Dividends paid in USDC stablecoins",
              ]}
            />
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { icon: TrendingUp, label: "BLAZE Price", value: "$0.20", sub: "+12.5% (30d)" },
            { icon: Coins, label: "EQT Price", value: "$5.00", sub: "Next dividend: Q1" },
            { icon: Info, label: "Total Burned", value: "423,891", sub: "BLAZE removed" },
          ].map((stat, i) => (
            <Card key={i} className="border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <stat.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default Buy;
