import { motion } from "framer-motion";
import blazeToken from "@/assets/blaze-token.png";
import emberToken from "@/assets/ember-token.png";
import eqtToken from "@/assets/eqt-token.png";

const tokens = [
  {
    name: "BLAZE",
    subtitle: "Core Utility & Governance",
    logo: blazeToken,
    color: "blaze",
    glowClass: "glow-fire",
    supply: "10,000,000",
    description: "The primary store of value. Stake to earn EMBER, vote on protocol parameters, and access exclusive features. Deflationary through continuous buyback-and-burn.",
    features: ["Staking rewards", "Governance voting", "Deflationary supply", "Tiered benefits"],
  },
  {
    name: "EMBER",
    subtitle: "Reward & Utility Token",
    logo: emberToken,
    color: "ember",
    glowClass: "glow-ember",
    supply: "Uncapped",
    description: "The circulatory fuel powering engagement. Earned through staking and liquidity. Burn to mint BLAZE at 10% discount, creating constant demand.",
    features: ["Staking rewards", "Discount swaps", "Reduced fees", "Liquidity fuel"],
  },
  {
    name: "EQT",
    subtitle: "Revenue Share & Governance",
    logo: eqtToken,
    color: "equity",
    glowClass: "glow-equity",
    supply: "1,000,000",
    description: "A financial stake in protocol success. Receives 20% of gross revenues as quarterly dividends. Regulated security token with transfer restrictions.",
    features: ["20% revenue share", "Quarterly dividends", "Treasury governance", "Security token"],
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const TokensSection = () => {
  return (
    <section id="tokens" className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            The <span className="text-gradient-fire">Token Trinity</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Three tokens designed to work in perfect harmony — store of value, utility fuel, and profit share.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {tokens.map((token) => (
            <motion.div
              key={token.name}
              variants={cardVariants}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:border-${token.color}/30 ${token.glowClass} hover:scale-[1.02]`}
            >
              <div className="mb-6">
                <img src={token.logo} alt={`${token.name} token logo`} className="h-14 w-14 rounded-full" />
              </div>

              <h3 className="font-display text-2xl font-bold">{token.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{token.subtitle}</p>

              <div className="mt-3 inline-flex rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                Supply: {token.supply}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {token.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {token.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Glow orb */}
              <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-${token.color}/5 blur-3xl transition-all group-hover:bg-${token.color}/10`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TokensSection;
