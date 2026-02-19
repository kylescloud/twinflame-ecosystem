import { motion } from "framer-motion";
import { BookOpen, Shield, Coins, Layers, ArrowDownUp, Flame, Zap, Globe, TrendingUp, Repeat, DollarSign, Lock, Users, BarChart3, Wallet, FileText } from "lucide-react";
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
      "TwinFlame Finance is a next-generation decentralized finance (DeFi) ecosystem built to bridge real-world assets with blockchain technology. It operates on a **trinity of value** token model — **BLAZE**, **EMBER**, and **EQT** — designed to create a self-sustaining financial engine with built-in deflationary mechanics, revenue sharing, and community governance.\n\nUnlike traditional DeFi protocols that rely on unsustainable inflationary rewards, TwinFlame uses protocol-generated revenue to back token value, fund buyback-and-burn programs, and distribute dividends to equity token holders. The result is an ecosystem where every transaction strengthens the protocol.",
  },
  {
    icon: Coins,
    title: "BLAZE — Core Governance Token",
    content:
      "BLAZE is the cornerstone of the TwinFlame ecosystem. It serves as the primary store of value, governance instrument, and deflationary anchor.\n\n**Supply & Scarcity**\n• Fixed maximum supply: **10,000,000 BLAZE**\n• No minting capability — supply can only decrease over time\n• Deflationary through protocol-funded **buyback-and-burn** mechanisms\n\n**Utility**\n• **Governance** — Vote on protocol proposals, parameter changes, and treasury allocations\n• **Staking** — Earn yield by staking BLAZE in flexible or locked pools\n• **Fee discounts** — BLAZE holders receive reduced trading fees on the DEX\n• **Collateral** — Use BLAZE as collateral in upcoming lending & borrowing markets\n\n**Tokenomics Allocation**\n• 30% — Community rewards & staking incentives\n• 20% — Liquidity provisioning\n• 15% — Team & advisors (2-year vesting with 6-month cliff)\n• 15% — Treasury & ecosystem fund\n• 10% — Public sale\n• 10% — Strategic partnerships & marketing\n\n**Deflationary Mechanics**\nA portion of all protocol fees is used to buy BLAZE from the open market and permanently burn it. As the ecosystem grows and transaction volume increases, the burn rate accelerates — creating continuous upward pressure on token value.",
  },
  {
    icon: TrendingUp,
    title: "EMBER — Reward & Utility Token",
    content:
      "EMBER is the dynamic reward and utility token that fuels day-to-day activity within TwinFlame Finance. Unlike BLAZE's fixed supply, EMBER has an **uncapped supply** — it is minted as staking rewards and burned through protocol utility, creating a balanced emission/deflation cycle.\n\n**Core Functions**\n• **Staking rewards** — All staking yields across the platform are paid in EMBER\n• **Fee reduction** — Pay transaction fees with EMBER for a discounted rate\n• **Ecosystem payments** — Used for marketplace purchases, NFT minting fees, and service payments\n• **Liquidity mining** — Earned by providing liquidity to BLAZE/EMBER and other trading pairs\n\n**Dual-Conversion Mechanism**\nEMBER and BLAZE are interconvertible through a carefully designed conversion engine:\n\n• **EMBER → BLAZE** — Burn EMBER to mint BLAZE at a **10% discount** to market price. This provides a price floor for EMBER and creates constant BLAZE demand.\n• **BLAZE → EMBER** — Burn BLAZE to mint EMBER at a **5% premium** to market price. This allows BLAZE holders to access liquidity while maintaining deflationary pressure.\n\nBoth conversions permanently destroy the input token, ensuring every swap reduces total circulating supply across the ecosystem.\n\n**Emission Schedule**\nEMBER emissions are dynamically adjusted based on protocol metrics:\n• Base emission rate decreases quarterly (halving every 2 years)\n• Burn rate increases with transaction volume\n• Target: net-deflationary within 18 months of launch\n\n**Why EMBER Matters**\nEMBER absorbs selling pressure that would otherwise hit BLAZE. Staking rewards flow in EMBER, so users who want to take profit sell EMBER rather than BLAZE — protecting the core token's value while still offering attractive yields.",
  },
  {
    icon: DollarSign,
    title: "EQT — Equity Token",
    content:
      "EQT (Equity Token) represents fractional ownership in real-world assets and protocol revenue streams. It bridges traditional finance with DeFi by offering dividend-bearing, asset-backed value.\n\n**Revenue Distribution**\nEQT holders receive quarterly dividend distributions sourced from:\n• DEX trading fees (40% of protocol revenue)\n• Staking platform fees\n• Cross-chain bridge fees\n• Partnership and integration revenue\n\nDividends are paid in stablecoins (USDC/USDT) directly to holder wallets.\n\n**Presale Structure**\n• Multiple presale rounds with increasing price tiers\n• Early participants receive bonus allocation and priority access\n• Vesting schedule ensures aligned long-term incentives\n• KYC verification required for regulatory compliance\n\n**Backing & Transparency**\n• Real-world asset portfolio managed by licensed custodians\n• Monthly on-chain proof-of-reserves reporting\n• Independent quarterly audits of underlying assets\n• Full transparency dashboard showing revenue, expenses, and distributions",
  },
  {
    icon: Repeat,
    title: "Fee Distribution & Transaction Flow",
    content:
      "Every transaction in the TwinFlame ecosystem generates fees that are strategically distributed to strengthen the protocol:\n\n**Standard Transaction Fee: 0.3%**\n\n**Fee Breakdown:**\n• **40%** — EQT dividend pool (distributed quarterly to EQT holders)\n• **25%** — BLAZE buyback-and-burn (permanent supply reduction)\n• **20%** — Liquidity provider rewards\n• **10%** — Treasury & development fund\n• **5%** — Staking reward pool top-up\n\n**Example Transaction Walkthrough:**\nA user swaps 10,000 USDC for BLAZE on the DEX:\n1. Total fee: 30 USDC (0.3%)\n2. $12 USDC → EQT dividend pool\n3. $7.50 USDC → Used to buy and burn BLAZE\n4. $6 USDC → Distributed to liquidity providers\n5. $3 USDC → Treasury\n6. $1.50 USDC → Added to staking rewards\n\n**Fee Discounts:**\n• Hold 1,000+ BLAZE: 10% fee reduction\n• Hold 5,000+ BLAZE: 20% fee reduction\n• Pay fees in EMBER: additional 5% reduction\n• Maximum combined discount: 25%",
  },
  {
    icon: Layers,
    title: "Staking & Yield",
    content:
      "TwinFlame offers a comprehensive staking system with multiple strategies to match different risk/reward preferences:\n\n**BLAZE Staking**\n• Flexible pool: ~8-12% APY, withdraw anytime\n• 30-day lock: ~15-20% APY with 1.5x multiplier\n• 90-day lock: ~25-35% APY with 2.5x multiplier\n• 180-day lock: ~40-55% APY with 4x multiplier\n\n**EMBER Staking**\n• Flexible pool: ~12-18% APY\n• Locked pools available with boosted rates\n• Auto-compound option reinvests rewards every 24 hours\n\n**LP Staking**\n• BLAZE/ETH pair: ~30-50% APY\n• BLAZE/EMBER pair: ~25-40% APY\n• EMBER/USDC pair: ~15-25% APY\n• Impermanent loss protection for stakes over 90 days\n\n**Governance Boost**\nStaked BLAZE grants governance voting power. Voting weight scales with lock duration:\n• Flexible stake: 1x voting power\n• 30-day lock: 1.5x voting power\n• 90-day lock: 3x voting power\n• 180-day lock: 5x voting power\n\nAll staking rewards are distributed in EMBER tokens. Users can then hold EMBER, convert to BLAZE at a discount, or sell on the open market.",
  },
  {
    icon: ArrowDownUp,
    title: "Swap & DEX",
    content:
      "The TwinFlame DEX is an Automated Market Maker (AMM) with intelligent routing and cross-chain capabilities.\n\n**Core Features**\n• **Multi-hop routing** — Automatically finds the best path across multiple pools for optimal pricing\n• **Cross-chain bridges** — Swap tokens across Ethereum, BSC, Polygon, Arbitrum, and Avalanche\n• **Limit orders** — Set target prices and the protocol executes when conditions are met\n• **Scheduled swaps** — Dollar-cost-average (DCA) with automated recurring purchases\n• **MEV protection** — Private transaction submission to prevent front-running and sandwich attacks\n\n**Supported Pairs**\n• BLAZE/ETH, BLAZE/USDC, BLAZE/USDT\n• EMBER/ETH, EMBER/USDC, EMBER/BLAZE\n• EQT/USDC, EQT/BLAZE\n• All major ERC-20 tokens via aggregation\n\n**Slippage & Price Impact**\n• Default slippage tolerance: 0.5%\n• Configurable up to 5% for volatile pairs\n• Real-time price impact warnings for large trades\n• Automatic transaction revert if slippage exceeds tolerance",
  },
  {
    icon: Shield,
    title: "Security Architecture",
    content:
      "Security is the foundation of TwinFlame Finance. The protocol employs defense-in-depth with multiple overlapping security layers:\n\n**Smart Contract Security**\n• Audited by three independent security firms (CertiK, Trail of Bits, OpenZeppelin)\n• Formal verification of critical contract logic\n• Immutable core contracts with upgradeable peripheral modules\n• 48-hour timelock on all contract upgrades\n\n**Operational Security**\n• Multi-signature treasury: 4-of-7 signers required for fund movements\n• Geographically distributed key holders\n• Hardware security module (HSM) key storage\n• Real-time anomaly detection and automated circuit breakers\n\n**Bug Bounty Program**\n• Up to **$100,000** for critical vulnerabilities\n• $25,000 for high-severity issues\n• $5,000 for medium-severity issues\n• Responsible disclosure process with 48-hour response SLA\n\n**Insurance Fund**\n• 5% of protocol revenue allocated to insurance reserves\n• Covers smart contract exploits and oracle failures\n• Community-governed claims process",
  },
  {
    icon: Globe,
    title: "Governance & DAO",
    content:
      "TwinFlame operates as a fully decentralized autonomous organization (DAO) with transparent, on-chain governance.\n\n**Proposal Types**\n• **TIP (TwinFlame Improvement Proposal)** — Protocol upgrades, new features, parameter changes\n• **TGP (TwinFlame Grant Proposal)** — Fund ecosystem projects, integrations, and partnerships\n• **TEP (TwinFlame Emergency Proposal)** — Fast-track proposals for critical security or operational issues (24-hour voting period)\n\n**Proposal Lifecycle**\n1. **Discussion** — Community debate on the governance forum (minimum 7 days)\n2. **Snapshot vote** — Off-chain signal vote to gauge sentiment\n3. **On-chain vote** — Binding vote with 72-hour voting period\n4. **Timelock** — 48-hour delay before execution for security review\n5. **Execution** — Automatic on-chain execution if quorum met\n\n**Quorum Requirements**\n• Standard proposals: 10% of staked BLAZE must vote\n• Treasury proposals (>$100K): 20% quorum\n• Emergency proposals: 5% quorum, 67% supermajority required\n\n**Council**\nA 7-member elected council handles day-to-day operations:\n• 6-month terms with staggered elections\n• Council members must stake minimum 10,000 BLAZE\n• Community can recall council members with 30% vote",
  },
  {
    icon: BarChart3,
    title: "Protocol Metrics & Transparency",
    content:
      "TwinFlame maintains full transparency through real-time on-chain dashboards and regular reporting:\n\n**Live Metrics**\n• Total Value Locked (TVL) across all pools and staking contracts\n• 24h/7d/30d trading volume on the DEX\n• BLAZE burn counter — total tokens permanently removed from supply\n• EMBER emission vs. burn rate (net inflation/deflation)\n• EQT dividend pool accumulation and distribution history\n\n**Monthly Reports**\n• Revenue breakdown by source (DEX fees, staking, bridges, partnerships)\n• Treasury holdings and allocation changes\n• Development progress and milestone updates\n• Security incident log (if any)\n\n**Quarterly Reports**\n• Independent financial audit\n• EQT proof-of-reserves verification\n• Governance activity summary\n• Ecosystem growth metrics (users, transactions, integrations)",
  },
  {
    icon: Lock,
    title: "Anti-Whale & Fair Launch Protections",
    content:
      "TwinFlame implements multiple mechanisms to prevent market manipulation and ensure fair distribution:\n\n**Transaction Limits**\n• Maximum single transaction: 1% of circulating BLAZE supply\n• Maximum wallet holding cap during first 30 days post-launch: 2% of supply\n• Cooldown period: minimum 30 seconds between transactions per wallet\n\n**Anti-Bot Measures**\n• Honeypot detection on launch block\n• Gradual liquidity release over first 24 hours\n• Blacklist system for confirmed bot addresses\n• Sniper tax: 99% tax on buys within first 2 blocks\n\n**Vesting Schedules**\n• Team tokens: 2-year linear vesting with 6-month cliff\n• Advisor tokens: 18-month linear vesting with 3-month cliff\n• Strategic partner tokens: 12-month linear vesting\n• All vesting contracts are immutable and publicly verifiable",
  },
  {
    icon: Users,
    title: "Community & Ecosystem",
    content:
      "The TwinFlame community is the backbone of the protocol. Multiple programs exist to reward participation and grow the ecosystem:\n\n**Ambassador Program**\n• Regional ambassadors represent TwinFlame in local crypto communities\n• Monthly EMBER rewards based on community growth metrics\n• Exclusive access to beta features and governance discussions\n\n**Developer Grants**\n• Up to $50,000 per project for ecosystem integrations\n• Technical support and co-marketing from the TwinFlame team\n• Priority listing for grant-funded projects on the platform\n\n**Referral Program**\n• Earn 10% of trading fees generated by referred users (lifetime)\n• Bonus EMBER rewards for milestone referrals (10, 50, 100 users)\n• Leaderboard with additional prizes for top referrers\n\n**Educational Content**\n• TwinFlame Academy: free courses on DeFi, staking, and governance\n• Weekly AMAs with the development team\n• Community-created content rewards program",
  },
  {
    icon: Zap,
    title: "Roadmap",
    content:
      "TwinFlame's development follows a phased approach, each building on the last:\n\n**Phase 1 — Ignition (Q1-Q2 2026)**\n• BLAZE and EMBER token launch on Ethereum mainnet\n• DEX launch with core trading pairs\n• Staking platform with flexible and locked pools\n• Community governance forum and initial DAO setup\n\n**Phase 2 — Expansion (Q3-Q4 2026)**\n• EQT presale and equity-backed dividend system\n• Cross-chain deployment to BSC, Polygon, and Arbitrum\n• Advanced DEX features (limit orders, DCA, MEV protection)\n• Mobile wallet integration\n\n**Phase 3 — Maturation (Q1-Q2 2027)**\n• Lending & borrowing markets (BLAZE and EQT as collateral)\n• NFT marketplace with EMBER-powered transactions\n• Institutional-grade API for professional traders\n• Fiat on-ramp via banking partnerships\n\n**Phase 4 — Dominance (Q3 2027+)**\n• TwinFlame mobile app (iOS & Android)\n• Real-world asset tokenization marketplace\n• Insurance protocol integration\n• Multi-chain DAO with unified governance across all networks",
  },
  {
    icon: Wallet,
    title: "Wallet & Portfolio",
    content:
      "TwinFlame provides a built-in portfolio dashboard for tracking all your holdings and activity:\n\n**Supported Wallets**\n• MetaMask, WalletConnect, Coinbase Wallet, Trust Wallet\n• Hardware wallet support via MetaMask (Ledger, Trezor)\n• Social login coming in Phase 3 (email + passkey)\n\n**Portfolio Features**\n• Real-time token balances across all supported chains\n• Staking positions with accrued rewards breakdown\n• LP position tracking with impermanent loss calculator\n• EQT dividend history and projected next payout\n• Full transaction history with CSV export\n\n**Notifications**\n• Price alerts for BLAZE, EMBER, and EQT\n• Staking unlock reminders\n• Governance vote notifications\n• Dividend distribution alerts",
  },
  {
    icon: FileText,
    title: "Getting Started",
    content:
      "Ready to join TwinFlame Finance? Follow these steps:\n\n**1. Connect Your Wallet**\nClick 'Connect Wallet' in the navigation bar. We support MetaMask, WalletConnect, and Coinbase Wallet. Make sure you're on Ethereum mainnet.\n\n**2. Acquire BLAZE**\nPurchase BLAZE through the Buy page using ETH or stablecoins, or swap from other tokens on the Swap page. First-time buyers may qualify for bonus EMBER rewards.\n\n**3. Explore EMBER**\nEMBER is earned through staking and liquidity provision. You can also acquire it on the DEX. Remember: EMBER can be converted to BLAZE at a 10% discount.\n\n**4. Stake Your Tokens**\nVisit the Staking page to deposit BLAZE or EMBER. Choose flexible staking for liquidity or lock for higher yields. All rewards are paid in EMBER.\n\n**5. Participate in Governance**\nStake BLAZE to earn voting power. Visit the governance forum to discuss proposals, then cast your vote on-chain. Longer lock = more voting power.\n\n**6. Explore EQT**\nCheck the EQT presale for equity-backed tokens with quarterly dividend distributions. KYC verification is required.\n\n**7. Track Your Portfolio**\nUse the Portfolio page to monitor all your positions, rewards, and dividend history in one place.",
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
