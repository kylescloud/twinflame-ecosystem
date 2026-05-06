import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Vote, Clock, CheckCircle, XCircle, Users, Hammer, PlayCircle, Ban, Hourglass,
  Plus, RefreshCw, AlertCircle, ExternalLink, Flame, Shield, Loader2, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { CONTRACTS, PROPOSAL_STATE, type ProposalStateName, VOTE_SUPPORT } from "@/lib/contracts";
import {
  useLiveGovernor, type GovernorKind, type LiveProposal,
  castVoteTx, queueTx, executeTx, cancelTx, delegateTx,
} from "@/hooks/useLiveGovernor";
import CreateProposalModal from "@/components/dex/CreateProposalModal";
import ProposalDetailsDrawer from "@/components/dex/ProposalDetailsDrawer";
import { saveVoteRecord, getVoteRecord, SUPPORT_LABEL } from "@/lib/voteHistory";
import { formatUnits } from "ethers";

// ── helpers ────────────────────────────────────────────────────────────────
const nowSec = () => Math.floor(Date.now() / 1000);
const fmtTokens = (raw: string, decimals = 18) => {
  try {
    const n = parseFloat(formatUnits(raw, decimals));
    if (n === 0) return "0";
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toFixed(2);
  } catch { return "0"; }
};
const fmtEta = (etaUnix: number) => {
  const diff = etaUnix - nowSec();
  if (diff <= 0) return "Ready";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
};
const polyscanTx = (hash: string) => `https://polygonscan.com/tx/${hash}`;
const polyscanAddr = (a: string) => `https://polygonscan.com/address/${a}`;

