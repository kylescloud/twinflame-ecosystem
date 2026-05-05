import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider, id as keccakId, keccak256, toUtf8Bytes, AbiCoder } from "ethers";
import {
  CONTRACTS,
  GOVERNOR_ABI,
  TIMELOCK_ABI,
  ERC20_ABI,
  PROPOSAL_STATE,
  type ProposalStateName,
} from "@/lib/contracts";

export interface LiveProposal {
  proposalId: string; // bigint as decimal string
  shortId: string;
  proposer: string;
  description: string;
  title: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  descriptionHash: string;
  voteStart: number; // block number
  voteEnd: number; // block number
  state: ProposalStateName;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorum: string;
  etaUnix: number;
  needsQueuing: boolean;
  hasVoted: boolean;
  userWeight: string;
}

export type GovernorKind = "blaze" | "eqt";

const PUBLIC_RPC = "https://polygon-rpc.com";
const ZERO_ADDR_PREFIX = "0x000000000000000000000000000000000000";

function isPlaceholder(addr: string) {
  return addr.toLowerCase().startsWith(ZERO_ADDR_PREFIX);
}

function shortId(id: bigint): string {
  const hex = id.toString(16);
  if (hex.length <= 8) return hex;
  return `${hex.slice(0, 5)}…${hex.slice(-2)}`;
}

function titleFromDescription(d: string): string {
  // Convention: first line is title, rest is body (matches OZ Governor docs)
  const line = d.split("\n")[0]?.trim() ?? d;
  return line.length > 120 ? line.slice(0, 117) + "…" : line;
}

interface UseLiveGovernorResult {
  proposals: LiveProposal[];
  loading: boolean;
  error: string | null;
  isLive: boolean; // false → contracts are placeholders, UI should show simulated banner
  governorAddress: string;
  tokenAddress: string;
  votingPower: string; // raw bigint string of caller voting power at latest block
  votingDelay: number;
  votingPeriod: number;
  proposalThreshold: string;
  quorumNumerator: number; // %
  refresh: () => Promise<void>;
}

