import { useState } from "react";
import { motion } from "framer-motion";
import { Vote, Shield, Flame, TrendingUp, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  votesFor: number;
  votesAgainst: number;
  status: "active" | "passed" | "rejected" | "pending";
  endDate: string;
  quorum: number;
  category: string;
}

const BLAZE_PROPOSALS: Proposal[] = [
  { id: "BIP-7", title: "Increase BLAZE burn rate to 55%", description: "Proposal to increase the protocol burn share from 50% to 55% of swap fees, reducing staker rewards to 25%.", proposer: "0x8a3f…1b2c", votesFor: 850000, votesAgainst: 320000, status: "active", endDate: "2026-03-14", quorum: 1000000, category: "Tokenomics" },
  { id: "BIP-6", title: "Add WBTC lending market", description: "Enable WBTC as a supported asset in the pooled lending market with 70% collateral factor.", proposer: "0x7c2d…9e4a", votesFor: 1200000, votesAgainst: 180000, status: "passed", endDate: "2026-03-01", quorum: 1000000, category: "Markets" },
  { id: "BIP-5", title: "Reduce P2P creation fee to 0.3%", description: "Reduce the P2P loan creation fee from 0.5% to 0.3% to incentivize P2P lending adoption.", proposer: "0x5f1a…8b3d", votesFor: 450000, votesAgainst: 680000, status: "rejected", endDate: "2026-02-15", quorum: 1000000, category: "Fees" },
];

const EQT_PROPOSALS: Proposal[] = [
  { id: "EIP-3", title: "Q1 2026 Dividend Distribution", description: "Approve distribution of $32,940 in USDC from the EQT dividend pool to all EQT holders, proportional to holdings.", proposer: "Treasury Council", votesFor: 95000, votesAgainst: 5000, status: "active", endDate: "2026-03-20", quorum: 80000, category: "Dividends" },
  { id: "EIP-2", title: "Allocate 10% treasury to market making", description: "Use 10% of the EQT treasury to fund market making operations for BLAZE/USDC and EMBER/USDC pairs.", proposer: "0x9e4c…7b2f", votesFor: 88000, votesAgainst: 12000, status: "passed", endDate: "2026-02-28", quorum: 80000, category: "Treasury" },
  { id: "EIP-1", title: "Treasury diversification into stablecoins", description: "Convert 20% of treasury holdings into USDC to hedge against volatility and ensure sustainable dividend payments.", proposer: "Treasury Council", votesFor: 92000, votesAgainst: 8000, status: "passed", endDate: "2026-01-31", quorum: 80000, category: "Treasury" },
];

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-[hsl(142,70%,50%)]", bg: "bg-[hsl(142,70%,50%)]/10", icon: Clock },
  passed: { label: "Passed", color: "text-primary", bg: "bg-primary/10", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
};

const DexGovernance = () => {
  const { address, connect, isConnecting } = useWallet();
  const { toast } = useToast();

  const handleVote = (proposalId: string, support: boolean) => {
    if (!address) { connect(); return; }
    toast({
      title: `Vote Cast`,
      description: `You voted ${support ? "FOR" : "AGAINST"} proposal ${proposalId}`,
    });
  };

  const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
    const cfg = STATUS_CONFIG[proposal.status];
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPct = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const quorumPct = Math.min(100, (totalVotes / proposal.quorum) * 100);

    return (
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{proposal.id}</span>
                <span className={`rounded-full ${cfg.bg} px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">{proposal.category}</span>
              </div>
              <h3 className="font-display font-bold text-foreground">{proposal.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{proposal.description}</p>
            </div>
          </div>

          {/* Vote Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[hsl(142,70%,50%)]">For: {(proposal.votesFor / 1000).toFixed(0)}K</span>
              <span className="text-destructive">Against: {(proposal.votesAgainst / 1000).toFixed(0)}K</span>
            </div>
            <div className="h-2 rounded-full bg-destructive/20 overflow-hidden">
              <div className="h-full rounded-full bg-[hsl(142,70%,50%)]" style={{ width: `${forPct}%` }} />
            </div>
          </div>

          {/* Quorum */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Quorum ({quorumPct.toFixed(0)}%)</span>
              <span>{(totalVotes / 1000).toFixed(0)}K / {(proposal.quorum / 1000).toFixed(0)}K</span>
            </div>
            <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${quorumPct}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              by {proposal.proposer} · Ends {proposal.endDate}
            </p>
            {proposal.status === "active" && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleVote(proposal.id, false)}>
                  Against
                </Button>
                <Button size="sm" className="h-7 text-xs bg-[hsl(142,70%,50%)] text-background hover:opacity-90" onClick={() => handleVote(proposal.id, true)}>
                  Vote For
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Vote className="h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Governance</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          BLAZE holders govern protocol parameters. EQT holders manage treasury and dividends.
        </p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Proposals", value: "2", icon: Clock, color: "text-[hsl(142,70%,50%)]" },
          { label: "Total Votes Cast", value: "3.89M", icon: Users, color: "text-primary" },
          { label: "BLAZE Staked for Voting", value: "2.1M", icon: Flame, color: "text-blaze" },
          { label: "EQT Treasury", value: "$32.9K", icon: Shield, color: "text-equity" },
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

      {/* Tabs */}
      <Tabs defaultValue="blaze" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="blaze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <img src={TOKEN_LOGOS.BLAZE} alt="" className="mr-1.5 h-4 w-4 rounded-full" /> BLAZE Governance
          </TabsTrigger>
          <TabsTrigger value="eqt" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <img src={TOKEN_LOGOS.EQT} alt="" className="mr-1.5 h-4 w-4 rounded-full" /> EQT Treasury
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blaze" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Protocol governance — vote with staked BLAZE</p>
            {!address && (
              <Button onClick={connect} disabled={isConnecting} size="sm" className="bg-gradient-fire text-primary-foreground">
                Connect to Vote
              </Button>
            )}
          </div>
          {BLAZE_PROPOSALS.map((p) => <ProposalCard key={p.id} proposal={p} />)}
        </TabsContent>

        <TabsContent value="eqt" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Treasury governance — vote with EQT holdings</p>
            {!address && (
              <Button onClick={connect} disabled={isConnecting} size="sm" className="bg-gradient-fire text-primary-foreground">
                Connect to Vote
              </Button>
            )}
          </div>
          {EQT_PROPOSALS.map((p) => <ProposalCard key={p.id} proposal={p} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DexGovernance;
