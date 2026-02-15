import { motion } from "framer-motion";
import { ArrowLeftRight, Landmark, Layers, Vote, Repeat, Wallet } from "lucide-react";

const useCases = [
  { icon: ArrowLeftRight, title: "DEX Trading", desc: "Swap tokens with 0.3% fees. Earn EMBER as a liquidity provider." },
  { icon: Landmark, title: "Lending", desc: "Lend assets for interest. Borrow against BLAZE or EQT collateral." },
  { icon: Layers, title: "Multi-Tier Staking", desc: "Stake BLAZE for EMBER. Boosted rewards for longer commitments." },
  { icon: Vote, title: "Governance", desc: "BLAZE holders vote on protocol. EQT holders govern treasury and dividends." },
  { icon: Repeat, title: "Discount Swaps", desc: "Burn EMBER to mint BLAZE at 10% discount. Constant buying pressure." },
  { icon: Wallet, title: "Treasury", desc: "Protocol-owned liquidity grows the ecosystem through strategic deployment." },
];

const EcosystemSection = () => {
  return (
    <section id="ecosystem" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            The <span className="text-gradient-fire">Ecosystem</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A complete DeFi platform — swap, lend, stake, govern, and grow.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card"
            >
              <item.icon className="mb-4 h-6 w-6 text-primary" />
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
