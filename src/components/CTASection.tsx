import { motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";

const CTASection = () => {
  return (
    <section className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 text-center sm:p-16"
        >
          {/* Background glow */}
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />

          <Flame className="mx-auto mb-6 h-10 w-10 text-primary" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready to <span className="text-gradient-fire">Ignite</span> Your Future?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join the TwinFlame ecosystem and be part of the next generation of sustainable decentralized finance.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#tokens"
              className="group flex items-center gap-2 rounded-lg bg-gradient-fire px-8 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Join the Ecosystem
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#"
              className="rounded-lg border border-border bg-muted/30 px-8 py-3.5 font-display text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-muted/50"
            >
              Read Whitepaper
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
