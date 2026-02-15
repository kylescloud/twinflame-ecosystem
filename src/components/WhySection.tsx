import { motion } from "framer-motion";
import { TrendingDown, Unplug, Users, DollarSign } from "lucide-react";

const problems = [
  {
    icon: TrendingDown,
    problem: "Unsustainable Tokenomics",
    solution: "Closed-loop economy where fees fund buybacks, buybacks create scarcity, scarcity drives value.",
  },
  {
    icon: Unplug,
    problem: "Siloed Multi-Token Systems",
    solution: "Three tokens designed from day one to synergize — each strengthening the others.",
  },
  {
    icon: Users,
    problem: "No Profit-Sharing",
    solution: "EQT holders receive 20% of gross revenue as quarterly dividends. Real ownership.",
  },
  {
    icon: DollarSign,
    problem: "Inefficient Capital",
    solution: "Protocol-owned liquidity, circular value creation, and actively managed treasury growth.",
  },
];

const WhySection = () => {
  return (
    <section id="why" className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Why <span className="text-gradient-fire">TwinFlame?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            DeFi is broken. We're building the fix.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {problems.map((item, i) => (
            <motion.div
              key={item.problem}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{item.problem}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.solution}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
