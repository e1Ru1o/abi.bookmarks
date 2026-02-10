import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { isAddress } from "viem";
import { mainnet } from "viem/chains";
import { BookmarkIcon, PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { MiniFooter } from "~~/components/MiniFooter";
import { NetworksDropdown } from "~~/components/NetworksDropdown/NetworksDropdown";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { AddressInput } from "~~/components/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import {
  AbiBookmark,
  RecentContract,
  Workspace,
  addOpenContract,
  createWorkspace,
  deleteWorkspace,
  getAllBookmarksList,
  getOpenContracts,
  getRecentContractsList,
  getWorkspacesData,
  removeAbiBookmark,
  renameWorkspace,
  saveOpenContracts,
} from "~~/utils/abiBookmarks";
import { notification } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const [network, setNetwork] = useState(mainnet.id.toString());
  const [contractAddress, setContractAddress] = useState("");
  const [bookmarks, setBookmarks] = useState<AbiBookmark[]>([]);
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);
  const [hasOpenSession, setHasOpenSession] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    setBookmarks(getAllBookmarksList());
    setRecentContracts(getRecentContractsList());
    const { contracts } = getOpenContracts();
    setHasOpenSession(contracts.length > 0);
    setWorkspaces(getWorkspacesData().workspaces);
  }, []);

  useEffect(() => {
    if (editingWorkspaceId !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingWorkspaceId]);

  const handleGo = () => {
    if (!isAddress(contractAddress)) {
      notification.error("Please enter a valid contract address.");
      return;
    }
    addOpenContract(parseInt(network), contractAddress);
    router.push("/explorer");
  };

  const handleRemoveBookmark = (chainId: number, address: string) => {
    removeAbiBookmark(chainId, address);
    setBookmarks(getAllBookmarksList());
  };

  const handleCreateWorkspace = () => {
    const count = workspaces.length + 1;
    const ws = createWorkspace(`Workspace #${count}`);
    setWorkspaces(getWorkspacesData().workspaces);
    router.push(`/workspace/${ws.id}`);
  };

  const handleDeleteWorkspace = (id: number) => {
    deleteWorkspace(id);
    setWorkspaces(getWorkspacesData().workspaces);
  };

  const handleStartRename = (ws: Workspace) => {
    setEditingWorkspaceId(ws.id);
    setEditingWorkspaceName(ws.name);
  };

  const handleFinishRename = () => {
    if (editingWorkspaceId !== null) {
      renameWorkspace(editingWorkspaceId, editingWorkspaceName);
      setWorkspaces(getWorkspacesData().workspaces);
      setEditingWorkspaceId(null);
    }
  };

  const chains = useGlobalState(state => state.chains);

  const getNetworkName = (chainId: number) => {
    const chain = chains.find(c => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <MetaHeader />
      <div className="flex flex-grow items-center justify-center bg-base-100">
        <div className="flex h-screen bg-base-200 relative overflow-x-hidden w-full flex-col items-center rounded-2xl pb-4 lg:h-auto lg:min-h-[650px] lg:w-[500px] lg:justify-between lg:shadow-xl">
          <div className="flex-grow flex flex-col items-center justify-start lg:w-full pt-12 px-4">
            <div className="flex flex-col items-center justify-center mb-8">
              <Image src="/logo_inv.svg" alt="logo" width={80} height={60} className="mb-3" />
              <h2 className="mb-0 text-4xl font-bold">ABI Bookmarks</h2>
              <p className="text-base-content/70 text-sm mt-1">
                Save and interact with smart contracts on any EVM chain
              </p>
            </div>

            <div className="w-full max-w-sm flex flex-col items-center gap-4">
              <div id="react-select-container" className="w-full flex justify-center">
                <NetworksDropdown onChange={option => setNetwork(option ? option.value.toString() : "")} />
              </div>
              <div className="w-full">
                <AddressInput placeholder="Contract address" value={contractAddress} onChange={setContractAddress} />
              </div>
              <button
                className="btn btn-primary min-h-fit h-10 px-8 text-base font-semibold border-2 hover:bg-neutral hover:text-primary"
                onClick={handleGo}
                disabled={!contractAddress}
              >
                Go to Contract
              </button>
            </div>

            {hasOpenSession && (
              <div className="w-full max-w-sm mt-8 bg-primary/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm">Recover your last explorer session?</span>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      saveOpenContracts([], null);
                      setHasOpenSession(false);
                    }}
                  >
                    Dismiss
                  </button>
                  <button className="btn btn-primary btn-xs" onClick={() => router.push("/explorer")}>
                    Recover
                  </button>
                </div>
              </div>
            )}

            {recentContracts.length > 0 && (
              <div className="w-full max-w-sm mt-10">
                <span className="font-semibold text-sm mb-3 block">Recent</span>
                <div className="flex flex-wrap gap-2">
                  {recentContracts.slice(0, 6).map(rc => (
                    <button
                      key={`${rc.chainId}:${rc.address}`}
                      className="badge badge-outline badge-lg gap-1 hover:bg-primary hover:text-primary-content transition-colors cursor-pointer"
                      onClick={() => {
                        addOpenContract(rc.chainId, rc.address);
                        router.push("/explorer");
                      }}
                    >
                      <span className="font-mono text-xs">{rc.label || truncateAddress(rc.address)}</span>
                      <span className="text-xs opacity-60">{getNetworkName(rc.chainId)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bookmarks.length > 0 && (
              <div className="w-full max-w-sm mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookmarkIcon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Saved ABIs</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(showAllBookmarks ? bookmarks : bookmarks.slice(0, 5)).map(bm => (
                    <div
                      key={`${bm.chainId}:${bm.address}`}
                      className="flex items-center gap-2 bg-base-300 rounded-lg px-3 py-2"
                    >
                      <button
                        className="flex-grow flex justify-between items-center text-base-content hover:text-primary transition-colors min-w-0 text-left"
                        onClick={() => {
                          addOpenContract(bm.chainId, bm.address);
                          router.push("/explorer");
                        }}
                      >
                        <div className="flex flex-col min-w-0">
                          {bm.label && <span className="text-sm font-medium truncate">{bm.label}</span>}
                          <span className="font-mono text-xs text-base-content/60 truncate">
                            {truncateAddress(bm.address)}
                          </span>
                        </div>
                        <span className="text-xs text-base-content/60 shrink-0 ml-2">{getNetworkName(bm.chainId)}</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-xs px-1"
                        onClick={() => handleRemoveBookmark(bm.chainId, bm.address)}
                        aria-label="Remove bookmark"
                      >
                        <TrashIcon className="h-3.5 w-3.5 text-error/70" />
                      </button>
                    </div>
                  ))}
                </div>
                {bookmarks.length > 5 && (
                  <button
                    className="btn btn-ghost btn-xs mt-2 text-base-content/60"
                    onClick={() => setShowAllBookmarks(!showAllBookmarks)}
                  >
                    {showAllBookmarks ? "Show less" : `Show more (${bookmarks.length - 5})`}
                  </button>
                )}
              </div>
            )}

            {/* Workspaces */}
            <div className="w-full max-w-sm mt-6 mb-8">
              <span className="font-semibold text-sm mb-3 block">Workspaces</span>
              <div className="flex flex-col gap-1.5">
                {workspaces.map(ws => (
                  <div key={ws.id} className="flex items-center gap-2 bg-base-300 rounded-lg px-3 py-2">
                    {editingWorkspaceId === ws.id ? (
                      <input
                        ref={renameInputRef}
                        className="input input-sm input-bordered flex-grow text-sm"
                        value={editingWorkspaceName}
                        onChange={e => setEditingWorkspaceName(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleFinishRename();
                          if (e.key === "Escape") setEditingWorkspaceId(null);
                        }}
                        placeholder="Workspace name"
                      />
                    ) : (
                      <button
                        className="flex-grow flex justify-between items-center text-base-content hover:text-primary transition-colors min-w-0 text-left"
                        onClick={() => router.push(`/workspace/${ws.id}`)}
                      >
                        <span className="text-sm font-medium truncate">{ws.name || "Unnamed"}</span>
                        <span className="text-xs text-base-content/60 shrink-0 ml-2">({ws.contracts.length})</span>
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-xs px-1"
                      onClick={() => handleStartRename(ws)}
                      aria-label="Rename workspace"
                    >
                      <PencilIcon className="h-3.5 w-3.5 opacity-60" />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs px-1"
                      onClick={() => handleDeleteWorkspace(ws.id)}
                      aria-label="Delete workspace"
                    >
                      <TrashIcon className="h-3.5 w-3.5 text-error/70" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm mt-3 gap-1 text-base-content/60" onClick={handleCreateWorkspace}>
                <PlusIcon className="h-4 w-4" />
                New Workspace
              </button>
            </div>
          </div>
          <SwitchTheme className="absolute top-5 right-5" />
          <MiniFooter />
        </div>
      </div>
    </>
  );
};

export default Home;
