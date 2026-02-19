import { motion } from "framer-motion";
import { BookOpen, Shield, Coins, Layers, ArrowDownUp, Flame, Zap, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const sections = [
  {
    icon: Flame,
    title: "What is TwinFlame?",
    content:
      "TwinFlame Finance is a next-generation decentralized finance (DeFi) ecosystem built to bridge real-world assets with blockchain technology. It combines dual-token economics, equity-backed value, and community governance to create a sustainable, transparent financial platform.",
  },
  {
    icon: Coins,
    title: "Dual-Token Model",
    content:
      "The ecosystem operates on two complementary tokens:\n\n• **BLZE** — The primary utility and governance token powering the TwinFlame ecosystem. Used for staking, voting, transaction fees, and ecosystem incentives.\n\n• **EQT (Equity Token)** — A value-backed token representing fractional ownership in real-world assets and revenue streams. EQT holders receive dividend distributions from ecosystem earnings.",
  },
  {
    icon: Layers,
    title: "Staking & Rewards",
    content:
      "TwinFlame offers flexible and locked staking options for both BLZE and EQT tokens:\n\n• **Flexible Staking** — Stake and unstake at any time with competitive APY rates.\n• **Locked Staking** — Commit tokens for 30, 90, or 180 days for boosted rewards.\n• **LP Staking** — Provide liquidity and earn additional yield on top of trading fees.\n\nAll staking rewards are distributed in BLZE tokens, with bonus multipliers for long-term holders.",
  },
  {
    icon: ArrowDownUp,
    title: "Swap & DEX",
    content:
      "The built-in decentralized exchange enables seamless token swaps with minimal slippage. Key features include:\n\n• Automated Market Maker (AMM) with optimized routing\n• Cross-chain bridge support for major networks\n• Limit orders and scheduled swaps\n• Low 0.3% trading fee with fee-sharing for liquidity providers",
  },
  {
    icon: Shield,
    title: "Security & Audits",
    content:
      "Security is foundational to TwinFlame Finance:\n\n• Smart contracts audited by leading blockchain security firms\n• Multi-signature treasury management\n• Time-locked governance proposals with community veto power\n• Bug bounty program with up to $100,000 in rewards\n• Real-time monitoring and automated circuit breakers",
  },
  {
    icon: Globe,
    title: "Governance",
    content:
      "TwinFlame operates as a decentralized autonomous organization (DAO). BLZE holders can:\n\n• Submit and vote on improvement proposals\n• Allocate treasury funds to ecosystem projects\n• Adjust protocol parameters (fees, reward rates, etc.)\n• Elect council members for day-to-day operations\n\nVoting power scales with staking duration — long-term stakers have greater influence.",
  },
  {
    icon: Zap,
    title: "Roadmap & Vision",
    content:
      "TwinFlame is building toward a comprehensive DeFi ecosystem:\n\n• **Phase 1** — Token launch, staking platform, and DEX\n• **Phase 2** — EQT presale, equity-backed dividends, cross-chain expansion\n• **Phase 3** — Lending & borrowing, NFT marketplace integration\n• **Phase 4** — Mobile app, fiat on-ramp, institutional partnerships\n\nOur goal is to become the leading bridge between traditional finance and DeFi.",
  },
  {
    icon: BookOpen,
    title: "Getting Started",
    content:
      "Ready to join TwinFlame Finance? Here's how:\n\n1. **Connect your wallet** — Click 'Connect Wallet' in the navigation bar to link your Web3 wallet (MetaMask, WalletConnect, etc.)\n2. **Acquire BLZE** — Purchase BLZE tokens through the Buy page or swap from other tokens on the Swap page.\n3. **Stake your tokens** — Visit the Staking page to start earning rewards.\n4. **Participate in governance** — Hold and stake BLZE to vote on proposals and shape the future of TwinFlame.\n5. **Explore EQT** — Check the EQT presale for equity-backed token opportunities with dividend distributions.",
  },
];

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pb-20 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h1 className="font-display text-4xl font-bold text-gradient-fire sm:text-5xl">
            Documentation
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Everything you need to know about the TwinFlame Finance ecosystem — from tokenomics and staking to governance and security.
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl space-y-10">
          {sections.map((section, i) => (
            <motion.section
              key={section.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm sm:p-8"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                  {section.title}
                </h2>
              </div>
              <div className="prose-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j} className="text-foreground font-medium">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </div>
            </motion.section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Docs;
