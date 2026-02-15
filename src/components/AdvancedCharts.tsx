import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Flame, Sparkles, Shield, TrendingUp, BarChart3, Activity } from "lucide-react";

// Animated donut chart using SVG
const AnimatedDonut = ({
  segments,
  size = 220,
  strokeWidth = 28,
  label,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  label: string;
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center">
      <svg ref={ref} width={size} height={size} className="drop-shadow-lg">
        {segments.map((seg, i) => {
          const dashLength = (seg.value / 100) * circumference;
          const dashOffset = -cumulativeOffset;
          cumulativeOffset += dashLength;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{
                opacity: isInView ? 1 : 0,
                transform: `rotate(-90deg)`,
                transformOrigin: "center",
                transition: `opacity 0.5s ${i * 0.1}s, stroke-dasharray 1s ${i * 0.1}s ease-out`,
              }}
            />
          );
        })}
        {/* Center text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="fill-foreground font-display text-lg font-bold"
        >
          {label}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          Allocation
        </text>
      </svg>
    </div>
  );
};

// Animated bar
const AnimatedBar = ({
  value,
  maxValue,
  label,
  color,
  suffix = "",
  delay = 0,
}: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  suffix?: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1200;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        start = Math.round(eased * value);
        setDisplayValue(start);
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    }, delay);
    return () => clearTimeout(timer);
  }, [isInView, value, delay]);

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-display font-bold" style={{ color }}>
          {displayValue}
          {suffix}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted/50">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${(value / maxValue) * 100}%` } : {}}
          transition={{ duration: 1.2, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

// Animated counter
const AnimatedCounter = ({
  target,
  prefix = "",
  suffix = "",
  label,
  icon: Icon,
  color,
  duration = 2000,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: React.ElementType;
  color: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [isInView, target, duration]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="mx-auto mb-3 inline-flex rounded-xl p-3"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div className="font-display text-3xl font-bold" style={{ color }}>
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

// Fee flow sankey-style visualization
const FeeFlowVisualization = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const flows = [
    { label: "Buyback & Burn", pct: 50, color: "hsl(25, 95%, 53%)", icon: Flame, desc: "BLAZE supply reduction" },
    { label: "Staker Rewards", pct: 30, color: "hsl(38, 90%, 55%)", icon: Sparkles, desc: "EMBER to stakers" },
    { label: "EQT Dividends", pct: 20, color: "hsl(200, 80%, 55%)", icon: Shield, desc: "Quarterly payouts" },
  ];

  return (
    <div ref={ref} className="space-y-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="font-display text-lg font-bold">Fee Distribution Flow</h4>
          <p className="text-xs text-muted-foreground">0.3% fee on every transaction</p>
        </div>
      </div>

      {/* Source bar */}
      <div className="overflow-hidden rounded-xl border border-border bg-muted/30 p-1">
        <div className="flex h-10 overflow-hidden rounded-lg">
          {flows.map((flow, i) => (
            <motion.div
              key={flow.label}
              className="flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: flow.color, color: "#000" }}
              initial={{ width: 0 }}
              animate={isInView ? { width: `${flow.pct}%` } : {}}
              transition={{ duration: 0.8, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {flow.pct}%
            </motion.div>
          ))}
        </div>
      </div>

      {/* Flow detail rows */}
      <div className="grid gap-3">
        {flows.map((flow, i) => (
          <motion.div
            key={flow.label}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${flow.color}20` }}
            >
              <flow.icon className="h-5 w-5" style={{ color: flow.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold">{flow.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${flow.color}20`, color: flow.color }}
                >
                  {flow.pct}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{flow.desc}</p>
            </div>
            {/* Animated pulse dot */}
            <div className="relative h-3 w-3">
              <div
                className="absolute inset-0 animate-ping rounded-full opacity-40"
                style={{ backgroundColor: flow.color }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: flow.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const blazeSegments = [
  { value: 40, color: "hsl(25, 95%, 53%)", label: "Community & Ecosystem" },
  { value: 20, color: "hsl(15, 100%, 45%)", label: "Team (3yr vesting)" },
  { value: 15, color: "hsl(38, 90%, 55%)", label: "Treasury" },
  { value: 10, color: "hsl(30, 80%, 40%)", label: "Initial Liquidity" },
  { value: 10, color: "hsl(20, 70%, 35%)", label: "Private Sale" },
  { value: 5, color: "hsl(10, 60%, 30%)", label: "Public Sale" },
];

const eqtSegments = [
  { value: 25, color: "hsl(200, 80%, 55%)", label: "Team & Advisors" },
  { value: 20, color: "hsl(210, 90%, 50%)", label: "Seed Investors" },
  { value: 20, color: "hsl(190, 70%, 45%)", label: "Future Rounds" },
  { value: 15, color: "hsl(220, 60%, 40%)", label: "Treasury Reserve" },
  { value: 10, color: "hsl(180, 50%, 38%)", label: "Community Incentives" },
  { value: 10, color: "hsl(230, 45%, 35%)", label: "Public Sale" },
];

const AdvancedCharts = () => {
  return (
    <section id="charts" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Token <span className="text-gradient-fire">Analytics</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A deep dive into our token distribution, fee mechanics, and projected growth.
          </p>
        </motion.div>

        {/* Key Metrics Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
        >
          <AnimatedCounter target={10} suffix="M" label="BLAZE Supply" icon={Flame} color="hsl(25, 95%, 53%)" />
          <AnimatedCounter target={1} suffix="M" label="EQT Supply" icon={Shield} color="hsl(200, 80%, 55%)" />
          <AnimatedCounter target={20} suffix="%" label="Revenue to EQT" icon={TrendingUp} color="hsl(38, 90%, 55%)" />
          <AnimatedCounter target={50} suffix="%" label="Fees to Burn" icon={BarChart3} color="hsl(15, 100%, 45%)" />
        </motion.div>

        {/* Allocation Charts */}
        <div className="mb-16 grid gap-10 lg:grid-cols-2">
          {/* BLAZE Allocation */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm"
          >
            <h3 className="mb-6 font-display text-xl font-bold">
              <span className="text-blaze">BLAZE</span> Allocation
            </h3>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <AnimatedDonut segments={blazeSegments} label="BLAZE" />
              <div className="flex-1 space-y-2">
                {blazeSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-3 text-sm">
                    <div
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="flex-1 text-muted-foreground">{seg.label}</span>
                    <span className="font-display font-bold">{seg.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* EQT Allocation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm"
          >
            <h3 className="mb-6 font-display text-xl font-bold">
              <span className="text-equity">EQT</span> Allocation
            </h3>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <AnimatedDonut segments={eqtSegments} label="EQT" />
              <div className="flex-1 space-y-2">
                {eqtSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-3 text-sm">
                    <div
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="flex-1 text-muted-foreground">{seg.label}</span>
                    <span className="font-display font-bold">{seg.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fee Distribution + Growth Projections */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Fee Flow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm"
          >
            <FeeFlowVisualization />
          </motion.div>

          {/* Projected Growth */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-ember/10 p-2">
                <TrendingUp className="h-5 w-5 text-ember" />
              </div>
              <div>
                <h4 className="font-display text-lg font-bold">Growth Projections</h4>
                <p className="text-xs text-muted-foreground">Year 1–5 targets</p>
              </div>
            </div>

            <div className="space-y-5">
              <AnimatedBar
                value={10}
                maxValue={500}
                label="Year 1 TVL"
                color="hsl(25, 95%, 53%)"
                suffix="M"
                delay={0}
              />
              <AnimatedBar
                value={50}
                maxValue={500}
                label="Year 2 TVL"
                color="hsl(20, 90%, 50%)"
                suffix="M"
                delay={150}
              />
              <AnimatedBar
                value={150}
                maxValue={500}
                label="Year 3 TVL"
                color="hsl(38, 90%, 55%)"
                suffix="M"
                delay={300}
              />
              <AnimatedBar
                value={300}
                maxValue={500}
                label="Year 4 TVL"
                color="hsl(200, 80%, 55%)"
                suffix="M"
                delay={450}
              />
              <AnimatedBar
                value={500}
                maxValue={500}
                label="Year 5 TVL"
                color="hsl(210, 90%, 50%)"
                suffix="M"
                delay={600}
              />
            </div>

            {/* Revenue projection mini stats */}
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="text-center">
                <div className="font-display text-lg font-bold text-blaze">$2M</div>
                <p className="text-[10px] text-muted-foreground">Year 1 Revenue</p>
              </div>
              <div className="text-center">
                <div className="font-display text-lg font-bold text-ember">$40M</div>
                <p className="text-[10px] text-muted-foreground">Year 3 Revenue</p>
              </div>
              <div className="text-center">
                <div className="font-display text-lg font-bold text-equity">$8M+</div>
                <p className="text-[10px] text-muted-foreground">Annual Dividends</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedCharts;
