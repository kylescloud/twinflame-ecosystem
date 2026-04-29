import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Vote, Shield, Flame, Clock, CheckCircle, XCircle, Users, Hammer, PlayCircle, Ban, Hourglass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { PROPOSAL_STATE, type ProposalStateName } from "@/lib/contracts";

interface Proposal {
  id: string;
  proposalId: string; // bigint as string
  title: string;
  description: string;
  proposer: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  state: ProposalStateName;
  snapshotBlock: number;
  deadlineBlock: number;
  etaUnix: number; // 0 if not queued
  quorum: number;
  category: string;
  hasVoted?: boolean;
}

const nowSec = () => Math.floor(Date.now() / 1000);

const BLAZE_PROPOSALS: Proposal[] = [
  { id: "BIP-7", proposalId: "94283…1f", title: "Increase BLAZE burn rate to 55%", description: "Increase the protocol burn share from 50% → 55% of swap fees, reducing staker rewards from 30% → 25%. Modifies FeeDistributor BURN_BPS / REWARD_BPS via Timelock proposal.", proposer: "0x8a3f…1b2c", forVotes: 850000, againstVotes: 320000, abstainVotes: 12000, state: "Active", snapshotBlock: 58_412_300, deadlineBlock: 58_462_700, etaUnix: 0, quorum: 1_000_000, category: "Tokenomics" },
  { id: "BIP-6", proposalId: "94283…2a", title: "Add WBTC lending market", description: "Calls TwinFlameLending.listPool(WBTC, 320, 540) — 3.2% supply APY, 5.4% borrow APY, 70% collateral factor.", proposer: "0x7c2d…9e4a", forVotes: 1_200_000, againstVotes: 180_000, abstainVotes: 4_000, state: "Queued", snapshotBlock: 58_310_000, deadlineBlock: 58_360_400, etaUnix: nowSec() + 86_400, quorum: 1_000_000, category: "Markets" },
  { id: "BIP-5", proposalId: "94283…3b", title: "Reduce P2P creation fee to 0.3%", description: "Reduce TwinFlameLending.protocolFeeBps from 50 → 30 to incentivize P2P lending volume.", proposer: "0x5f1a…8b3d", forVotes: 450_000, againstVotes: 680_000, abstainVotes: 8_000, state: "Defeated", snapshotBlock: 58_205_000, deadlineBlock: 58_255_400, etaUnix: 0, quorum: 1_000_000, category: "Fees" },
  { id: "BIP-4", proposalId: "94283…4c", title: "Initial protocol parameters", description: "Set initial swap and lending parameters per whitepaper.", proposer: "Founding Multisig", forVotes: 1_800_000, againstVotes: 24_000, abstainVotes: 1_000, state: "Executed", snapshotBlock: 58_100_000, deadlineBlock: 58_150_400, etaUnix: nowSec() - 172_800, quorum: 1_000_000, category: "Core" },
];

const EQT_PROPOSALS: Proposal[] = [
  { id: "EIP-3", proposalId: "10293…7a", title: "Q1 2026 Dividend Distribution", description: "Approve EQTDividendDistributor.distribute($32,940 USDC) proportional to EQT holdings at snapshot block 58,400,000.", proposer: "Treasury Council", forVotes: 95_000, againstVotes: 5_000, abstainVotes: 800, state: "Active", snapshotBlock: 58_400_000, deadlineBlock: 58_450_400, etaUnix: 0, quorum: 80_000, category: "Dividends" },
  { id: "EIP-2", proposalId: "10293…8b", title: "10% treasury → market making", description: "Allocate 10% of EQT treasury to fund BLAZE/USDC + EMBER/USDC market making operations.", proposer: "0x9e4c…7b2f", forVotes: 88_000, againstVotes: 12_000, abstainVotes: 600, state: "Succeeded", snapshotBlock: 58_300_000, deadlineBlock: 58_350_400, etaUnix: 0, quorum: 80_000, category: "Treasury" },
  { id: "EIP-1", proposalId: "10293…9c", title: "Treasury diversification → USDC", description: "Convert 20% of treasury holdings to USDC for dividend stability.", proposer: "Treasury Council", forVotes: 92_000, againstVotes: 8_000, abstainVotes: 200, state: "Executed", snapshotBlock: 58_150_000, deadlineBlock: 58_200_400, etaUnix: nowSec() - 604_800, quorum: 80_000, category: "Treasury" },
];