const STATE_CFG: Record<ProposalStateName, { color: string; bg: string; icon: any }> = {
  Pending:   { color: "text-muted-foreground", bg: "bg-muted/30", icon: Hourglass },
  Active:    { color: "text-[hsl(142,70%,50%)]", bg: "bg-[hsl(142,70%,50%)]/10", icon: Clock },
  Canceled:  { color: "text-muted-foreground", bg: "bg-muted/30", icon: Ban },
  Defeated:  { color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
  Succeeded: { color: "text-primary", bg: "bg-primary/10", icon: CheckCircle },
  Queued:    { color: "text-amber-400", bg: "bg-amber-400/10", icon: Hammer },
  Expired:   { color: "text-muted-foreground", bg: "bg-muted/30", icon: Ban },
  Executed:  { color: "text-[hsl(142,70%,50%)]", bg: "bg-[hsl(142,70%,50%)]/10", icon: PlayCircle },
};

// ── deterministic simulated proposals (used when contracts are placeholders) ──
function buildSimProposals(kind: GovernorKind): LiveProposal[] {
  const baseBlock = 58_400_000;
  const t = nowSec();
  const mk = (overrides: Partial<LiveProposal>): LiveProposal => ({
    proposalId: "0",
    shortId: "0",
    proposer: "0x0000000000000000000000000000000000000000",
    description: "",
    title: "",
    targets: ["0x0000000000000000000000000000000000000000"],
    values: ["0"],
    calldatas: ["0x"],
    descriptionHash: "0x" + "0".repeat(64),
    voteStart: baseBlock,
    voteEnd: baseBlock + 50_400,
    state: "Active",
    forVotes: "0",
    againstVotes: "0",
    abstainVotes: "0",
    quorum: "1000000000000000000000000",
    etaUnix: 0,
    needsQueuing: true,
    hasVoted: false,
    userWeight: "0",
    ...overrides,
  });
  if (kind === "blaze") {
    return [
      mk({
        proposalId: "94283000001", shortId: "94283…01",
        title: "Increase BLAZE burn rate to 55%",
        description: "Increase BLAZE burn share from 50% → 55% of swap fees.\n\nReduces staker rewards from 30% → 25%.",
        proposer: "0x8a3f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
        forVotes: "850000" + "0".repeat(18),
        againstVotes: "320000" + "0".repeat(18),
        abstainVotes: "12000" + "0".repeat(18),
        state: "Active",
      }),
      mk({
        proposalId: "94283000002", shortId: "94283…02",
        title: "Add WBTC lending market",
        description: "Calls TwinFlameLending.listPool(WBTC, 320, 540).",
        proposer: "0x7c2d9e4a5f6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
        forVotes: "1200000" + "0".repeat(18),
        againstVotes: "180000" + "0".repeat(18),
        state: "Queued", etaUnix: t + 86_400,
      }),
      mk({
        proposalId: "94283000003", shortId: "94283…03",
        title: "Reduce P2P creation fee to 0.3%",
        description: "Reduce protocolFeeBps from 50 → 30.",
        proposer: "0x5f1a8b3d4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
        forVotes: "450000" + "0".repeat(18),
        againstVotes: "680000" + "0".repeat(18),
        state: "Defeated",
      }),
      mk({
        proposalId: "94283000004", shortId: "94283…04",
        title: "Initial protocol parameters",
        description: "Set initial swap and lending parameters per whitepaper.",
        proposer: "0x1111111111111111111111111111111111111111",
        forVotes: "1800000" + "0".repeat(18),
        againstVotes: "24000" + "0".repeat(18),
        state: "Executed", etaUnix: t - 172_800,
      }),
    ];
  }
  return [
    mk({
      proposalId: "10293000001", shortId: "10293…01",
      title: "Q1 2026 Dividend Distribution",
      description: "Approve EQTDividendDistributor.distribute($32,940 USDC).",
      proposer: "0x2222222222222222222222222222222222222222",
      forVotes: "95000" + "0".repeat(18),
      againstVotes: "5000" + "0".repeat(18),
      quorum: "80000" + "0".repeat(18),
      state: "Active",
    }),
    mk({
      proposalId: "10293000002", shortId: "10293…02",
      title: "10% treasury → market making",
      description: "Allocate 10% of EQT treasury to BLAZE/USDC + EMBER/USDC market making.",
      proposer: "0x9e4c7b2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d",
      forVotes: "88000" + "0".repeat(18),
      againstVotes: "12000" + "0".repeat(18),
      quorum: "80000" + "0".repeat(18),
      state: "Succeeded",
    }),
    mk({
      proposalId: "10293000003", shortId: "10293…03",
      title: "Treasury diversification → USDC",
      description: "Convert 20% of treasury holdings to USDC for dividend stability.",
      proposer: "0x2222222222222222222222222222222222222222",
      forVotes: "92000" + "0".repeat(18),
      againstVotes: "8000" + "0".repeat(18),
      quorum: "80000" + "0".repeat(18),
      state: "Executed", etaUnix: t - 604_800,
    }),
  ];
}

// ── proposal card ──────────────────────────────────────────────────────────
interface CardProps {
  p: LiveProposal;
  governorAddress: string;
  isLive: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onAction: () => void;
}

function ProposalCard({ p, governorAddress, isLive, isConnected, onConnect, onAction }: CardProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);

  const cfg = STATE_CFG[p.state];
  const forN  = parseFloat(formatUnits(p.forVotes || "0", 18));
  const agnN  = parseFloat(formatUnits(p.againstVotes || "0", 18));
  const absN  = parseFloat(formatUnits(p.abstainVotes || "0", 18));
  const total = forN + agnN + absN;
  const forPct = total > 0 ? (forN / total) * 100 : 0;
  const agnPct = total > 0 ? (agnN / total) * 100 : 0;
  const quorumN = parseFloat(formatUnits(p.quorum || "0", 18));
  const quorumPct = quorumN > 0 ? Math.min(100, (total / quorumN) * 100) : 0;
  const quorumMet = quorumN > 0 && total >= quorumN;
  const etaReady = p.etaUnix > 0 && p.etaUnix <= nowSec();

  const run = async (label: string, fn: () => Promise<any>) => {
    if (!isConnected) { onConnect(); return; }
    setBusy(label);
    try {
      if (!isLive) {
        await new Promise((r) => setTimeout(r, 600));
        toast({ title: `Simulated: ${label}`, description: "Contract not deployed — would execute on-chain." });
        onAction();
        return;
      }
      const tx = await fn();
      toast({
        title: `${label} submitted`,
        description: `Tx: ${tx.hash.slice(0, 10)}…`,
      });
      await tx.wait();
      toast({ title: `${label} confirmed`, description: `Proposal ${p.shortId}` });
      onAction();
    } catch (e: any) {
      toast({
        title: `${label} failed`,
        description: e?.shortMessage || e?.message || "Transaction rejected",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const vote = (support: 0 | 1 | 2, label: string) =>
    run(label, () => castVoteTx(governorAddress, p.proposalId, support, reason));

  const queueP = () =>
    run("Queue", () => queueTx(governorAddress, p.targets, p.values, p.calldatas, p.descriptionHash));

  const executeP = () =>
    run("Execute", () => executeTx(governorAddress, p.targets, p.values, p.calldatas, p.descriptionHash));

  const cancelP = () =>
    run("Cancel", () => cancelTx(governorAddress, p.targets, p.values, p.calldatas, p.descriptionHash));

  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs text-muted-foreground">#{p.shortId}</span>
              <span className={`rounded-full ${cfg.bg} px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                <cfg.icon className="mr-0.5 inline h-2.5 w-2.5" /> {p.state}
              </span>
              {p.hasVoted && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  You voted
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-foreground">{p.title}</h3>
            <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground line-clamp-3">
              {p.description.split("\n").slice(1).join("\n").trim() || p.description}
            </p>
          </div>
        </div>

        {/* Vote bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[hsl(142,70%,50%)]">For: {forN < 1000 ? forN.toFixed(1) : `${(forN / 1000).toFixed(1)}K`} · {forPct.toFixed(0)}%</span>
            <span className="text-destructive">Against: {agnN < 1000 ? agnN.toFixed(1) : `${(agnN / 1000).toFixed(1)}K`} · {agnPct.toFixed(0)}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted/40">
            <div className="h-full bg-[hsl(142,70%,50%)]" style={{ width: `${forPct}%` }} />
            <div className="h-full bg-destructive" style={{ width: `${agnPct}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Abstain: {absN < 1000 ? absN.toFixed(1) : `${(absN / 1000).toFixed(1)}K`}</p>
        </div>

        {/* Quorum */}
        <div className="mb-3">
          <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              Quorum {quorumMet && <CheckCircle className="h-2.5 w-2.5 text-[hsl(142,70%,50%)]" />} ({quorumPct.toFixed(0)}%)
            </span>
            <span>{fmtTokens(((BigInt(p.forVotes) + BigInt(p.againstVotes) + BigInt(p.abstainVotes))).toString())} / {fmtTokens(p.quorum)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted/40">
            <div className={`h-full rounded-full ${quorumMet ? "bg-[hsl(142,70%,50%)]" : "bg-primary"}`} style={{ width: `${quorumPct}%` }} />
          </div>
        </div>

        {/* Timelock info */}
        {p.state === "Queued" && (
          <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Hammer className="h-3 w-3" />
              <span className="font-semibold">In timelock</span>
              <span className="text-amber-200/70">— executable {etaReady ? "now" : `in ${fmtEta(p.etaUnix)}`}</span>
            </div>
          </div>
        )}

        {/* Actions block (for Active proposals) */}
        {p.state === "Active" && showReason && (
          <Textarea
            placeholder="Optional vote reason…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mb-2 text-xs"
          />
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <a href={polyscanAddr(p.proposer)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
              {p.proposer.slice(0, 6)}…{p.proposer.slice(-4)} <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <span>· snapshot #{p.voteStart.toLocaleString()}</span>
            <span>· ends #{p.voteEnd.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.state === "Active" && !p.hasVoted && (
              <>
                <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setShowReason((v) => !v)}>
                  {showReason ? "Hide reason" : "+ reason"}
                </Button>
                <Button size="sm" variant="outline" disabled={!!busy}
                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => vote(VOTE_SUPPORT.Against, "Vote Against")}>
                  {busy === "Vote Against" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Against"}
                </Button>
                <Button size="sm" variant="outline" disabled={!!busy}
                  className="h-7 text-xs text-muted-foreground border-border/50"
                  onClick={() => vote(VOTE_SUPPORT.Abstain, "Vote Abstain")}>
                  {busy === "Vote Abstain" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Abstain"}
                </Button>
                <Button size="sm" disabled={!!busy}
                  className="h-7 bg-[hsl(142,70%,50%)] text-background text-xs hover:opacity-90"
                  onClick={() => vote(VOTE_SUPPORT.For, "Vote For")}>
                  {busy === "Vote For" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Vote For"}
                </Button>
              </>
            )}
            {p.state === "Succeeded" && (
              <Button size="sm" disabled={!!busy}
                className="h-7 bg-amber-500 text-background text-xs hover:opacity-90" onClick={queueP}>
                {busy === "Queue" ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Hammer className="mr-1 h-3 w-3" /> Queue</>}
              </Button>
            )}
            {p.state === "Queued" && (
              <Button size="sm" disabled={!!busy || !etaReady}
                className="h-7 bg-gradient-fire text-primary-foreground text-xs hover:opacity-90"
                onClick={executeP}>
                {busy === "Execute" ? <Loader2 className="h-3 w-3 animate-spin" /> : <><PlayCircle className="mr-1 h-3 w-3" /> Execute</>}
              </Button>
            )}
            {(p.state === "Pending" || p.state === "Active") && (
              <Button size="sm" variant="ghost" disabled={!!busy}
                className="h-7 text-[10px] text-muted-foreground" onClick={cancelP}>
                {busy === "Cancel" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalSkeleton() {
  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-1 w-full" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── governor panel ─────────────────────────────────────────────────────────
function GovernorPanel({
  kind,
  account,
  onConnect,
  isConnecting,
}: {
  kind: GovernorKind;
  account: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}) {
  const { toast } = useToast();
  const live = useLiveGovernor(kind, account);
  const [showCreate, setShowCreate] = useState(false);
  const [delegating, setDelegating] = useState(false);

  const proposals: LiveProposal[] = useMemo(() => {
    if (live.isLive) return live.proposals;
    return buildSimProposals(kind);
  }, [live.isLive, live.proposals, kind]);

  const params = kind === "blaze"
    ? { quorumPct: 4, threshold: "100K BLAZE", logo: TOKEN_LOGOS.BLAZE, label: "BLAZE Governor", icon: Flame }
    : { quorumPct: 10, threshold: "1K EQT", logo: TOKEN_LOGOS.EQT, label: "EQT Governor", icon: Shield };

  const handleDelegate = async () => {
    if (!account) { onConnect(); return; }
    setDelegating(true);
    try {
      if (!live.isLive) {
        await new Promise((r) => setTimeout(r, 500));
        toast({ title: "Simulated delegation", description: "Would delegate voting power to self." });
      } else {
        const tx = await delegateTx(live.tokenAddress, account);
        toast({ title: "Delegate submitted", description: `Tx: ${tx.hash.slice(0, 10)}…` });
        await tx.wait();
        toast({ title: "Delegated", description: "Voting power activated." });
        live.refresh();
      }
    } catch (e: any) {
      toast({ title: "Delegate failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setDelegating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Quorum: {params.quorumPct}% · Threshold: {params.threshold} · Voting period: 7d
          </p>
          {account && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your voting power: <span className="font-mono text-foreground">{fmtTokens(live.votingPower)}</span>
              {live.votingPower === "0" && (
                <Button size="sm" variant="link" className="ml-1 h-auto p-0 text-xs" onClick={handleDelegate} disabled={delegating}>
                  {delegating ? "Delegating…" : "Activate (delegate to self)"}
                </Button>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => live.refresh()} disabled={live.loading}>
            <RefreshCw className={`mr-1 h-3 w-3 ${live.loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          {account ? (
            <Button size="sm" className="bg-gradient-fire text-primary-foreground" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-3 w-3" /> New proposal
            </Button>
          ) : (
            <Button size="sm" className="bg-gradient-fire text-primary-foreground" onClick={onConnect} disabled={isConnecting}>
              Connect to vote
            </Button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {!live.isLive && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Simulated mode — {params.label} address is a placeholder.
            Once <code className="font-mono">CONTRACTS.{kind === "blaze" ? "BLAZE_GOVERNOR" : "EQT_GOVERNOR"}</code> is set
            to a deployed address, all calls will route on-chain (propose, castVote, queue, execute, cancel).
          </span>
        </div>
      )}
      {live.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{live.error}</span>
        </div>
      )}

      {/* Proposals */}
      {live.loading && live.isLive ? (
        <>
          <ProposalSkeleton /><ProposalSkeleton /><ProposalSkeleton />
        </>
      ) : proposals.length === 0 ? (
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No proposals yet. Be the first to submit one.
          </CardContent>
        </Card>
      ) : (
        proposals.map((p) => (
          <ProposalCard
            key={p.proposalId}
            p={p}
            governorAddress={live.governorAddress}
            isLive={live.isLive}
            isConnected={!!account}
            onConnect={onConnect}
            onAction={() => live.refresh()}
          />
        ))
      )}

      <CreateProposalModal
        open={showCreate}
        onOpenChange={setShowCreate}
        governorAddress={live.governorAddress}
        governorLabel={params.label}
        isLive={live.isLive}
        onSubmitted={() => live.refresh()}
      />
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
const DexGovernance = () => {
  const { address, connect, isConnecting } = useWallet();
  const blaze = useLiveGovernor("blaze", address);
  const eqt = useLiveGovernor("eqt", address);

  const allProposals = useMemo(() => {
    const b = blaze.isLive ? blaze.proposals : buildSimProposals("blaze");
    const e = eqt.isLive ? eqt.proposals : buildSimProposals("eqt");
    return [...b, ...e];
  }, [blaze.isLive, blaze.proposals, eqt.isLive, eqt.proposals]);

  const stats = useMemo(() => {
    const totalCast = allProposals.reduce((s, p) => {
      try { return s + BigInt(p.forVotes) + BigInt(p.againstVotes) + BigInt(p.abstainVotes); }
      catch { return s; }
    }, 0n);
    return {
      active: allProposals.filter((p) => p.state === "Active").length,
      queued: allProposals.filter((p) => p.state === "Queued").length,
      executed: allProposals.filter((p) => p.state === "Executed").length,
      totalCast: fmtTokens(totalCast.toString()),
    };
  }, [allProposals]);

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
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <a href={polyscanAddr(CONTRACTS.BLAZE_GOVERNOR)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            BLAZE Governor: {CONTRACTS.BLAZE_GOVERNOR.slice(0, 8)}… <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <a href={polyscanAddr(CONTRACTS.EQT_GOVERNOR)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            EQT Governor: {CONTRACTS.EQT_GOVERNOR.slice(0, 8)}… <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <a href={polyscanAddr(CONTRACTS.TIMELOCK)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            Timelock: {CONTRACTS.TIMELOCK.slice(0, 8)}… <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Proposals", value: stats.active.toString(), icon: Clock, color: "text-[hsl(142,70%,50%)]" },
          { label: "In Timelock Queue", value: stats.queued.toString(), icon: Hammer, color: "text-amber-400" },
          { label: "Total Votes Cast", value: stats.totalCast, icon: Users, color: "text-primary" },
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
            <Clock className="mr-1.5 h-3.5 w-3.5" /> My Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blaze">
          <GovernorPanel kind="blaze" account={address} onConnect={connect} isConnecting={isConnecting} />
        </TabsContent>
        <TabsContent value="eqt">
          <GovernorPanel kind="eqt" account={address} onConnect={connect} isConnecting={isConnecting} />
        </TabsContent>
        <TabsContent value="history" className="space-y-3">
          {!address ? (
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Connect your wallet to see your votes and proposals.
              </CardContent>
            </Card>
          ) : (
            <>
              {[...(blaze.isLive ? blaze.proposals : buildSimProposals("blaze")),
                ...(eqt.isLive ? eqt.proposals : buildSimProposals("eqt"))]
                .filter((p) => p.hasVoted || p.proposer.toLowerCase() === address.toLowerCase())
                .map((p) => (
                  <Card key={p.proposalId} className="border-border/40 bg-card/60">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">#{p.shortId}</span>
                          <span className="truncate text-sm font-medium text-foreground">{p.title}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {p.proposer.toLowerCase() === address.toLowerCase() ? "You proposed" : "You voted"} · state: {p.state}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATE_CFG[p.state].bg} ${STATE_CFG[p.state].color}`}>
                        {p.state}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              {[...blaze.proposals, ...eqt.proposals].filter((p) => p.hasVoted || p.proposer.toLowerCase() === address.toLowerCase()).length === 0 &&
                blaze.isLive && eqt.isLive && (
                <Card className="border-border/40 bg-card/60">
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    No governance activity yet. Vote on an active proposal or submit one.
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DexGovernance;
