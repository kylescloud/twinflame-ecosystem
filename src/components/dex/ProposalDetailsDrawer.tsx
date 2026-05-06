import { useEffect, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS, TIMELOCK_ABI } from "@/lib/contracts";
import { type LiveProposal } from "@/hooks/useLiveGovernor";
import { getVoteRecord, SUPPORT_LABEL } from "@/lib/voteHistory";
import {
  ExternalLink, Copy, CheckCircle, Clock, Hammer, PlayCircle, Ban, XCircle, Hourglass,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proposal: LiveProposal | null;
  governorAddress: string;
  governorLabel: string;
  isLive: boolean;
  account: string | null;
}

const polyscanAddr = (a: string) => `https://polygonscan.com/address/${a}`;
const fmtUnix = (u: number) => (u > 0 ? new Date(u * 1000).toLocaleString() : "—");

const STATE_ICON: Record<string, any> = {
  Pending: Hourglass, Active: Clock, Canceled: Ban, Defeated: XCircle,
  Succeeded: CheckCircle, Queued: Hammer, Expired: Ban, Executed: PlayCircle,
};

interface TimelockStatus {
  loading: boolean;
  minDelaySec?: number;
  ready?: boolean;
  pending?: boolean;
  done?: boolean;
  scheduledAtUnix?: number;
  error?: string;
}

