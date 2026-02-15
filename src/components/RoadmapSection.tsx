import { motion } from "framer-motion";

const phases = [
  {
    phase: "Year 1",
    title: "Launch & Growth",
    items: ["$1M EQT seed & public sale", "Audited contracts on Polygon", "$10M TVL target", "50K+ community members"],
  },
  {
    phase: "Years 2–3",
    title: "Expansion",
    items: ["Cross-chain: Arbitrum, Avalanche, BNB", "Institutional partnerships", "$40M daily volume", "$8M+ annual EQT dividends"],
  },
  {
    phase: "Years 4–5",
    title: "Industry Leadership",
    items: ["Top 10 DeFi by TVL", "Full DAO decentralization", "Fiat on/off ramps", "Self-sustaining ecosystem"],
  },
];

const RoadmapSection = () => {
  return (
    <section id="roadmap" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            <span className="text-gradient-fire">Roadmap</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From launch to industry leadership — a clear path forward.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-8"
            >
              <div className="mb-1 text-sm font-medium text-primary">{phase.phase}</div>
              <h3 className="font-display text-xl font-bold">{phase.title}</h3>
              <ul className="mt-5 space-y-3">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              {/* Phase number watermark */}
              <div className="absolute -bottom-4 -right-2 font-display text-8xl font-bold text-muted/30">
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
