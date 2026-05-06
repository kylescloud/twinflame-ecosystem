// Local persistence for the user's vote reasons. The Governor's `VoteCast`
// event carries the reason on-chain, but we mirror it locally so "My Activity"
// can render instantly without an extra log query.

const KEY = "tf:voteHistory:v1";

export interface VoteRecord {
  governor: string;
  proposalId: string;
  account: string;
  support: 0 | 1 | 2;
  reason: string;
  txHash?: string;
  ts: number;
}

type Store = Record<string, VoteRecord>;

const idOf = (governor: string, proposalId: string, account: string) =>
  `${governor.toLowerCase()}:${proposalId}:${account.toLowerCase()}`;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function saveVoteRecord(rec: Omit<VoteRecord, "ts"> & { ts?: number }) {
  const s = read();
  s[idOf(rec.governor, rec.proposalId, rec.account)] = { ...rec, ts: rec.ts ?? Date.now() };
  write(s);
}

export function getVoteRecord(
  governor: string,
  proposalId: string,
  account: string | null,
): VoteRecord | null {
  if (!account) return null;
  const s = read();
  return s[idOf(governor, proposalId, account)] ?? null;
}

export function getAllVoteRecords(account: string | null): VoteRecord[] {
  if (!account) return [];
  const s = read();
  return Object.values(s).filter((r) => r.account.toLowerCase() === account.toLowerCase());
}

export const SUPPORT_LABEL: Record<0 | 1 | 2, string> = {
  0: "Against",
  1: "For",
  2: "Abstain",
};
