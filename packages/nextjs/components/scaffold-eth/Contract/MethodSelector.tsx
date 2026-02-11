import { type KeyboardEvent, useState } from "react";
import { AugmentedAbiFunction } from "./ContractUI";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CommandLineIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type MethodSelectorProps = {
  readMethodsWithInputsAndWriteMethods: AugmentedAbiFunction[];
  abi: AugmentedAbiFunction[];
  onMethodSelect: (uid: string) => void;
  removeMethod: (uid: string) => void;
  showCustomCall?: boolean;
  onToggleCustomCall?: () => void;
  onAddFunctions?: () => void;
  onRemoveFromAbi?: (uid: string) => void;
  className?: string;
  showCloseButton?: boolean;
};

export const MethodSelector = ({
  readMethodsWithInputsAndWriteMethods,
  abi,
  onMethodSelect,
  removeMethod,
  showCustomCall,
  onToggleCustomCall,
  onAddFunctions,
  onRemoveFromAbi,
  className = "overflow-auto h-[80vh]",
  showCloseButton = true,
}: MethodSelectorProps) => {
  const [isReadCollapsed, setIsReadCollapsed] = useState(false);
  const [isWriteCollapsed, setIsWriteCollapsed] = useState(false);

  const readMethods = readMethodsWithInputsAndWriteMethods.filter(
    method => method.stateMutability === "view" || method.stateMutability === "pure",
  );

  const writeMethods = readMethodsWithInputsAndWriteMethods.filter(
    method => method.stateMutability !== "view" && method.stateMutability !== "pure",
  );

  const isMethodSelected = (uid: string) => {
    return abi.some(method => method.uid === uid);
  };

  const callOnMethodSelectOnSpaceOrEnter = (event: KeyboardEvent<HTMLDivElement>, uid: string) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onMethodSelect(uid);
      event.stopPropagation();
    }
  };

  return (
    <div className={className}>
      {showCloseButton && (
        <>
          <input id="sidebar" type="checkbox" className="drawer-toggle" />
          <label htmlFor="sidebar" className="cursor-pointer block sm:hidden">
            <XMarkIcon className="h-5 w-5 mb-5 hover:opacity-70" />
          </label>
        </>
      )}

      {onAddFunctions && (
        <button className="btn btn-outline btn-sm w-full mb-4 gap-1" onClick={onAddFunctions}>
          <PlusIcon className="h-4 w-4" />
          Add Functions
        </button>
      )}

      <div>
        <h3
          className="font-semibold text-lg flex items-center cursor-pointer"
          onClick={() => setIsReadCollapsed(!isReadCollapsed)}
        >
          <span>
            {isReadCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 mr-2" />
            )}
          </span>{" "}
          Read
        </h3>
        {!isReadCollapsed && (
          <div className="flex flex-col items-start gap-1 pb-4">
            {readMethods.map(method => (
              <div
                key={method.uid}
                role="button"
                tabIndex={0}
                className={`btn btn-sm btn-ghost font-normal pr-1 w-full justify-between ${
                  isMethodSelected(method.uid) ? "bg-neutral pointer-events-none" : ""
                } ${onRemoveFromAbi ? "[&:has(.remove-btn:hover)]:bg-error/10" : ""}`}
                onClick={() => onMethodSelect(method.uid)}
                onKeyDown={event => callOnMethodSelectOnSpaceOrEnter(event, method.uid)}
              >
                <span className="flex items-center gap-1">
                  {onRemoveFromAbi && (
                    <button
                      className="remove-btn pointer-events-auto text-base-content/40 hover:text-error hover:bg-base-100 rounded-md p-1"
                      onClick={event => {
                        event.stopPropagation();
                        onRemoveFromAbi(method.uid);
                      }}
                      aria-label={`Remove ${method.name} from ABI`}
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {method.name}
                </span>
                {isMethodSelected(method.uid) && (
                  <button
                    className="ml-4 text-xs hover:bg-base-100 rounded-md p-1 pointer-events-auto"
                    onClick={event => {
                      removeMethod(method.uid);
                      event.stopPropagation();
                    }}
                    onKeyDown={event => event.stopPropagation()}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3
          className="font-semibold text-lg flex items-center cursor-pointer"
          onClick={() => setIsWriteCollapsed(!isWriteCollapsed)}
        >
          <span>
            {isWriteCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 mr-2" />
            )}
          </span>{" "}
          Write
        </h3>
        {!isWriteCollapsed && (
          <div className="flex flex-col items-start gap-1 pb-4">
            {writeMethods.map(method => (
              <div
                key={method.uid}
                role="button"
                tabIndex={0}
                className={`btn btn-sm btn-ghost font-normal pr-1 w-full justify-between ${
                  isMethodSelected(method.uid) ? "bg-neutral pointer-events-none" : ""
                } ${onRemoveFromAbi ? "[&:has(.remove-btn:hover)]:bg-error/10" : ""}`}
                onClick={() => onMethodSelect(method.uid)}
                onKeyDown={event => callOnMethodSelectOnSpaceOrEnter(event, method.uid)}
              >
                <span className="flex items-center gap-1">
                  {onRemoveFromAbi && (
                    <button
                      className="remove-btn pointer-events-auto text-base-content/40 hover:text-error hover:bg-base-100 rounded-md p-1"
                      onClick={event => {
                        event.stopPropagation();
                        onRemoveFromAbi(method.uid);
                      }}
                      aria-label={`Remove ${method.name} from ABI`}
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {method.name}
                </span>
                {isMethodSelected(method.uid) && (
                  <button
                    className="ml-4 text-xs hover:bg-base-100 rounded-md p-1 pointer-events-auto"
                    onClick={event => {
                      removeMethod(method.uid);
                      event.stopPropagation();
                    }}
                    onKeyDown={event => event.stopPropagation()}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {onToggleCustomCall && (
        <div className="mt-2 border-t border-base-300 pt-3">
          <div
            role="button"
            tabIndex={0}
            className={`btn btn-sm btn-ghost font-normal w-full justify-start gap-2 ${
              showCustomCall ? "bg-neutral" : ""
            }`}
            onClick={onToggleCustomCall}
          >
            <CommandLineIcon className="h-4 w-4" />
            Custom Call
            {showCustomCall && <XMarkIcon className="h-4 w-4 ml-auto" />}
          </div>
        </div>
      )}
    </div>
  );
};
