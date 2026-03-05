import { motion } from "framer-motion";
import { Sprout, Flame, Zap, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

const FARMS = [
  {
    pool: "BLAZE Supply",
    logo: TOKEN_LOGOS.BLAZE,
    rewardToken: "EMBER",
    rewardLogo: TOKEN_LOGOS.EMBER,
    baseAPR: 4.2,
    rewardAPR: 10.0,
    totalAPR: 14.2,
    tvl: "$2.45M",
    userStaked: 0,
    pendingRewards: 0,
    rewardsLeft: 125000,
  },
  {
    pool: "EMBER Supply",
    logo: TOKEN_LOGOS.EMBER,
    rewardToken: "BLAZE",
    rewardLogo: TOKEN_LOGOS.BLAZE,
    baseAPR: 5.8,
    rewardAPR: 12.7,
    totalAPR: 18.5,
    tvl: "$8.92M",
    userStaked: 0,
    pendingRewards: 0,
    rewardsLeft: 80000,
  },
  {
    pool: "EQT Supply",
    logo: TOKEN_LOGOS.EQT,
    rewardToken: "EMBER",
    rewardLogo: TOKEN_LOGOS.EMBER,
    baseAPR: 3.1,
    rewardAPR: 8.5,
    totalAPR: 11.6,
    tvl: "$1.2M",
    userStaked: 0,
    pendingRewards: 0,
    rewardsLeft: 200000,
  },
  {
    pool: "BLAZE Borrow",
    logo: TOKEN_LOGOS.BLAZE,
    rewardToken: "EQT",
    rewardLogo: TOKEN_LOGOS.EQT,
    baseAPR: -8.5,
    rewardAPR: 6.2,
    totalAPR: -2.3,
    tvl: "$1.13M",
    userStaked: 0,
    pendingRewards: 0,
    rewardsLeft: 50000,
  },
];

const DexEarn = () => {
  const { address, connect, isConnecting } = useWallet();

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Sprout className="h-7 w-7 text-[hsl(142,70%,50%)]" />
          <h1 className="font-display text-2xl font-bold text-foreground">Earn</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Supply or borrow incentivized assets to earn additional token rewards on top of base APY.
        </p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Incentivized TVL</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">$13.7M</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Reward APR</p>
            <p className="mt-1 font-display text-xl font-bold text-[hsl(142,70%,50%)]">9.35%</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Your Pending Rewards</p>
            <p className="mt-1 font-display text-xl font-bold text-primary">0.00</p>
          </CardContent>
        </Card>
      </div>

      {/* Farm Cards */}
      <div className="space-y-4">
        {FARMS.map((farm, i) => (
          <motion.div
            key={farm.pool}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/40 bg-card/60 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Left Info */}
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <img src={farm.logo} alt="" className="h-10 w-10 rounded-full" />
                        <img src={farm.rewardLogo} alt="" className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">{farm.pool}</h3>
                        <p className="text-xs text-muted-foreground">Rewards in {farm.rewardToken}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Base APR</p>
                        <p className={`font-semibold ${farm.baseAPR >= 0 ? "text-[hsl(142,70%,50%)]" : "text-amber-400"}`}>
                          {farm.baseAPR >= 0 ? "+" : ""}{farm.baseAPR}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reward APR</p>
                        <p className="font-semibold text-primary">+{farm.rewardAPR}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total APR</p>
                        <p className={`font-bold ${farm.totalAPR >= 0 ? "text-[hsl(142,70%,50%)]" : "text-amber-400"}`}>
                          {farm.totalAPR >= 0 ? "+" : ""}{farm.totalAPR}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">TVL</p>
                        <p className="font-semibold text-foreground">{farm.tvl}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{farm.rewardsLeft.toLocaleString()} {farm.rewardToken} rewards remaining</span>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center justify-center border-t border-border/40 bg-muted/10 p-5 sm:w-48 sm:border-l sm:border-t-0">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Your Position</p>
                      <p className="font-display text-lg font-bold text-foreground mb-3">
                        {farm.userStaked > 0 ? farm.userStaked.toLocaleString() : "—"}
                      </p>
                      {!address ? (
                        <Button onClick={connect} disabled={isConnecting} size="sm" className="bg-gradient-fire text-primary-foreground w-full">
                          Connect
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Button size="sm" className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90">
                            Stake
                          </Button>
                          {farm.pendingRewards > 0 && (
                            <Button size="sm" variant="outline" className="w-full">
                              Claim {farm.pendingRewards.toFixed(2)}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DexEarn;
