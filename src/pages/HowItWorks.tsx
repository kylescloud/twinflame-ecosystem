import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Wallet, Coins, TrendingUp, Repeat, DollarSign, Shield, Flame, Sparkles, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import EmberParticles from "@/components/EmberParticles";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

const steps = [
  {
    step: 1,
    title: "Connect Your Wallet",
    subtitle: "Enter the Ecosystem",
    description: "Connect your Web3 wallet (MetaMask, WalletConnect, etc.) to access the TwinFlame platform. No sign-ups, no emails — just your wallet.",
    icon: Wallet,
    color: "hsl(var(--primary))",
    tokenHighlight: null,
    action: "Connect wallet on any page to get started.",
  },
  {
    step: 2,
    title: "Buy BLAZE",
    subtitle: "Acquire the Core Asset",
    description: "Purchase BLAZE — the primary store of value with a fixed supply of 10,000,000 tokens. As the ecosystem grows, continuous buyback-and-burn reduces supply, creating natural scarcity and price appreciation.",
    icon: Flame,
    color: "hsl(var(--blaze))",
    tokenHighlight: "BLAZE",
    action: "Head to the Buy page and purchase BLAZE with USDC.",
  },
  {
    step: 3,
    title: "Stake BLAZE → Earn EMBER",
    subtitle: "Put Your Tokens to Work",
    description: "Stake your BLAZE in the staking vault. You'll earn EMBER tokens as rewards — the longer you stake, the higher your multiplier. EMBER is the utility fuel that powers every action in the ecosystem.",
    icon: Sparkles,
    color: "hsl(var(--ember))",
    tokenHighlight: "EMBER",
    action: "Visit the Staking page and choose your lock period for boosted rewards.",
  },
  {
    step: 4,
    title: "Use EMBER for Benefits",
    subtitle: "Unlock Utility & Discounts",
    description: "Spend EMBER to reduce trading fees, access premium features, and participate in exclusive pools. EMBER acts as the circulatory fuel — it's constantly earned and spent, keeping the economy alive.",
    icon: Coins,
    color: "hsl(var(--ember))",
    tokenHighlight: "EMBER",
    action: "Use EMBER across Swap, Lending, and other platform features.",
  },
  {
    step: 5,
    title: "Burn EMBER → Mint BLAZE at Discount",
    subtitle: "The Flywheel Accelerator",
    description: "Here's where the magic happens. Burn your EMBER to mint new BLAZE at a 10% discount to market price. This creates constant buying pressure on BLAZE while simultaneously removing EMBER from circulation — a dual deflationary force.",
    icon: Repeat,
    color: "hsl(var(--blaze))",
    tokenHighlight: "BLAZE",
    action: "Use the Swap page to burn EMBER for discounted BLAZE.",
  },
  {
    step: 6,
    title: "Protocol Fees Drive the Engine",
    subtitle: "Every Trade Strengthens the System",
    description: "Every transaction on TwinFlame incurs a 0.3% fee. These fees are automatically distributed: 50% buys and burns BLAZE (increasing scarcity), 30% buys EMBER for staker rewards, and 20% flows to the EQT dividend pool.",
    icon: TrendingUp,
    color: "hsl(var(--primary))",
    tokenHighlight: null,
    action: "Every swap, lend, or trade you make contributes to this cycle.",
  },
  {
    step: 7,
    title: "Hold EQT → Earn Dividends",
    subtitle: "Own a Piece of the Protocol",
    description: "EQT is a regulated security token with a fixed supply of 1,000,000. Holders receive 20% of all gross platform revenue as quarterly dividends paid in USDC stablecoins. EQT also grants treasury governance voting rights.",
    icon: Shield,
    color: "hsl(var(--equity))",
    tokenHighlight: "EQT",
    action: "Purchase EQT on the presale page (KYC required).",
  },
  {
    step: 8,
    title: "Compound & Grow",
    subtitle: "The Virtuous Cycle",
    description: "Reinvest your EMBER rewards and EQT dividends back into BLAZE. As more users join and trade, fees increase → more BLAZE is burned → scarcity drives value → your staking rewards and dividends grow. The flywheel accelerates.",
    icon: DollarSign,
    color: "hsl(var(--primary))",
    tokenHighlight: null,
    action: "Repeat the cycle to maximize your compounding returns.",
  },
];

const getTokenLogo = (token: string | null) => {
  if (token === "BLAZE") return TOKEN_LOGOS.BLAZE;
  if (token === "EMBER") return TOKEN_LOGOS.EMBER;
  if (token === "EQT") return TOKEN_LOGOS.EQT;
  return null;
};