export default function ProposalDetailsDrawer({
  open, onOpenChange, proposal, governorAddress, governorLabel, isLive, account,
}: Props) {
  const { toast } = useToast();
  const [tl, setTl] = useState<TimelockStatus>({ loading: false });

  const myVote = proposal && account ? getVoteRecord(governorAddress, proposal.proposalId, account) : null;

  useEffect(() => {
    if (!open || !proposal) return;
    setTl({ loading: true });
    (async () => {
      // In simulated mode we derive a friendly status from the proposal alone.
      if (!isLive) {
        setTl({
          loading: false,
          minDelaySec: 172_800,
          pending: proposal.state === "Queued",
          ready: proposal.state === "Queued" && proposal.etaUnix > 0 && proposal.etaUnix <= Math.floor(Date.now() / 1000),
          done: proposal.state === "Executed",
          scheduledAtUnix: proposal.etaUnix - 172_800 > 0 ? proposal.etaUnix - 172_800 : 0,
        });
        return;
      }
      try {
        const provider = (typeof window !== "undefined" && (window as any).ethereum)
          ? new BrowserProvider((window as any).ethereum)
          : new JsonRpcProvider("https://polygon-rpc.com");
        const tlc = new Contract(CONTRACTS.TIMELOCK, TIMELOCK_ABI, provider);
        const minDelay: bigint = await tlc.getMinDelay().catch(() => 0n);
        // Without recomputing the OZ-Governor timelock salt we can't query op-id directly,
        // so we rely on Governor's proposalEta plus state for live status, and surface delay.
        setTl({
          loading: false,
          minDelaySec: Number(minDelay),
          pending: proposal.state === "Queued",
          ready: proposal.state === "Queued" && proposal.etaUnix > 0 && proposal.etaUnix <= Math.floor(Date.now() / 1000),
          done: proposal.state === "Executed",
          scheduledAtUnix: proposal.etaUnix > 0 && Number(minDelay) > 0 ? proposal.etaUnix - Number(minDelay) : 0,
        });
      } catch (e: any) {
        setTl({ loading: false, error: e?.shortMessage || e?.message || "Timelock query failed" });
      }
    })();
  }, [open, proposal, isLive]);

  if (!proposal) return null;

  const StateIcon = STATE_ICON[proposal.state] ?? Clock;
  const body = proposal.description.split("\n").slice(1).join("\n").trim();

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: `${label} copied` }),
      () => toast({ title: "Copy failed", variant: "destructive" }),
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetDescription className="font-mono text-xs">#{proposal.shortId} · {governorLabel}</SheetDescription>
          <SheetTitle className="pr-6 leading-snug">{proposal.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          {/* State row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-1 text-xs">
              <StateIcon className="h-3 w-3" /> {proposal.state}
            </span>
            <span className="text-xs text-muted-foreground">
              by{" "}
              <a href={polyscanAddr(proposal.proposer)} target="_blank" rel="noopener noreferrer"
                className="font-mono text-foreground/80 hover:text-primary">
                {proposal.proposer.slice(0, 6)}…{proposal.proposer.slice(-4)}
              </a>
            </span>
          </div>

          {/* Description body */}
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Description</p>
              {body ? (
                <p className="whitespace-pre-line text-sm text-foreground/90">{body}</p>
              ) : (
                <p className="text-xs italic text-muted-foreground">No additional body provided.</p>
              )}
            </CardContent>
          </Card>

          {/* My vote */}
          {myVote && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Your vote</p>
                <p className="text-sm text-foreground">
                  Voted <span className="font-semibold">{SUPPORT_LABEL[myVote.support]}</span>
                  {" · "}
                  <span className="text-xs text-muted-foreground">{new Date(myVote.ts).toLocaleString()}</span>
                </p>
                {myVote.reason && (
                  <p className="mt-2 whitespace-pre-line rounded-md border border-border/40 bg-background/60 p-2 text-xs text-foreground/90">
                    “{myVote.reason}”
                  </p>
                )}
                {myVote.txHash && (
                  <a href={`https://polygonscan.com/tx/${myVote.txHash}`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                    View tx <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timelock status */}
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Timelock execution</p>
              {tl.loading ? (
                <Skeleton className="h-12 w-full" />
              ) : tl.error ? (
                <p className="text-xs text-destructive">{tl.error}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Row label="Min delay" value={tl.minDelaySec ? `${(tl.minDelaySec / 3600).toFixed(0)}h` : "—"} />
                  <Row label="ETA" value={fmtUnix(proposal.etaUnix)} />
                  <Row label="Scheduled at" value={fmtUnix(tl.scheduledAtUnix ?? 0)} />
                  <Row
                    label="Status"
                    value={
                      tl.done ? "Executed" :
                      tl.ready ? "Ready to execute" :
                      tl.pending ? "Pending in queue" :
                      proposal.needsQueuing ? "Awaiting queue" : "—"
                    }
                  />
                </div>
              )}
              <a href={polyscanAddr(CONTRACTS.TIMELOCK)} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
                Timelock {CONTRACTS.TIMELOCK.slice(0, 8)}… <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </CardContent>
          </Card>

          {/* Actions / on-chain calls */}
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  On-chain actions ({proposal.targets.length})
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">
                  hash: {proposal.descriptionHash.slice(0, 10)}…
                  <Button variant="ghost" size="sm" className="ml-1 h-5 px-1"
                    onClick={() => copy(proposal.descriptionHash, "Description hash")}>
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                </span>
              </div>
              <div className="space-y-2">
                {proposal.targets.map((t, i) => (
                  <div key={i} className="rounded-md border border-border/40 bg-background/40 p-2 text-xs">
                    <p className="text-[10px] uppercase text-muted-foreground">Action #{i + 1}</p>
                    <Row
                      label="Target"
                      value={
                        <a href={polyscanAddr(t)} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-foreground hover:text-primary">
                          {t.slice(0, 8)}…{t.slice(-6)} <ExternalLink className="ml-0.5 inline h-2.5 w-2.5" />
                        </a>
                      }
                    />
                    <Row label="Value" value={<span className="font-mono">{proposal.values[i] ?? "0"} wei</span>} />
                    <div className="mt-1">
                      <p className="text-[10px] uppercase text-muted-foreground">Calldata</p>
                      <div className="flex items-start gap-1">
                        <code className="block max-h-24 flex-1 overflow-auto break-all rounded bg-muted/40 p-1.5 font-mono text-[10px] text-foreground/90">
                          {proposal.calldatas[i] || "0x"}
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5"
                          onClick={() => copy(proposal.calldatas[i] || "0x", "Calldata")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vote tallies */}
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Vote totals (raw wei)</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Tally label="For" value={proposal.forVotes} className="text-[hsl(142,70%,50%)]" />
                <Tally label="Against" value={proposal.againstVotes} className="text-destructive" />
                <Tally label="Abstain" value={proposal.abstainVotes} className="text-muted-foreground" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <Row label="Quorum" value={proposal.quorum} />
                <Row label="Snapshot block" value={proposal.voteStart.toLocaleString()} />
                <Row label="Deadline block" value={proposal.voteEnd.toLocaleString()} />
                <Row label="Needs queuing" value={proposal.needsQueuing ? "Yes" : "No"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function Tally({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={`break-all font-mono text-[11px] ${className}`}>{value}</p>
    </div>
  );
}
