import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Clock, Zap, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@/hooks/useWallet";
import Navbar from "@/components/Navbar";
import EmberParticles from "@/components/EmberParticles";

const MOCK_STATS = {
  totalStaked: "4,231,560",
  apy: "18.4",
  yourStaked: "0",
  rewards: "0",
  stakingRatio: 42.3,
};

const Staking = () => {
  const { address } = useWallet();
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

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
            <span className="text-gradient-fire">Stake BLAZE</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Lock your BLAZE to earn EMBER rewards and support the ecosystem.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mx-auto mb-10 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { label: "Total Staked", value: MOCK_STATS.totalStaked, sub: "BLAZE", icon: Flame },
            { label: "Current APY", value: `${MOCK_STATS.apy}%`, sub: "annualized", icon: TrendingUp },
            { label: "Your Staked", value: address ? MOCK_STATS.yourStaked : "—", sub: "BLAZE", icon: Clock },
            { label: "Pending Rewards", value: address ? MOCK_STATS.rewards : "—", sub: "EMBER", icon: Zap },
          ].map((s, i) => (
            <Card key={i} className="border-border/30 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <s.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Staking Ratio Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mx-auto mb-10 max-w-2xl"
        >
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Network Staking Ratio</span>
            <span className="font-semibold text-foreground">{MOCK_STATS.stakingRatio}%</span>
          </div>
          <Progress value={MOCK_STATS.stakingRatio} className="h-3" />
          <p className="mt-1 text-xs text-muted-foreground">
            {MOCK_STATS.totalStaked} of 10,000,000 BLAZE staked
          </p>
        </motion.div>

        {/* Stake / Unstake Tabs */}
        <Tabs defaultValue="stake" className="mx-auto max-w-xl">
          <TabsList className="mb-6 grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="stake" className="data-[state=active]:bg-gradient-fire data-[state=active]:text-primary-foreground">
              <ArrowUpRight className="mr-2 h-4 w-4" /> Stake
            </TabsTrigger>
            <TabsTrigger value="unstake" className="data-[state=active]:bg-gradient-fire data-[state=active]:text-primary-foreground">
              <ArrowDownLeft className="mr-2 h-4 w-4" /> Unstake
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stake">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="h-5 w-5 text-primary" /> Stake BLAZE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount to Stake</span>
                    <button className="text-xs text-primary hover:underline">MAX</button>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00 BLAZE"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="bg-background/50 text-lg"
                  />
                </div>

                <div className="rounded-lg border border-border/30 bg-background/30 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current APY</span>
                    <span className="text-accent font-semibold">{MOCK_STATS.apy}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Daily EMBER</span>
                    <span className="font-medium">
                      {stakeAmount ? (parseFloat(stakeAmount) * 0.000504).toFixed(4) : "0.0000"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lock Period</span>
                    <span className="font-medium">None (flexible)</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-fire text-primary-foreground font-semibold"
                  size="lg"
                  disabled={!address || !stakeAmount || parseFloat(stakeAmount) <= 0}
                >
                  {!address ? "Connect Wallet First" : "Stake BLAZE"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unstake">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowDownLeft className="h-5 w-5 text-primary" /> Unstake BLAZE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount to Unstake</span>
                    <button className="text-xs text-primary hover:underline">MAX</button>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00 BLAZE"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="bg-background/50 text-lg"
                  />
                </div>

                <div className="rounded-lg border border-border/30 bg-background/30 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Currently Staked</span>
                    <span className="font-medium">{MOCK_STATS.yourStaked} BLAZE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Claimable Rewards</span>
                    <span className="text-accent font-semibold">{MOCK_STATS.rewards} EMBER</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={!address}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    Claim Rewards
                  </Button>
                  <Button
                    className="bg-gradient-fire text-primary-foreground font-semibold"
                    size="lg"
                    disabled={!address || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                  >
                    Unstake
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How Staking Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <h2 className="mb-6 text-center font-display text-2xl font-bold">How Staking Works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: "1", title: "Stake BLAZE", desc: "Lock your BLAZE tokens in the staking contract. No minimum, no lock period." },
              { step: "2", title: "Earn EMBER", desc: "30% of all platform fees buy EMBER and distribute it proportionally to stakers." },
              { step: "3", title: "Use Rewards", desc: "Hold EMBER, sell it, or burn it to mint BLAZE at a 10% discount to market." },
            ].map((s) => (
              <Card key={s.step} className="border-border/30 bg-card/50 backdrop-blur-sm text-center">
                <CardContent className="p-6">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-fire text-primary-foreground font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Staking;