const getAnimClass = (token: string | null) => {
  if (token === "BLAZE") return "animate-blaze-burn";
  if (token === "EMBER") return "animate-ember-float";
  if (token === "EQT") return "animate-eqt-breathe";
  return "";
};

const HowItWorks = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <EmberParticles />
      <Navbar />

      <main className="container mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            How the <span className="text-gradient-fire">BLAZE Ecosystem</span> Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A step-by-step guide to understanding how BLAZE, EMBER, and EQT work together to create sustainable value and profit for every participant.
          </p>
        </motion.div>

        {/* Token Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mb-16 flex flex-wrap justify-center gap-6"
        >
          {[
            { name: "BLAZE", logo: TOKEN_LOGOS.BLAZE, anim: "animate-blaze-burn", desc: "Store of Value" },
            { name: "EMBER", logo: TOKEN_LOGOS.EMBER, anim: "animate-ember-float", desc: "Utility Fuel" },
            { name: "EQT", logo: TOKEN_LOGOS.EQT, anim: "animate-eqt-breathe", desc: "Revenue Share" },
          ].map((t) => (
            <div key={t.name} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-5 py-3 backdrop-blur-sm">
              <img src={t.logo} alt={t.name} className={`h-10 w-10 rounded-full ${t.anim}`} />
              <div>
                <p className="font-display text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Storyboard Steps */}
        <div className="relative mx-auto max-w-3xl">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-ember/40 to-equity/40 md:left-1/2 md:-translate-x-px" />

          {steps.map((step, i) => {
            const logo = getTokenLogo(step.tokenHighlight);
            const animClass = getAnimClass(step.tokenHighlight);
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`relative mb-12 flex items-start gap-6 md:gap-0 ${
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Step number circle on the line */}
                <div className="absolute left-6 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-border bg-card font-display text-sm font-bold md:left-1/2">
                  {step.step}
                </div>

                {/* Spacer for mobile */}
                <div className="w-12 shrink-0 md:hidden" />

                {/* Card */}
                <div className={`flex-1 md:w-[calc(50%-2rem)] ${isLeft ? "md:pr-10 md:text-right" : "md:pl-10"}`}>
                  <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg">
                    {/* Header */}
                    <div className={`mb-4 flex items-center gap-3 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                      {logo ? (
                        <img src={logo} alt={step.tokenHighlight!} className={`h-10 w-10 rounded-full ${animClass}`} />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <step.icon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className={isLeft ? "md:text-right" : ""}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {step.step}</p>
                        <h3 className="font-display text-lg font-bold">{step.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{step.subtitle}</p>

                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                    {/* Action callout */}
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-xs text-muted-foreground">{step.action}</p>
                    </div>
                  </div>
                </div>

                {/* Opposite spacer on desktop */}
                <div className="hidden md:block md:w-[calc(50%-2rem)]" />
              </motion.div>
            );
          })}
        </div>

        {/* Flywheel Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="rounded-3xl border border-border bg-card/80 p-8 text-center backdrop-blur-sm sm:p-12">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              The <span className="text-gradient-fire">Flywheel Effect</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Every action in the ecosystem reinforces the next. More users → more fees → more burns → higher scarcity → higher value → more staking → more users. This is the self-sustaining loop.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-display font-semibold">
              {[
                { label: "Trade", color: "text-foreground" },
                { label: "Fees Collected", color: "text-muted-foreground" },
                { label: "BLAZE Burned", color: "text-blaze" },
                { label: "Scarcity ↑", color: "text-blaze" },
                { label: "EMBER Rewards", color: "text-ember" },
                { label: "EQT Dividends", color: "text-equity" },
                { label: "Value Grows", color: "text-primary" },
              ].map((item, i, arr) => (
                <span key={item.label} className="flex items-center gap-2">
                  <span className={item.color}>{item.label}</span>
                  {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/buy"
                className="flex items-center gap-2 rounded-lg bg-gradient-fire px-8 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
              >
                Buy BLAZE <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/staking"
                className="rounded-lg border border-border bg-muted/30 px-8 py-3.5 font-display text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-muted/50"
              >
                Start Staking
              </Link>
              <Link
                to="/eqt-presale"
                className="rounded-lg border border-border bg-muted/30 px-8 py-3.5 font-display text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-muted/50"
              >
                Get EQT
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default HowItWorks;
