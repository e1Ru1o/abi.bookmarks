import { ExplorerSidebarItem } from "./ExplorerSidebarItem";
import { PlusIcon } from "@heroicons/react/24/outline";
import { MiniFooter } from "~~/components/MiniFooter";
import { ExplorerContract } from "~~/types/explorer";

type ExplorerSidebarProps = {
  contracts: ExplorerContract[];
  activeContractId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onMethodSelect: (contractId: string, uid: string) => void;
  onMethodRemove: (contractId: string, uid: string) => void;
  onToggleCustomCall: (contractId: string) => void;
  onAddFunctions: (contractId: string) => void;
  onRemoveFromAbi: (contractId: string, uid: string) => void;
  onOpenAddPopup: () => void;
};

export const ExplorerSidebar = ({
  contracts,
  activeContractId,
  onActivate,
  onClose,
  onMethodSelect,
  onMethodRemove,
  onToggleCustomCall,
  onAddFunctions,
  onRemoveFromAbi,
  onOpenAddPopup,
}: ExplorerSidebarProps) => {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="shrink-0 mb-3">
        <button className="btn btn-primary btn-sm w-full gap-1" onClick={onOpenAddPopup}>
          <PlusIcon className="h-4 w-4" />
          Add Contract
        </button>
      </div>

      <div className="flex-grow overflow-y-auto flex flex-col gap-1.5 min-h-0">
        {contracts.map(contract => (
          <ExplorerSidebarItem
            key={contract.id}
            contract={contract}
            isActive={contract.id === activeContractId}
            onActivate={() => onActivate(contract.id)}
            onClose={() => onClose(contract.id)}
            onMethodSelect={uid => onMethodSelect(contract.id, uid)}
            onMethodRemove={uid => onMethodRemove(contract.id, uid)}
            onToggleCustomCall={() => onToggleCustomCall(contract.id)}
            onAddFunctions={() => onAddFunctions(contract.id)}
            onRemoveFromAbi={uid => onRemoveFromAbi(contract.id, uid)}
          />
        ))}
      </div>

      <div className="shrink-0">
        <MiniFooter />
      </div>
    </div>
  );
};
