import { motion } from "framer-motion";
import { ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

const TokenomicsDiagram = () => {
  return (
    <section className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            How It <span className="text-gradient-fire">Works</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A self-sustaining loop where every action strengthens the ecosystem.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          {/* Desktop layout */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="flex items-start justify-center">
                <TokenNode
                  logo={TOKEN_LOGOS.BLAZE}
                  animClass="animate-blaze-burn"
                  name="BLAZE"
                  subtitle="Store of Value"
                  color="blaze"
                  glowClass="glow-fire"
                  details={["10M fixed supply", "Governance voting", "Buyback & burn"]}
                />
              </div>

              <div className="my-2 flex items-center justify-center gap-32">
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-5 w-5 text-blaze animate-pulse-glow" />
                  <span className="mt-1 text-xs font-medium text-blaze">Stake BLAZE</span>
                  <span className="text-[10px] text-muted-foreground">Earn EMBER</span>
                  <ArrowDown className="h-5 w-5 text-blaze animate-pulse-glow" />
                </div>
                <div className="flex flex-col items-center">
                  <ArrowUp className="h-5 w-5 text-ember animate-pulse-glow" />
                  <span className="mt-1 text-xs font-medium text-ember">Burn EMBER</span>
                  <span className="text-[10px] text-muted-foreground">Mint at 10% discount</span>
                  <ArrowUp className="h-5 w-5 text-ember animate-pulse-glow" />
                </div>
              </div>

              <div className="flex items-start justify-center gap-16">
                <TokenNode
                  logo={TOKEN_LOGOS.EMBER}
                  animClass="animate-ember-float"
                  name="EMBER"
                  subtitle="Utility Fuel"
                  color="ember"
                  glowClass="glow-ember"
                  details={["Uncapped supply", "Reduced fees", "Constant burn"]}
                />

                <div className="flex flex-col items-center justify-center self-center">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-gradient-to-r from-ember to-equity" />
                    <span className="text-[10px] text-muted-foreground">Protocol Fees</span>
                    <div className="h-px w-8 bg-gradient-to-r from-equity to-ember" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-equity animate-pulse-glow" />
                  <span className="text-xs font-medium text-equity">20% Revenue</span>
                </div>

                <TokenNode
                  logo={TOKEN_LOGOS.EQT}
                  animClass="animate-eqt-breathe"
                  name="EQT"
                  subtitle="Revenue Share"
                  color="equity"
                  glowClass="glow-equity"
                  details={["1M fixed supply", "Quarterly dividends", "Treasury governance"]}
                />
              </div>

              <div className="mt-8 flex justify-center">
                <div className="rounded-xl border border-border bg-card/80 px-6 py-3 text-center backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-blaze">Fees</span> → <span className="font-semibold text-blaze">Buyback & Burn</span> → <span className="font-semibold text-ember">Scarcity</span> → <span className="font-semibold text-equity">Value Growth</span> → <span className="font-semibold text-equity">Dividends</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="flex flex-col items-center gap-4">
              <TokenNode
                logo={TOKEN_LOGOS.BLAZE}
                animClass="animate-blaze-burn"
                name="BLAZE"
                subtitle="Store of Value"
                color="blaze"
                glowClass="glow-fire"
                details={["10M fixed supply", "Governance voting", "Buyback & burn"]}
              />

              <FlowArrow label="Stake BLAZE → Earn EMBER" color="blaze" />

              <TokenNode
                logo={TOKEN_LOGOS.EMBER}
                animClass="animate-ember-float"
                name="EMBER"
                subtitle="Utility Fuel"
                color="ember"
                glowClass="glow-ember"
                details={["Uncapped supply", "Burn for BLAZE at 10% discount", "Reduced fees"]}
              />

              <FlowArrow label="Protocol Fees → 20% Revenue" color="equity" />

              <TokenNode
                logo={TOKEN_LOGOS.EQT}
                animClass="animate-eqt-breathe"
                name="EQT"
                subtitle="Revenue Share"
                color="equity"
                glowClass="glow-equity"
                details={["1M fixed supply", "Quarterly dividends", "Treasury governance"]}
              />

              <div className="rounded-xl border border-border bg-card/80 px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-blaze">Fees</span> → <span className="font-semibold text-blaze">Burn</span> → <span className="font-semibold text-ember">Scarcity</span> → <span className="font-semibold text-equity">Growth</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TokenNode = ({
  logo,
  animClass,
  name,
  subtitle,
  color,
  glowClass,
  details,
}: {
  logo: string;
  animClass: string;
  name: string;
  subtitle: string;
  color: string;
  glowClass: string;
  details: string[];
}) => (
  <div className={`relative w-56 rounded-2xl border border-border bg-card p-5 text-center ${glowClass} transition-all hover:scale-105`}>
    <div className="mx-auto mb-3 flex justify-center">
      <img src={logo} alt={`${name} token`} className={`h-12 w-12 rounded-full ${animClass}`} />
    </div>
    <h3 className="font-display text-lg font-bold">{name}</h3>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
    <ul className="mt-3 space-y-1">
      {details.map((d) => (
        <li key={d} className="text-xs text-muted-foreground">{d}</li>
      ))}
    </ul>
    <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-${color}/5 blur-2xl`} />
  </div>
);

const FlowArrow = ({ label, color }: { label: string; color: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`h-6 w-px bg-${color}/40`} />
    <span className={`text-xs font-medium text-${color}`}>{label}</span>
    <ArrowDown className={`h-4 w-4 text-${color} animate-pulse-glow`} />
  </div>
);

export default TokenomicsDiagram;
