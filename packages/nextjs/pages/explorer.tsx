import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AbiFunction } from "abitype";
import { Abi, Address } from "viem";
import { PlusIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { MiniHeader } from "~~/components/MiniHeader";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { AddContractPopup } from "~~/components/explorer/AddContractPopup";
import { ExplorerMainContent } from "~~/components/explorer/ExplorerMainContent";
import { ExplorerSidebar } from "~~/components/explorer/ExplorerSidebar";
import { augmentMethodsWithUid } from "~~/components/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { ExplorerContract } from "~~/types/explorer";
import { parseAndCorrectJSON } from "~~/utils/abi";
import {
  addOpenContract,
  addRecentContract,
  appendAbiToBookmark,
  getBookmarkedAbi,
  getOpenContracts,
  removeFunctionFromBookmark,
  saveAbiBookmark,
  saveOpenContracts,
  updateBookmarkLabel,
} from "~~/utils/abiBookmarks";
import { notification } from "~~/utils/scaffold-eth";

function makeContractId(chainId: number, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

function loadContract(chainId: number, address: Address): ExplorerContract {
  const bookmark = getBookmarkedAbi(chainId, address);
  const abi = bookmark?.abi ?? [];
  addRecentContract(chainId, address, bookmark?.label);

  return {
    id: makeContractId(chainId, address),
    address,
    chainId,
    abi: abi as Abi,
    label: bookmark?.label,
    selectedMethodUids: [],
    showCustomCall: false,
  };
}

const ExplorerPage = () => {
  const router = useRouter();

  const [openContracts, setOpenContracts] = useState<ExplorerContract[]>([]);
  const [activeContractId, setActiveContractId] = useState<string>("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showAbiInput, setShowAbiInput] = useState<string | null>(null);
  const [localContractAbi, setLocalContractAbi] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const { chains, setTargetNetwork } = useGlobalState(state => ({
    chains: state.chains,
    setTargetNetwork: state.setTargetNetwork,
  }));

  const initializedRef = useRef(false);

  // Load contracts from localStorage on mount; handle ?add= param from redirects
  useEffect(() => {
    if (!router.isReady || initializedRef.current) return;
    initializedRef.current = true;

    // Handle ?add= param (from [address]/[network] redirect)
    const addParam = router.query.add as string | undefined;
    if (addParam) {
      const colonIdx = addParam.indexOf(":");
      if (colonIdx !== -1) {
        const chainId = parseInt(addParam.slice(0, colonIdx));
        const address = addParam.slice(colonIdx + 1);
        if (!isNaN(chainId) && address) {
          addOpenContract(chainId, address);
        }
      }
    }

    // Load from localStorage
    const { contracts: saved, activeId } = getOpenContracts();
    if (saved.length === 0) {
      router.replace("/");
      return;
    }

    const contracts = saved.map(e => loadContract(e.chainId, e.address as Address));
    const resolvedActiveId = activeId && contracts.find(c => c.id === activeId) ? activeId : contracts[0].id;

    setOpenContracts(contracts);
    setActiveContractId(resolvedActiveId);
    setIsLoaded(true);

    // Strip ?add= from URL if present
    if (addParam) {
      router.replace("/explorer", undefined, { shallow: true });
    }
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage when contracts or active changes
  const persistState = useCallback((contracts: ExplorerContract[], activeId: string) => {
    saveOpenContracts(
      contracts.map(c => ({ chainId: c.chainId, address: c.address })),
      activeId,
    );
  }, []);

  // Sync target network when active contract changes
  useEffect(() => {
    if (!activeContractId) return;
    const active = openContracts.find(c => c.id === activeContractId);
    if (!active) return;

    const chain = Object.values(chains).find(c => c.id === active.chainId);
    if (chain) {
      setTargetNetwork(chain);
    }
  }, [activeContractId, chains, setTargetNetwork]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeContract = openContracts.find(c => c.id === activeContractId);

  const updateContract = useCallback((contractId: string, updater: (c: ExplorerContract) => ExplorerContract) => {
    setOpenContracts(prev => prev.map(c => (c.id === contractId ? updater(c) : c)));
  }, []);

  // --- Operations ---

  const handleAddContract = (address: string, chainId: number) => {
    const id = makeContractId(chainId, address);

    const existing = openContracts.find(c => c.id === id);
    if (existing) {
      setActiveContractId(id);
      persistState(openContracts, id);
      setShowAddPopup(false);
      return;
    }

    const contract = loadContract(chainId, address as Address);
    const updated = [...openContracts, contract];
    setOpenContracts(updated);
    setActiveContractId(contract.id);
    persistState(updated, contract.id);
    setShowAddPopup(false);
  };

  const handleCloseContract = (contractId: string) => {
    const remaining = openContracts.filter(c => c.id !== contractId);
    if (remaining.length === 0) {
      saveOpenContracts([], null);
      router.push("/");
      return;
    }
    const newActive = activeContractId === contractId ? remaining[0].id : activeContractId;
    setOpenContracts(remaining);
    setActiveContractId(newActive);
    persistState(remaining, newActive);
  };

  const handleActivateContract = (contractId: string) => {
    setActiveContractId(contractId);
    persistState(openContracts, contractId);
  };

  const handleMethodSelect = (contractId: string, uid: string) => {
    updateContract(contractId, c => {
      if (c.selectedMethodUids.includes(uid)) return c;
      return { ...c, selectedMethodUids: [...c.selectedMethodUids, uid] };
    });
  };

  const handleMethodRemove = (contractId: string, uid: string) => {
    updateContract(contractId, c => ({
      ...c,
      selectedMethodUids: c.selectedMethodUids.filter(u => u !== uid),
    }));
  };

  const handleToggleCustomCall = (contractId: string) => {
    updateContract(contractId, c => ({ ...c, showCustomCall: !c.showCustomCall }));
  };

  const handleAddFunctions = (contractId: string) => {
    setShowAbiInput(contractId);
  };

  const handleRemoveFromAbiSidebar = (contractId: string, uid: string) => {
    const contract = openContracts.find(c => c.id === contractId);
    if (!contract) return;

    const methods = augmentMethodsWithUid(contract.abi.filter((m): m is AbiFunction => m.type === "function"));
    const method = methods.find(m => m.uid === uid);
    if (!method) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uid: _uid, ...abiFunction } = method;
    const updatedAbi = removeFunctionFromBookmark(contract.chainId, contract.address, abiFunction);
    updateContract(contractId, c => ({
      ...c,
      abi: updatedAbi as Abi,
      selectedMethodUids: c.selectedMethodUids.filter(u => u !== uid),
    }));
  };

  const handleRemoveFromAbiMain = (abiFunction: AbiFunction) => {
    if (!activeContract) return;
    const updatedAbi = removeFunctionFromBookmark(activeContract.chainId, activeContract.address, abiFunction);
    updateContract(activeContract.id, c => ({
      ...c,
      abi: updatedAbi as Abi,
    }));
  };

  const handleLabelChange = (contractId: string, newLabel: string) => {
    const contract = openContracts.find(c => c.id === contractId);
    if (!contract) return;

    const label = newLabel || undefined;
    updateContract(contractId, c => ({ ...c, label }));
    updateBookmarkLabel(contract.chainId, contract.address, label);
    addRecentContract(contract.chainId, contract.address, label);
  };

  const handleImportAbi = () => {
    if (!showAbiInput) return;
    const contract = openContracts.find(c => c.id === showAbiInput);
    if (!contract) return;

    if (!localContractAbi.trim()) {
      notification.error("Please provide an ABI.");
      return;
    }
    try {
      const parsedAbi = parseAndCorrectJSON(localContractAbi);
      if (!Array.isArray(parsedAbi)) {
        throw new Error("ABI must be an array");
      }

      let finalAbi: Abi;
      if (contract.abi.length > 0) {
        finalAbi = appendAbiToBookmark(contract.chainId, contract.address, parsedAbi);
      } else {
        saveAbiBookmark(contract.chainId, contract.address, parsedAbi, contract.label);
        finalAbi = parsedAbi;
      }

      updateContract(showAbiInput, c => ({ ...c, abi: finalAbi }));
      setLocalContractAbi("");
      setShowAbiInput(null);
      notification.success("ABI imported and saved.");
    } catch (error) {
      console.error("Error parsing ABI:", error);
      notification.error("Invalid ABI format. Please ensure it is valid JSON.");
    }
  };

  if (!isLoaded) {
    return (
      <>
        <MetaHeader />
        <div className="bg-base-100 h-screen flex flex-col">
          <MiniHeader />
          <div className="flex justify-center h-full mt-14">
            <span className="loading loading-spinner text-primary h-14 w-14"></span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MetaHeader />
      <div className="bg-base-100 h-screen flex flex-col">
        <MiniHeader />
        <div className="flex flex-grow h-full overflow-hidden">
          {/* Sidebar */}
          <div className="hidden sm:flex w-72 shrink-0 bg-base-200 border-r border-base-300">
            <ExplorerSidebar
              contracts={openContracts}
              activeContractId={activeContractId}
              onActivate={handleActivateContract}
              onClose={handleCloseContract}
              onMethodSelect={handleMethodSelect}
              onMethodRemove={handleMethodRemove}
              onToggleCustomCall={handleToggleCustomCall}
              onAddFunctions={handleAddFunctions}
              onRemoveFromAbi={handleRemoveFromAbiSidebar}
              onOpenAddPopup={() => setShowAddPopup(true)}
            />
          </div>

          {/* Mobile: floating add button */}
          <button
            className="sm:hidden fixed bottom-20 right-6 z-40 btn btn-primary btn-circle shadow-lg"
            onClick={() => setShowAddPopup(true)}
          >
            <PlusIcon className="h-6 w-6" />
          </button>

          {/* Main content */}
          <div className="flex-grow overflow-hidden">
            {activeContract && (
              <ExplorerMainContent
                key={activeContract.id}
                contract={activeContract}
                onLabelChange={label => handleLabelChange(activeContract.id, label)}
                onRemoveFromAbi={handleRemoveFromAbiMain}
              />
            )}
          </div>
        </div>
      </div>

      <SwitchTheme className="fixed bottom-3 right-6 z-50" />

      {showAddPopup && <AddContractPopup onAdd={handleAddContract} onClose={() => setShowAddPopup(false)} />}

      {showAbiInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-base-200 rounded-2xl shadow-xl p-6 max-w-lg w-full flex flex-col gap-4">
            <h3 className="font-bold text-lg">Add Functions (Import ABI)</h3>
            <p className="text-sm text-base-content/70">
              Paste additional ABI entries. They will be merged with the existing ABI.
            </p>
            <textarea
              className="textarea bg-neutral w-full h-40 resize-none font-mono text-sm"
              placeholder="Paste ABI JSON here"
              value={localContractAbi}
              onChange={e => setLocalContractAbi(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAbiInput(null);
                  setLocalContractAbi("");
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleImportAbi}>
                <PlusIcon className="h-4 w-4" />
                Import & Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExplorerPage;
