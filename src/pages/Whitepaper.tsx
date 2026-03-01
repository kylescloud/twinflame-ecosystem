import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, ArrowLeft, BookOpen, Shield, Sparkles, TrendingUp, Users, Zap, Target, Globe, ChevronRight } from "lucide-react";
import EmberParticles from "@/components/EmberParticles";

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Whitepaper = () => {
  return (
    <div className="min-h-screen bg-background">
      <EmberParticles />

      {/* Sticky header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold text-gradient-fire">TwinFlame</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="container relative mx-auto max-w-4xl px-6 pt-32 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <BookOpen className="h-4 w-4 text-primary" />
            Official Whitepaper
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            TwinFlame <span className="text-gradient-fire">Finance</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A Beginner-Friendly Guide to Our Three-Token Ecosystem
          </p>
          <div className="mt-6 text-xs text-muted-foreground">
            Version 1.0 · Last updated February 2026
          </div>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20 rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm"
        >
          <h2 className="mb-6 font-display text-2xl font-bold">Table of Contents</h2>
          <nav className="grid gap-2 sm:grid-cols-2">
            {[
              { num: "1", title: "The Problem", href: "#problem" },
              { num: "2", title: "The Solution", href: "#solution" },
              { num: "3", title: "The Three Tokens", href: "#tokens" },
              { num: "4", title: "How the Ecosystem Works", href: "#ecosystem" },
              { num: "5", title: "Example Transactions", href: "#examples" },
              { num: "6", title: "Revenue & Sustainability", href: "#revenue" },
              { num: "7", title: "Token Allocations", href: "#allocations" },
              { num: "8", title: "Roadmap", href: "#roadmap" },
              { num: "9", title: "FAQ", href: "#faq" },
              { num: "10", title: "Conclusion", href: "#conclusion" },
            ].map((item) => (
              <a
                key={item.num}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 font-display text-xs font-bold text-primary">
                  {item.num}
                </span>
                {item.title}
                <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
              </a>
            ))}
          </nav>
        </motion.div>

        {/* Executive Summary */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20 rounded-2xl border border-primary/20 bg-card/80 p-8 backdrop-blur-sm glow-fire"
        >
          <h2 className="mb-4 font-display text-2xl font-bold">Executive Summary</h2>
          <p className="leading-relaxed text-muted-foreground">
            TwinFlame Finance is a revolutionary decentralized finance (DeFi) platform built on three interconnected tokens: <strong className="text-blaze">Blaze (BLAZE)</strong>, <strong className="text-ember">Ember (EMBER)</strong>, and <strong className="text-equity">Equity (EQT)</strong>. Together, they create a self-sustaining ecosystem where every transaction benefits users and investors. The platform generates revenue through trading and lending fees, then automatically distributes it to buy back and burn BLAZE (increasing its value), reward stakers with EMBER, and pay dividends to EQT holders. This circular economy ensures long-term growth and profitability for all participants.
          </p>
        </motion.div>

        {/* Section 1: The Problem */}
        <Section id="problem" num="01" title="The Problem" subtitle="Why DeFi Needs a Better Model" icon={Zap}>
          <p className="mb-6 text-muted-foreground">
            Most DeFi platforms today have serious flaws:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Unsustainable Rewards", desc: "They print new tokens to pay users, causing inflation and price drops." },
              { title: "No Profit Sharing", desc: "Even if the platform makes money, token holders rarely see a share of it." },
              { title: "Confusing Tokenomics", desc: "Multiple tokens often compete instead of working together harmoniously." },
              { title: "High Risk", desc: "Many projects rely on hype and collapse when the excitement fades." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-muted/20 p-5">
                <h4 className="mb-2 font-display text-sm font-bold text-destructive">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-muted-foreground">
            TwinFlame was created to solve these problems with a transparent, sustainable, and fair system.
          </p>
        </Section>

        {/* Section 2: The Solution */}
        <Section id="solution" num="02" title="The Solution" subtitle="TwinFlame's Three-Token Ecosystem" icon={Target}>
          <p className="mb-6 text-muted-foreground">
            We use three tokens, each with a distinct job:
          </p>
          <div className="space-y-4">
            <TokenHighlight color="blaze" name="BLAZE" icon={Flame} desc="The 'store of value' and governance token. It's scarce and becomes more valuable over time." />
            <TokenHighlight color="ember" name="EMBER" icon={Sparkles} desc="The 'fuel' that powers the ecosystem. You earn it by participating, and you can use it to get discounts." />
            <TokenHighlight color="equity" name="EQT" icon={Shield} desc="The 'profit-sharing' token. Holders receive a portion of all platform revenue as cash dividends." />
          </div>
          <p className="mt-6 text-muted-foreground">
            These tokens work in harmony, creating a loop where activity on the platform generates fees, and those fees are automatically used to support all three tokens.
          </p>
        </Section>

        {/* Section 3: The Three Tokens */}
        <Section id="tokens" num="03" title="The Three Tokens Explained" subtitle="Deep dive into each token" icon={Flame}>
          {/* BLAZE */}
          <div className="mb-10">
            <h3 className="mb-4 font-display text-xl font-bold"><span className="text-blaze">3.1</span> Blaze (BLAZE) – The Core Token</h3>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Purpose" value="Governance & Value Storage" />
              <InfoCard label="Total Supply" value="10,000,000 (Fixed)" />
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              <strong className="text-foreground">How you get it:</strong> Buy on exchanges, earn by staking, or mint it by burning EMBER.
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              <strong className="text-foreground">What makes it valuable:</strong> The platform uses 50% of all fees to buy BLAZE from the market and permanently destroy (burn) it. This reduces supply and increases the price. You can stake BLAZE to earn EMBER rewards, and you need BLAZE to vote on platform decisions.
            </p>
            <h4 className="mb-3 font-display text-sm font-bold text-blaze">BLAZE Allocation</h4>
            <div className="grid gap-2">
              {[
                { label: "Community & Ecosystem", value: "40% (4,000,000)", desc: "Liquidity mining, staking rewards, airdrops" },
                { label: "Team", value: "20% (2,000,000)", desc: "3-year vesting schedule" },
                { label: "Treasury", value: "15% (1,500,000)", desc: "Future development" },
                { label: "Initial Liquidity", value: "10% (1,000,000)", desc: "DEX launch liquidity" },
                { label: "Private Sale", value: "10% (1,000,000)", desc: "Early investors" },
                { label: "Public Sale", value: "5% (500,000)", desc: "Community launch" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">— {item.desc}</span>
                  </div>
                  <span className="shrink-0 font-display font-bold text-blaze">{item.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs italic text-muted-foreground">
              The team's tokens are locked for one year and then released gradually, aligning their interests with the community.
            </p>
          </div>

          {/* EMBER */}
          <div className="mb-10">
            <h3 className="mb-4 font-display text-xl font-bold"><span className="text-ember">3.2</span> Ember (EMBER) – The Fuel Token</h3>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Purpose" value="Rewards & Discounts" />
              <InfoCard label="Supply" value="No Fixed Cap" />
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              <strong className="text-foreground">How you get it:</strong> Stake BLAZE, provide liquidity, or burn BLAZE at a premium.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">What makes it valuable:</strong> You can burn EMBER to mint new BLAZE at a 10% discount to market price. This creates constant demand for EMBER. You can also use EMBER to pay lower transaction fees on the platform. 30% of all platform fees are used to buy EMBER and distribute it to BLAZE stakers.
            </p>
          </div>

          {/* EQT */}
          <div>
            <h3 className="mb-4 font-display text-xl font-bold"><span className="text-equity">3.3</span> Equity (EQT) – The Profit-Sharing Token</h3>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Purpose" value="Revenue Share" />
              <InfoCard label="Total Supply" value="1,000,000 (Fixed)" />
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              <strong className="text-foreground">How you get it:</strong> Purchase in private or public sale, or earn through community incentives.
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              <strong className="text-foreground">What makes it valuable:</strong> 20% of all platform fees are set aside for EQT holders. Every quarter, this pool is distributed in stablecoins (like USDC) — actual cash dividends. EQT holders also vote on how the treasury funds are used.
            </p>
            <h4 className="mb-3 font-display text-sm font-bold text-equity">EQT Allocation</h4>
            <div className="grid gap-2">
              {[
                { label: "Team & Advisors", value: "25% (250,000)", desc: "3-year vesting, 1-year cliff" },
                { label: "Seed Investors", value: "20% (200,000)", desc: "Early backers" },
                { label: "Future Rounds", value: "20% (200,000)", desc: "Strategic raises" },
                { label: "Treasury Reserve", value: "15% (150,000)", desc: "Protocol reserves" },
                { label: "Community Incentives", value: "10% (100,000)", desc: "Growth rewards" },
                { label: "Public Sale", value: "10% (100,000)", desc: "Community access" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">— {item.desc}</span>
                  </div>
                  <span className="shrink-0 font-display font-bold text-equity">{item.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs italic text-muted-foreground">
              EQT is a security token, so purchases require identity verification (KYC) and transfers are restricted to comply with regulations.
            </p>
          </div>
        </Section>

        {/* Section 4: How the Ecosystem Works */}
        <Section id="ecosystem" num="04" title="How the Ecosystem Works" subtitle="The self-sustaining value loop" icon={TrendingUp}>
          <div className="mb-6 overflow-x-auto rounded-xl border border-border bg-muted/20 p-6">
            <pre className="whitespace-pre text-xs leading-relaxed text-muted-foreground sm:text-sm">
{`Users (Trade/Lend) → DEX & Lending → Fees (0.3%)
                                         │
                                    Fee Distributor
                                         │
                    ┌────────────────────┬┴───────────────────┐
                    ▼                    ▼                    ▼
             50% Buy BLAZE       30% Buy EMBER         20% to EQT
             & Burn (reduce      & Distribute to       Dividend Pool
               supply)            stakers
                                                              │
                                                         Quarterly
                                                         Payouts`}
            </pre>
          </div>

          <h3 className="mb-4 font-display text-lg font-bold">Step-by-Step</h3>
          <ol className="space-y-4">
            {[
              "Users trade tokens or lend/borrow on the TwinFlame DEX and lending platform. Every transaction pays a small fee (0.3%).",
              "All fees flow into the Fee Distributor contract.",
              "The Fee Distributor automatically splits the fees: 50% buys and burns BLAZE, 30% buys EMBER for stakers, 20% goes to the EQT dividend pool.",
              "The Staking Contract allows users to lock their BLAZE and earn a steady stream of EMBER rewards, encouraging people to hold BLAZE.",
              "The Swap Contract enables burning EMBER to mint BLAZE at a 10% discount, and burning BLAZE to mint EMBER at a 5% premium.",
              "EQT holders claim their dividends quarterly. A snapshot is taken at the end of each quarter and shares are sent in USDC.",
            ].map((step, i) => (
              <li key={i} className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* Section 5: Examples */}
        <Section id="examples" num="05" title="Example Transactions" subtitle="See how it works in real life" icon={Users}>
          <div className="space-y-6">
            <ExampleCard
              title="Alice Stakes BLAZE"
              color="blaze"
              steps={[
                "Alice buys 1,000 BLAZE at $0.20 each ($200 total).",
                "She stakes them in the Staking Contract.",
                "Over a month, the platform generates fees. 30% are used to buy EMBER and reward stakers.",
                "Alice earns 200 EMBER (worth $0.05 each = $10) that month.",
                "She can hold EMBER, sell it, or use it to mint more BLAZE at a discount.",
              ]}
            />
            <ExampleCard
              title="Bob Trades on the DEX"
              color="ember"
              steps={[
                "Bob swaps 1,000 MATIC for USDC on the TwinFlame DEX.",
                "The swap fee is 0.3% = 3 MATIC.",
                "Those 3 MATIC are added to the fee pool.",
                "1.5 MATIC buys and burns BLAZE, 0.9 MATIC buys EMBER for stakers, 0.6 MATIC goes to dividends.",
                "Bob's trade helps increase BLAZE value, rewards stakers, and funds dividends — all automatically.",
              ]}
            />
            <ExampleCard
              title="Charlie Uses EMBER for Discounted BLAZE"
              color="equity"
              steps={[
                "Charlie has 1,000 EMBER. Market price: EMBER $0.05, BLAZE $0.20.",
                "Normally, 1 BLAZE costs $0.20. But Charlie can burn EMBER worth $0.18 (10% discount) to mint 1 BLAZE.",
                "He burns 360 EMBER (worth $18) and receives 100 BLAZE (worth $20). He made a $2 profit!",
                "This arbitrage keeps EMBER's price stable and creates demand for both tokens.",
              ]}
            />
          </div>
        </Section>

        {/* Section 6: Revenue */}
        <Section id="revenue" num="06" title="Revenue & Sustainability" subtitle="How TwinFlame makes money" icon={TrendingUp}>
          <p className="mb-6 text-muted-foreground">The platform earns revenue from:</p>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
              <div className="font-display text-2xl font-bold text-blaze">0.3%</div>
              <p className="mt-1 text-xs text-muted-foreground">Trading Fees</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
              <div className="font-display text-2xl font-bold text-ember">Spread</div>
              <p className="mt-1 text-xs text-muted-foreground">Lending Interest</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
              <div className="font-display text-2xl font-bold text-equity">Arb</div>
              <p className="mt-1 text-xs text-muted-foreground">Discount Spread</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            The key is that the protocol's revenue grows as more people use it, and that growth directly benefits token holders. <strong className="text-foreground">BLAZE holders</strong> benefit from buybacks and staking rewards. <strong className="text-foreground">EMBER holders</strong> benefit from constant demand for discount minting. <strong className="text-foreground">EQT holders</strong> receive cash dividends. Because the system is circular, it doesn't rely on printing new tokens — it uses real revenue.
          </p>
        </Section>

        {/* Section 7: Allocations */}
        <Section id="allocations" num="07" title="Token Supply Summary" subtitle="At a glance" icon={BarChart}>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-display font-bold">Token</th>
                  <th className="px-4 py-3 text-left font-display font-bold">Supply</th>
                  <th className="px-4 py-3 text-left font-display font-bold">Type</th>
                  <th className="px-4 py-3 text-left font-display font-bold">Key Feature</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-bold text-blaze">BLAZE</td>
                  <td className="px-4 py-3 text-muted-foreground">10,000,000 (fixed)</td>
                  <td className="px-4 py-3 text-muted-foreground">Utility</td>
                  <td className="px-4 py-3 text-muted-foreground">Buyback & burn, governance</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 font-bold text-ember">EMBER</td>
                  <td className="px-4 py-3 text-muted-foreground">Uncapped</td>
                  <td className="px-4 py-3 text-muted-foreground">Utility</td>
                  <td className="px-4 py-3 text-muted-foreground">Minted as rewards, constantly burned</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-equity">EQT</td>
                  <td className="px-4 py-3 text-muted-foreground">1,000,000 (fixed)</td>
                  <td className="px-4 py-3 text-muted-foreground">Security</td>
                  <td className="px-4 py-3 text-muted-foreground">20% revenue share, quarterly dividends</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Section 8: Roadmap */}
        <Section id="roadmap" num="08" title="Roadmap" subtitle="What's next for TwinFlame" icon={Globe}>
          <div className="space-y-4">
            {[
              { quarter: "Q1 2026", items: "Concept development, team formation, private sale." },
              { quarter: "Q2 2026", items: "Smart contract development, testnet launch, security audits." },
              { quarter: "Q3 2026", items: "Mainnet launch on Polygon, initial liquidity, staking and swap live." },
              { quarter: "Q4 2026", items: "DEX and lending platform launch, first EQT dividend distribution." },
              { quarter: "2027+", items: "Cross-chain expansion (Arbitrum, Avalanche, BNB Chain), DAO fully operational, partnerships." },
            ].map((item) => (
              <div key={item.quarter} className="flex gap-4 rounded-xl border border-border bg-muted/20 p-5">
                <span className="shrink-0 font-display text-sm font-bold text-primary">{item.quarter}</span>
                <p className="text-sm text-muted-foreground">{item.items}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 9: FAQ */}
        <Section id="faq" num="09" title="FAQ" subtitle="For beginners" icon={BookOpen}>
          <div className="space-y-6">
            {[
              { q: "What is DeFi?", a: "DeFi stands for Decentralized Finance — financial services (like trading, lending) that run on blockchain without banks." },
              { q: "How do I buy these tokens?", a: "During initial sales, purchase EQT and BLAZE through our website (KYC required for EQT). After launch, BLAZE and EMBER are available on decentralized exchanges like QuickSwap." },
              { q: "What is staking?", a: "Staking means locking your tokens in a contract to support the network and earn rewards. Here, staking BLAZE earns you EMBER." },
              { q: "What are dividends?", a: "Dividends are cash payments to EQT holders from the platform's profits, distributed quarterly in stablecoins." },
              { q: "Is this safe?", a: "All smart contracts will be audited by top security firms, and we have a bug bounty program. However, no investment is risk-free." },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-muted/20 p-5">
                <h4 className="mb-2 font-display text-sm font-bold text-foreground">{item.q}</h4>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 10: Conclusion */}
        <Section id="conclusion" num="10" title="Conclusion" subtitle="Join the flame" icon={Flame}>
          <p className="mb-6 text-muted-foreground">
            TwinFlame Finance offers a transparent, sustainable, and profitable DeFi experience for everyone. With three tokens working together — <strong className="text-blaze">BLAZE</strong> for value and governance, <strong className="text-ember">EMBER</strong> for rewards and utility, and <strong className="text-equity">EQT</strong> for profit sharing — we've created an ecosystem where participation directly fuels growth.
          </p>
          <p className="mb-8 text-muted-foreground">
            Whether you're a trader, a long-term investor, or just curious about crypto, TwinFlame has a place for you.
          </p>
          <div className="rounded-2xl border border-primary/20 bg-card/80 p-8 text-center glow-fire">
            <h3 className="font-display text-2xl font-bold text-gradient-fire">Join the flame. Build the future.</h3>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/"
                className="group flex items-center gap-2 rounded-lg bg-gradient-fire px-8 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
              >
                Explore the Ecosystem
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs italic text-muted-foreground">
            Disclaimer: This whitepaper is for informational purposes only and does not constitute an offer to sell securities. Cryptocurrency investments involve high risk. Always do your own research.
          </p>
        </Section>
      </main>
    </div>
  );
};

/* Helper Components */

const BarChart = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="12" rx="1" /><rect x="17" y="4" width="4" height="16" rx="1" />
  </svg>
);

const Section = ({
  id,
  num,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <motion.section
    id={id}
    variants={sectionVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="mb-20 scroll-mt-24"
  >
    <div className="mb-6 flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <span className="text-xs font-bold text-primary">Section {num}</span>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
      </div>
    </div>
    <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>
    {children}
  </motion.section>
);

const TokenHighlight = ({
  color,
  name,
  icon: Icon,
  desc,
}: {
  color: string;
  name: string;
  icon: React.ElementType;
  desc: string;
}) => (
  <div className={`flex items-start gap-4 rounded-xl border border-border bg-muted/20 p-5`}>
    <div className={`shrink-0 rounded-lg bg-${color}/10 p-2.5`}>
      <Icon className={`h-5 w-5 text-${color}`} />
    </div>
    <div>
      <h4 className={`font-display font-bold text-${color}`}>{name}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="font-display text-sm font-bold">{value}</div>
  </div>
);

const ExampleCard = ({
  title,
  color,
  steps,
}: {
  title: string;
  color: string;
  steps: string[];
}) => (
  <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm">
    <h4 className={`mb-4 font-display text-lg font-bold text-${color}`}>{title}</h4>
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-muted-foreground">
          <span className="shrink-0 font-display text-xs font-bold text-primary">{i + 1}.</span>
          {step}
        </li>
      ))}
    </ol>
  </div>
);

export default Whitepaper;
