import { Abi } from "viem";

const ABI_STORAGE_KEY = "abi-bookmarks";
const RECENT_CONTRACTS_KEY = "abi-bookmarks-recent";
const MAX_RECENT = 6;

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

export function removeFunctionFromBookmark(chainId: number, address: string, abiEntry: unknown): Abi {
  const existing = getBookmarkedAbi(chainId, address);
  if (!existing) return [];

  const entryStr = JSON.stringify(abiEntry);
  const updatedAbi = existing.abi.filter(entry => JSON.stringify(entry) !== entryStr);

  if (updatedAbi.length === 0 && !existing.label) {
    removeAbiBookmark(chainId, address);
  } else {
    saveAbiBookmark(chainId, address, updatedAbi as Abi, existing.label);
  }
  return updatedAbi as Abi;
}

export function removeAbiBookmark(chainId: number, address: string): void {
  const bookmarks = getAllBookmarks();
  const key = getStorageKey(chainId, address);
  delete bookmarks[key];
  saveAllBookmarks(bookmarks);
}

export function updateBookmarkLabel(chainId: number, address: string, label: string | undefined): void {
  const bookmarks = getAllBookmarks();
  const key = getStorageKey(chainId, address);
  const existing = bookmarks[key];
  if (!existing) {
    if (!label) return;
    bookmarks[key] = {
      chainId,
      address: address.toLowerCase(),
      abi: [] as unknown as Abi,
      label,
      updatedAt: Date.now(),
    };
  } else {
    existing.label = label || undefined;
    existing.updatedAt = Date.now();
    if (!existing.label && existing.abi.length === 0) {
      delete bookmarks[key];
    }
  }
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

  const filtered = recents.filter(r => !(r.chainId === chainId && r.address === normalizedAddress));

  filtered.unshift({
    chainId,
    address: normalizedAddress,
    label,
    visitedAt: Date.now(),
  });

  const trimmed = filtered.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_CONTRACTS_KEY, JSON.stringify(trimmed));
}

export function getRecentContractsList(): RecentContract[] {
  return getRecentContracts();
}

// Open explorer contracts
const OPEN_CONTRACTS_KEY = "abi-bookmarks-open";

export type OpenContractEntry = {
  chainId: number;
  address: string;
};

// Workspaces
const WORKSPACES_KEY = "abi-bookmarks-workspaces";

export type WorkspaceEntry = {
  address: string;
  chainId: number;
};

export type Workspace = {
  id: number;
  name: string;
  contracts: WorkspaceEntry[];
};

export type WorkspacesData = {
  nextId: number;
  workspaces: Workspace[];
};

export function getOpenContracts(): { contracts: OpenContractEntry[]; activeId: string | null } {
  if (typeof window === "undefined") return { contracts: [], activeId: null };
  try {
    const raw = localStorage.getItem(OPEN_CONTRACTS_KEY);
    if (!raw) return { contracts: [], activeId: null };
    return JSON.parse(raw);
  } catch {
    return { contracts: [], activeId: null };
  }
}

export function saveOpenContracts(contracts: OpenContractEntry[], activeId: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OPEN_CONTRACTS_KEY, JSON.stringify({ contracts, activeId }));
}

export function addOpenContract(chainId: number, address: string): void {
  const { contracts } = getOpenContracts();
  const id = `${chainId}:${address.toLowerCase()}`;
  if (!contracts.some(c => `${c.chainId}:${c.address.toLowerCase()}` === id)) {
    contracts.push({ chainId, address: address.toLowerCase() });
  }
  saveOpenContracts(contracts, id);
}

// Workspace CRUD

export function getWorkspacesData(): WorkspacesData {
  if (typeof window === "undefined") return { nextId: 1, workspaces: [] };
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    if (!raw) return { nextId: 1, workspaces: [] };
    return JSON.parse(raw);
  } catch {
    return { nextId: 1, workspaces: [] };
  }
}

export function saveWorkspacesData(data: WorkspacesData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(data));
}

export function createWorkspace(name: string, contracts: WorkspaceEntry[] = []): Workspace {
  const data = getWorkspacesData();
  const workspace: Workspace = { id: data.nextId, name, contracts };
  data.workspaces.push(workspace);
  data.nextId++;
  saveWorkspacesData(data);
  return workspace;
}

export function deleteWorkspace(id: number): void {
  const data = getWorkspacesData();
  data.workspaces = data.workspaces.filter(w => w.id !== id);
  saveWorkspacesData(data);
}

export function renameWorkspace(id: number, name: string): void {
  const data = getWorkspacesData();
  const ws = data.workspaces.find(w => w.id === id);
  if (ws) {
    ws.name = name;
    saveWorkspacesData(data);
  }
}

export function getWorkspaceById(id: number): Workspace | null {
  const data = getWorkspacesData();
  return data.workspaces.find(w => w.id === id) || null;
}

export function saveWorkspaceContracts(id: number, contracts: WorkspaceEntry[]): void {
  const data = getWorkspacesData();
  const ws = data.workspaces.find(w => w.id === id);
  if (ws) {
    ws.contracts = contracts;
    saveWorkspacesData(data);
  }
}