export function useLiveGovernor(
  kind: GovernorKind,
  account: string | null,
): UseLiveGovernorResult {
  const governorAddress = kind === "blaze" ? CONTRACTS.BLAZE_GOVERNOR : CONTRACTS.EQT_GOVERNOR;
  const tokenAddress = kind === "blaze" ? CONTRACTS.BLAZE_TOKEN : CONTRACTS.EQT_TOKEN;
  const placeholder = isPlaceholder(governorAddress);

  const [proposals, setProposals] = useState<LiveProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(!placeholder);
  const [error, setError] = useState<string | null>(null);
  const [votingPower, setVotingPower] = useState<string>("0");
  const [votingDelay, setVotingDelay] = useState<number>(0);
  const [votingPeriod, setVotingPeriod] = useState<number>(0);
  const [proposalThreshold, setProposalThreshold] = useState<string>("0");
  const [quorumNumerator, setQuorumNumerator] = useState<number>(kind === "blaze" ? 4 : 10);

  const inflight = useRef(false);

  const provider = useMemo(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try { return new BrowserProvider((window as any).ethereum); } catch {}
    }
    return new JsonRpcProvider(PUBLIC_RPC);
  }, []);

  const refresh = useCallback(async () => {
    if (placeholder || inflight.current) return;
    inflight.current = true;
    setError(null);
    try {
      const gov = new Contract(governorAddress, GOVERNOR_ABI, provider);
      const block = await provider.getBlockNumber();

      // Static governor params
      const [vd, vp, pt] = await Promise.all([
        gov.votingDelay().catch(() => 0n),
        gov.votingPeriod().catch(() => 0n),
        gov.proposalThreshold().catch(() => 0n),
      ]);
      setVotingDelay(Number(vd));
      setVotingPeriod(Number(vp));
      setProposalThreshold(pt.toString());

      // Pull proposals via ProposalCreated event log (last ~ 500k blocks ≈ 12 days on polygon if needed; do full range)
      const filter = gov.filters.ProposalCreated();
      const fromBlock = Math.max(0, block - 2_000_000); // safety bound
      const events = await gov.queryFilter(filter, fromBlock, block);

      const proposalsResolved: LiveProposal[] = await Promise.all(
        events.map(async (ev: any) => {
          const args = ev.args!;
          const pid: bigint = args.proposalId;
          const targets: string[] = args.targets;
          const values: bigint[] = args.values;
          const calldatas: string[] = args.calldatas;
          const description: string = args.description;
          const proposer: string = args.proposer;
          const voteStart = Number(args.voteStart);
          const voteEnd = Number(args.voteEnd);
          const descriptionHash = keccak256(toUtf8Bytes(description));

          const [stateNum, votes, eta, needsQueuing, q, hasVoted, weight] = await Promise.all([
            gov.state(pid).catch(() => 0n),
            gov.proposalVotes(pid).catch(() => [0n, 0n, 0n]),
            gov.proposalEta(pid).catch(() => 0n),
            gov.proposalNeedsQueuing(pid).catch(() => false),
            gov.quorum(voteStart).catch(() => 0n),
            account ? gov.hasVoted(pid, account).catch(() => false) : Promise.resolve(false),
            account ? gov.getVotes(account, voteStart).catch(() => 0n) : Promise.resolve(0n),
          ]);

          return {
            proposalId: pid.toString(),
            shortId: shortId(pid),
            proposer,
            description,
            title: titleFromDescription(description),
            targets,
            values: values.map((v) => v.toString()),
            calldatas,
            descriptionHash,
            voteStart,
            voteEnd,
            state: PROPOSAL_STATE[Number(stateNum)] as ProposalStateName,
            againstVotes: (votes as any)[0].toString(),
            forVotes: (votes as any)[1].toString(),
            abstainVotes: (votes as any)[2].toString(),
            quorum: (q as bigint).toString(),
            etaUnix: Number(eta),
            needsQueuing: Boolean(needsQueuing),
            hasVoted: Boolean(hasVoted),
            userWeight: (weight as bigint).toString(),
          } satisfies LiveProposal;
        }),
      );

      // Sort newest first by voteStart
      proposalsResolved.sort((a, b) => b.voteStart - a.voteStart);
      setProposals(proposalsResolved);

      // Caller voting power at latest block
      if (account) {
        try {
          const vpRaw = await gov.getVotes(account, block - 1);
          setVotingPower((vpRaw as bigint).toString());
        } catch {
          setVotingPower("0");
        }
      } else {
        setVotingPower("0");
      }
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Failed to load governance data");
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, [account, governorAddress, placeholder, provider]);

  useEffect(() => {
    if (placeholder) {
      setLoading(false);
      return;
    }
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh, placeholder]);

  return {
    proposals,
    loading,
    error,
    isLive: !placeholder,
    governorAddress,
    tokenAddress,
    votingPower,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorumNumerator,
    refresh,
  };
}

// ── write helpers ──────────────────────────────────────────────────────────

export async function castVoteTx(
  governorAddress: string,
  proposalId: string,
  support: 0 | 1 | 2,
  reason?: string,
) {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Wallet not detected");
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const gov = new Contract(governorAddress, GOVERNOR_ABI, signer);
  if (reason && reason.length > 0) {
    return gov.castVoteWithReason(proposalId, support, reason);
  }
  return gov.castVote(proposalId, support);
}

export async function queueTx(
  governorAddress: string,
  targets: string[],
  values: string[],
  calldatas: string[],
  descriptionHash: string,
) {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Wallet not detected");
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const gov = new Contract(governorAddress, GOVERNOR_ABI, signer);
  return gov.queue(targets, values.map(BigInt), calldatas, descriptionHash);
}

export async function executeTx(
  governorAddress: string,
  targets: string[],
  values: string[],
  calldatas: string[],
  descriptionHash: string,
) {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Wallet not detected");
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const gov = new Contract(governorAddress, GOVERNOR_ABI, signer);
  return gov.execute(targets, values.map(BigInt), calldatas, descriptionHash);
}

export async function cancelTx(
  governorAddress: string,
  targets: string[],
  values: string[],
  calldatas: string[],
  descriptionHash: string,
) {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Wallet not detected");
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const gov = new Contract(governorAddress, GOVERNOR_ABI, signer);
  return gov.cancel(targets, values.map(BigInt), calldatas, descriptionHash);
}

export async function proposeTx(
  governorAddress: string,
  targets: string[],
  values: string[],
  calldatas: string[],
  description: string,
) {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Wallet not detected");
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const gov = new Contract(governorAddress, GOVERNOR_ABI, signer);
  return gov.propose(targets, values.map(BigInt), calldatas, description);
}

export async function delegateTx(tokenAddress: string, delegatee: string) {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Wallet not detected");
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const tok = new Contract(
    tokenAddress,
    [...ERC20_ABI, "function delegate(address delegatee)", "function delegates(address) view returns (address)"],
    signer,
  );
  return tok.delegate(delegatee);
}

export { keccakId };