const STATE_CFG: Record<ProposalStateName, { color: string; bg: string; icon: any }> = {
  Pending:  { color: "text-muted-foreground", bg: "bg-muted/30", icon: Hourglass },
  Active:   { color: "text-[hsl(142,70%,50%)]", bg: "bg-[hsl(142,70%,50%)]/10", icon: Clock },
  Canceled: { color: "text-muted-foreground", bg: "bg-muted/30", icon: Ban },
  Defeated: { color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
  Succeeded:{ color: "text-primary", bg: "bg-primary/10", icon: CheckCircle },
  Queued:   { color: "text-amber-400", bg: "bg-amber-400/10", icon: Hammer },
  Expired:  { color: "text-muted-foreground", bg: "bg-muted/30", icon: Ban },
  Executed: { color: "text-[hsl(142,70%,50%)]", bg: "bg-[hsl(142,70%,50%)]/10", icon: PlayCircle },
};

const formatEta = (etaUnix: number) => {
  const diff = etaUnix - nowSec();
  if (diff <= 0) return "Ready";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
};

const DexGovernance = () => {
  const { address, connect, isConnecting } = useWallet();
  const { toast } = useToast();
  const [voteHistory, setVoteHistory] = useState<{ id: string; support: "For" | "Against" | "Abstain"; weight: number; timestamp: number }[]>([
    { id: "BIP-6", support: "For", weight: 12_500, timestamp: nowSec() - 86_400 * 3 },
    { id: "BIP-5", support: "Against", weight: 12_500, timestamp: nowSec() - 86_400 * 8 },
    { id: "EIP-2", support: "For", weight: 320, timestamp: nowSec() - 86_400 * 21 },
  ]);

  const handleVote = (p: Proposal, support: "For" | "Against" | "Abstain") => {
    if (!address) { connect(); return; }
    setVoteHistory((h) => [{ id: p.id, support, weight: 12_500, timestamp: nowSec() }, ...h]);
    toast({
      title: `Vote cast`,
      description: `castVote(${p.proposalId}, ${support === "For" ? 1 : support === "Against" ? 0 : 2})`,
    });
  };

  const handleQueue = (p: Proposal) => {
    if (!address) { connect(); return; }
    toast({ title: "Queued via Timelock", description: `${p.id} queued — 48h delay before execution.` });
  };

  const handleExecute = (p: Proposal) => {
    if (!address) { connect(); return; }
    if (p.etaUnix > nowSec()) {
      toast({ title: "Timelock not ready", description: `Wait ${formatEta(p.etaUnix)} before executing.`, variant: "destructive" });
      return;
    }
    toast({ title: "Executed", description: `${p.id} executed via TwinFlameTimelock.` });
  };

  const ProposalCard = ({ p }: { p: Proposal }) => {
    const cfg = STATE_CFG[p.state];
    const totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
    const forPct = totalVotes > 0 ? (p.forVotes / totalVotes) * 100 : 0;
    const againstPct = totalVotes > 0 ? (p.againstVotes / totalVotes) * 100 : 0;
    const quorumPct = Math.min(100, (totalVotes / p.quorum) * 100);
    const quorumMet = totalVotes >= p.quorum;
    const userVoted = voteHistory.some((v) => v.id === p.id);

    return (
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-5">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                <span className={`rounded-full ${cfg.bg} px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                  <cfg.icon className="mr-0.5 inline h-2.5 w-2.5" /> {p.state}
                </span>
                <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">{p.category}</span>
                {userVoted && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">You voted</span>
                )}
              </div>
              <h3 className="font-display font-bold text-foreground">{p.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">id: {p.proposalId}</p>
            </div>
          </div>

          {/* Vote bar */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[hsl(142,70%,50%)]">For: {(p.forVotes / 1000).toFixed(1)}K · {forPct.toFixed(0)}%</span>
              <span className="text-destructive">Against: {(p.againstVotes / 1000).toFixed(1)}K · {againstPct.toFixed(0)}%</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted/40">
              <div className="h-full bg-[hsl(142,70%,50%)]" style={{ width: `${forPct}%` }} />
              <div className="h-full bg-destructive" style={{ width: `${againstPct}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Abstain: {(p.abstainVotes / 1000).toFixed(1)}K</p>
          </div>

          {/* Quorum */}
          <div className="mb-3">
            <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                Quorum {quorumMet ? <CheckCircle className="h-2.5 w-2.5 text-[hsl(142,70%,50%)]" /> : null} ({quorumPct.toFixed(0)}%)
              </span>
              <span>{(totalVotes / 1000).toFixed(0)}K / {(p.quorum / 1000).toFixed(0)}K</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted/40">
              <div className={`h-full rounded-full ${quorumMet ? "bg-[hsl(142,70%,50%)]" : "bg-primary"}`} style={{ width: `${quorumPct}%` }} />
            </div>
          </div>

          {/* Timelock info for queued */}
          {p.state === "Queued" && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Hammer className="h-3 w-3" />
                <span className="font-semibold">In timelock</span>
                <span className="text-amber-200/70">— executable in {formatEta(p.etaUnix)}</span>
              </div>
            </div>
          )}

          {/* Footer + actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              by {p.proposer} · snapshot #{p.snapshotBlock.toLocaleString()} · ends #{p.deadlineBlock.toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-2">
              {p.state === "Active" && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleVote(p, "Against")}>
                    Against
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-muted-foreground border-border/50" onClick={() => handleVote(p, "Abstain")}>
                    Abstain
                  </Button>
                  <Button size="sm" className="h-7 bg-[hsl(142,70%,50%)] text-background text-xs hover:opacity-90" onClick={() => handleVote(p, "For")}>
                    Vote For
                  </Button>
                </>
              )}
              {p.state === "Succeeded" && (
                <Button size="sm" className="h-7 bg-amber-500 text-background text-xs hover:opacity-90" onClick={() => handleQueue(p)}>
                  <Hammer className="mr-1 h-3 w-3" /> Queue
                </Button>
              )}
              {p.state === "Queued" && (
                <Button
                  size="sm"
                  disabled={p.etaUnix > nowSec()}
                  className="h-7 bg-gradient-fire text-primary-foreground text-xs hover:opacity-90"
                  onClick={() => handleExecute(p)}
                >
                  <PlayCircle className="mr-1 h-3 w-3" /> Execute
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const allProposals = useMemo(() => [...BLAZE_PROPOSALS, ...EQT_PROPOSALS], []);
  const stats = useMemo(() => ({
    active: allProposals.filter((p) => p.state === "Active").length,
    queued: allProposals.filter((p) => p.state === "Queued").length,
    executed: allProposals.filter((p) => p.state === "Executed").length,
    totalCast: allProposals.reduce((s, p) => s + p.forVotes + p.againstVotes + p.abstainVotes, 0),
  }), [allProposals]);

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-1 flex items-center gap-3">
          <Vote className="h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Governance</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          BLAZE governs protocol parameters · EQT governs treasury & dividends · 48h Timelock on all executions
        </p>
      </motion.div>

      {/* Stats — every value is on-chain derivable */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Proposals", value: stats.active.toString(), icon: Clock, color: "text-[hsl(142,70%,50%)]" },
          { label: "In Timelock Queue", value: stats.queued.toString(), icon: Hammer, color: "text-amber-400" },
          { label: "Total Votes Cast", value: `${(stats.totalCast / 1e6).toFixed(2)}M`, icon: Users, color: "text-primary" },
          { label: "Executed All-Time", value: stats.executed.toString(), icon: PlayCircle, color: "text-[hsl(142,70%,50%)]" },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
              <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="blaze" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="blaze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <img src={TOKEN_LOGOS.BLAZE} alt="" className="mr-1.5 h-4 w-4 rounded-full" /> BLAZE Governor
          </TabsTrigger>
          <TabsTrigger value="eqt" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <img src={TOKEN_LOGOS.EQT} alt="" className="mr-1.5 h-4 w-4 rounded-full" /> EQT Governor
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="mr-1.5 h-3.5 w-3.5" /> My Vote History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blaze" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quorum: 4% · Threshold: 100K BLAZE · Voting period: 7d</p>
            </div>
            {!address && (
              <Button onClick={connect} disabled={isConnecting} size="sm" className="bg-gradient-fire text-primary-foreground">
                Connect to Vote
              </Button>
            )}
          </div>
          {BLAZE_PROPOSALS.map((p) => <ProposalCard key={p.id} p={p} />)}
        </TabsContent>

        <TabsContent value="eqt" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quorum: 10% · Threshold: 1K EQT · KYC-only voters</p>
            </div>
            {!address && (
              <Button onClick={connect} disabled={isConnecting} size="sm" className="bg-gradient-fire text-primary-foreground">
                Connect to Vote
              </Button>
            )}
          </div>
          {EQT_PROPOSALS.map((p) => <ProposalCard key={p.id} p={p} />)}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {voteHistory.length === 0 ? (
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No votes cast yet. Connect your wallet and vote on an active proposal.
              </CardContent>
            </Card>
          ) : (
            voteHistory.map((v, i) => {
              const p = allProposals.find((pp) => pp.id === v.id);
              return (
                <Card key={i} className="border-border/40 bg-card/60">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{v.id}</span>
                        {p && <span className="truncate text-sm font-medium text-foreground">{p.title}</span>}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(v.timestamp * 1000).toLocaleString()} · weight {v.weight.toLocaleString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      v.support === "For" ? "bg-[hsl(142,70%,50%)]/10 text-[hsl(142,70%,50%)]" :
                      v.support === "Against" ? "bg-destructive/10 text-destructive" :
                      "bg-muted/40 text-muted-foreground"
                    }`}>
                      {v.support}
                    </span>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DexGovernance;
