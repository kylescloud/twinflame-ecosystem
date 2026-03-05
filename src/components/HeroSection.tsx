import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <Flame className="h-4 w-4 text-primary" />
          Redefining Sustainable DeFi
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
        >
          The{" "}
          <span className="text-gradient-fire">Trinity of Value</span>
          {" "}in Decentralized Finance
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          Three tokens. One ecosystem. Infinite potential. BLAZE, EMBER, and EQT work in 
          perfect harmony to create a self-sustaining financial organism.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a
            href="#tokens"
            className="group flex items-center gap-2 rounded-lg bg-gradient-fire px-8 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Explore Tokens
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <Link
            to="/dex"
            className="rounded-lg border border-border bg-muted/30 px-8 py-3.5 font-display text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-muted/50"
          >
            Use TwinFlame Swap
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 grid w-full max-w-3xl grid-cols-3 gap-8"
        >
          {[
            { value: "10M", label: "BLAZE Supply" },
            { value: "$230B", label: "DeFi Market by 2030" },
            { value: "20%", label: "Revenue to EQT" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl font-bold text-gradient-fire sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
