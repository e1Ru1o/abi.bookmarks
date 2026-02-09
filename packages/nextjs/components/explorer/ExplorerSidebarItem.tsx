import { useMemo } from "react";
import { AbiFunction } from "abitype";
import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MethodSelector, augmentMethodsWithUid } from "~~/components/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { ExplorerContract } from "~~/types/explorer";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const mainNetworks = getTargetNetworks();

type ExplorerSidebarItemProps = {
  contract: ExplorerContract;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onMethodSelect: (uid: string) => void;
  onMethodRemove: (uid: string) => void;
  onToggleCustomCall: () => void;
  onAddFunctions: () => void;
  onRemoveFromAbi: (uid: string) => void;
};

export const ExplorerSidebarItem = ({
  contract,
  isActive,
  onActivate,
  onClose,
  onMethodSelect,
  onMethodRemove,
  onToggleCustomCall,
  onAddFunctions,
  onRemoveFromAbi,
}: ExplorerSidebarItemProps) => {
  const chains = useGlobalState(state => state.chains);
  const network = mainNetworks.find(n => n.id === contract.chainId) || chains.find(c => c.id === contract.chainId);
  const networkName = network ? (network.id === 31337 ? "Localhost" : network.name) : `Chain ${contract.chainId}`;

  const truncatedAddress = `${contract.address.slice(0, 6)}...${contract.address.slice(-4)}`;

  const readMethodsWithInputsAndWriteMethods = useMemo(() => {
    return augmentMethodsWithUid(
      contract.abi.filter((method): method is AbiFunction => {
        if (method.type !== "function") return false;
        if (method.stateMutability === "view" || method.stateMutability === "pure") {
          return method.inputs.length > 0;
        }
        return true;
      }),
    );
  }, [contract.abi]);

  const selectedMethods = useMemo(() => {
    return readMethodsWithInputsAndWriteMethods.filter(m => contract.selectedMethodUids.includes(m.uid));
  }, [readMethodsWithInputsAndWriteMethods, contract.selectedMethodUids]);

  if (!isActive) {
    return (
      <div
        className="shrink-0 flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
        onClick={onActivate}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRightIcon className="h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{contract.label || truncatedAddress}</div>
            <div className="text-xs opacity-60">{networkName}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-xs px-1 shrink-0"
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close contract"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 rounded-lg bg-base-300/50">
      <div className="flex items-center justify-between px-3 py-2 bg-primary/10">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-primary">{contract.label || truncatedAddress}</div>
            <div className="text-xs opacity-60">{networkName}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-xs px-1 shrink-0" onClick={onClose} aria-label="Close contract">
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-2 py-2">
        <MethodSelector
          className="overflow-hidden"
          showCloseButton={false}
          readMethodsWithInputsAndWriteMethods={readMethodsWithInputsAndWriteMethods}
          abi={selectedMethods}
          onMethodSelect={onMethodSelect}
          removeMethod={onMethodRemove}
          showCustomCall={contract.showCustomCall}
          onToggleCustomCall={onToggleCustomCall}
          onAddFunctions={onAddFunctions}
          onRemoveFromAbi={onRemoveFromAbi}
        />
      </div>
    </div>
  );
};
