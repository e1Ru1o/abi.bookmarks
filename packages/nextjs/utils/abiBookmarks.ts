import { Abi } from "viem";

const ABI_STORAGE_KEY = "abi-bookmarks";
const RECENT_CONTRACTS_KEY = "abi-bookmarks-recent";
const MAX_RECENT = 10;

export type AbiBookmark = {
  chainId: number;
  address: string;
  abi: Abi;
  label?: string;
  updatedAt: number;
};

export type RecentContract = {
  chainId: number;
  address: string;
  label?: string;
  visitedAt: number;
};

function getStorageKey(chainId: number, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

function getAllBookmarks(): Record<string, AbiBookmark> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ABI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllBookmarks(bookmarks: Record<string, AbiBookmark>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ABI_STORAGE_KEY, JSON.stringify(bookmarks));
}

export function getBookmarkedAbi(chainId: number, address: string): AbiBookmark | null {
  const bookmarks = getAllBookmarks();
  const key = getStorageKey(chainId, address);
  return bookmarks[key] || null;
}

export function saveAbiBookmark(chainId: number, address: string, abi: Abi, label?: string): void {
  const bookmarks = getAllBookmarks();
  const key = getStorageKey(chainId, address);
  bookmarks[key] = {
    chainId,
    address: address.toLowerCase(),
    abi,
    label,
    updatedAt: Date.now(),
  };
  saveAllBookmarks(bookmarks);
}

export function appendAbiToBookmark(chainId: number, address: string, newAbiEntries: Abi): Abi {
  const existing = getBookmarkedAbi(chainId, address);
  const existingAbi = existing?.abi || [];

  // Merge: add new entries that don't already exist (based on JSON stringify comparison)
  const existingSet = new Set(existingAbi.map(entry => JSON.stringify(entry)));
  const merged = [...existingAbi];
  for (const entry of newAbiEntries) {
    const key = JSON.stringify(entry);
    if (!existingSet.has(key)) {
      merged.push(entry);
      existingSet.add(key);
    }
  }

  saveAbiBookmark(chainId, address, merged as Abi, existing?.label);
  return merged as Abi;
}

export function removeAbiBookmark(chainId: number, address: string): void {
  const bookmarks = getAllBookmarks();
  const key = getStorageKey(chainId, address);
  delete bookmarks[key];
  saveAllBookmarks(bookmarks);
}

export function getAllBookmarksList(): AbiBookmark[] {
  const bookmarks = getAllBookmarks();
  return Object.values(bookmarks).sort((a, b) => b.updatedAt - a.updatedAt);
}

// Recent contracts
function getRecentContracts(): RecentContract[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_CONTRACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentContract(chainId: number, address: string, label?: string): void {
  if (typeof window === "undefined") return;
  const recents = getRecentContracts();
  const normalizedAddress = address.toLowerCase();

  // Remove existing entry for same chain+address
  const filtered = recents.filter(r => !(r.chainId === chainId && r.address === normalizedAddress));

  // Add to front
  filtered.unshift({
    chainId,
    address: normalizedAddress,
    label,
    visitedAt: Date.now(),
  });

  // Trim to max
  const trimmed = filtered.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_CONTRACTS_KEY, JSON.stringify(trimmed));
}

export function getRecentContractsList(): RecentContract[] {
  return getRecentContracts();
}
