import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is DeFi?",
    answer:
      "DeFi stands for Decentralized Finance — financial services like trading, lending, and borrowing that run on blockchain technology without traditional banks or intermediaries. TwinFlame Finance is a DeFi platform built on this principle.",
  },
  {
    question: "How do I buy BLAZE, EMBER, or EQT tokens?",
    answer:
      "During initial sales, you can purchase EQT and BLAZE through our website (KYC required for EQT). After launch, BLAZE and EMBER will be available on decentralized exchanges like QuickSwap on Polygon. EQT is a regulated security token with transfer restrictions.",
  },
  {
    question: "What is staking and how does it work?",
    answer:
      "Staking means locking your BLAZE tokens in a smart contract to support the network. In return, you earn EMBER rewards over time. The longer you stake, the more you earn. You can unstake at any time, though longer commitments may unlock boosted reward tiers.",
  },
  {
    question: "How do EQT dividends work?",
    answer:
      "20% of all gross protocol fees are set aside in a dividend pool. Every quarter, a snapshot is taken of EQT holders, and the pool is distributed proportionally in stablecoins (like USDC). If you hold 1% of all EQT, you receive 1% of the quarterly dividend.",
  },
  {
    question: "What makes TwinFlame different from other DeFi protocols?",
    answer:
      "Most DeFi platforms rely on inflationary token printing to pay rewards, which is unsustainable. TwinFlame uses real protocol revenue to fund buybacks, staking rewards, and dividends. Our three-token model ensures each token has a distinct purpose and they reinforce each other in a self-sustaining loop.",
  },
  {
    question: "How does the EMBER-to-BLAZE discount swap work?",
    answer:
      "You can burn EMBER tokens to mint new BLAZE at a 10% discount to the current market price. For example, if BLAZE costs $1.00, you only need $0.90 worth of EMBER. This creates constant demand for EMBER and provides arbitrage opportunities that keep both tokens healthy.",
  },
  {
    question: "Is TwinFlame Finance safe?",
    answer:
      "All smart contracts undergo rigorous security audits by top firms before deployment. We also run a bug bounty program to incentivize responsible disclosure. However, as with any investment — especially in crypto — there are inherent risks. Always do your own research and never invest more than you can afford to lose.",
  },
  {
    question: "What blockchain is TwinFlame built on?",
    answer:
      "TwinFlame launches on Polygon for low fees and fast transactions. In Years 2–3, we plan to expand cross-chain to Arbitrum, Avalanche, and BNB Chain with unified liquidity bridging.",
  },
  {
    question: "How does the buyback-and-burn mechanism work?",
    answer:
      "50% of all platform fees are automatically used to buy BLAZE from the open market. Those purchased tokens are then permanently destroyed (sent to a dead address). This continuously reduces the total supply, creating scarcity and upward price pressure over time.",
  },
  {
    question: "Do I need to verify my identity (KYC)?",
    answer:
      "KYC is only required for purchasing and holding EQT (Equity Token), as it's a regulated security token. BLAZE and EMBER are utility tokens and do not require KYC for trading on decentralized exchanges.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="relative py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Frequently <span className="text-gradient-fire">Asked</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Everything you need to know about TwinFlame Finance, explained simply.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border bg-card/80 px-6 backdrop-blur-sm transition-all data-[state=open]:glow-fire"
              >
                <AccordionTrigger className="text-left font-display text-sm font-semibold hover:no-underline sm:text-base [&[data-state=open]]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
