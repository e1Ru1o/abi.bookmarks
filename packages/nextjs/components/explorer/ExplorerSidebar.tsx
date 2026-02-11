import { useEffect, useRef, useState } from "react";
import { ExplorerSidebarItem } from "./ExplorerSidebarItem";
import { ArrowUpOnSquareIcon, PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
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
  workspaceName?: string;
  onWorkspaceRename?: (name: string) => void;
  onShare?: () => void;
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
  workspaceName,
  onWorkspaceRename,
  onShare,
}: ExplorerSidebarProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(workspaceName ?? "");
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    onWorkspaceRename?.(editValue);
  };

  return (
    <div className="flex flex-col h-full p-4">
      {onWorkspaceRename !== undefined && (
        <div className="shrink-0 mb-2">
          {isEditing ? (
            <input
              ref={inputRef}
              className="input input-sm input-bordered w-full text-sm font-semibold"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={e => {
                if (e.key === "Enter") handleFinishEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              placeholder="Workspace name"
            />
          ) : (
            <div className="flex items-center gap-1 w-full">
              <span className="truncate text-sm font-semibold text-base-content/80">
                {workspaceName || "Unsaved Workspace"}
              </span>
              <button className="btn btn-ghost btn-xs px-1 shrink-0" onClick={handleStartEdit}>
                <PencilSquareIcon className="h-3.5 w-3.5 opacity-60" />
              </button>
              {onShare && (
                <button className="btn btn-ghost btn-xs px-1 shrink-0" onClick={onShare}>
                  <ArrowUpOnSquareIcon className="h-3.5 w-3.5 opacity-60" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
