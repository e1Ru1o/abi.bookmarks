import { useEffect, useMemo, useReducer, useState } from "react";
import { AbiFunction } from "abitype";
import { useContractRead } from "wagmi";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Address, Balance, CustomCallForm, augmentMethodsWithUid } from "~~/components/scaffold-eth";
import { ContractReadMethods } from "~~/components/scaffold-eth/Contract/ContractReadMethods";
import { ContractVariables } from "~~/components/scaffold-eth/Contract/ContractVariables";
import { ContractWriteMethods } from "~~/components/scaffold-eth/Contract/ContractWriteMethods";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { ExplorerContract } from "~~/types/explorer";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const mainNetworks = getTargetNetworks();

type ExplorerMainContentProps = {
  contract: ExplorerContract;
  onLabelChange: (label: string) => void;
  onRemoveFromAbi: (abiFunction: AbiFunction) => void;
};

export const ExplorerMainContent = ({ contract, onLabelChange, onRemoveFromAbi }: ExplorerMainContentProps) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(contract.label || "");
  const [refreshDisplayVariables, triggerRefreshDisplayVariables] = useReducer(value => !value, false);

  const { chainId } = useGlobalState(state => ({
    chainId: state.targetNetwork.id,
  }));
  const mainNetwork = mainNetworks.find(network => network.id === chainId);
  const networkColor = useNetworkColor(mainNetwork);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeMethod = (_uid: string) => {
    // No-op: method removal is handled by the sidebar MethodSelector
  };

  const { data: contractNameData, isLoading: isContractNameLoading } = useContractRead({
    address: contract.address,
    abi: contract.abi,
    chainId: contract.chainId,
    functionName: "name",
  });

  const displayContractName = useMemo(() => {
    if (isContractNameLoading) return "Loading...";
    if (contractNameData && typeof contractNameData === "string") {
      return contractNameData;
    }
    return "Contract";
  }, [isContractNameLoading, contractNameData]);

  useEffect(() => {
    if (!contract.label && contractNameData && typeof contractNameData === "string") {
      onLabelChange(contractNameData);
    }
  }, [contractNameData, contract.label]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLabelDraft(contract.label || "");
  }, [contract.label]);

  return (
    <div className="flex flex-col items-center justify-start overflow-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-6 w-full h-full flex-grow">
        <div className="col-span-6 grid grid-cols-1 gap-6 laptop:grid-cols-[repeat(13,_minmax(0,_1fr))] px-6 py-10">
          <div className="laptop:col-span-8 flex flex-col gap-6">
            <div className="z-10">
              <div className="bg-base-200 rounded-2xl shadow-xl flex flex-col mt-10 relative">
                <div className="h-[5rem] w-[5.5rem] bg-secondary absolute self-start rounded-[22px] -top-[38px] -left-[0px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                  <div className="flex items-center justify-center space-x-2">
                    <p className="my-0 text-sm font-bold">Read</p>
                  </div>
                </div>
                <div className="divide-y divide-base-300 px-5">
                  <ContractReadMethods
                    deployedContractData={{ address: contract.address, abi: selectedMethods }}
                    removeMethod={removeMethod}
                  />
                </div>
              </div>
            </div>
            <div className="z-10">
              <div className="bg-base-200 rounded-2xl shadow-xl flex flex-col mt-10 relative">
                <div className="h-[5rem] w-[5.5rem] bg-secondary absolute self-start rounded-[22px] -top-[38px] -left-[0px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                  <div className="flex items-center justify-center space-x-2">
                    <p className="my-0 text-sm font-bold">Write</p>
                  </div>
                </div>
                <div className="divide-y divide-base-300 px-5">
                  <ContractWriteMethods
                    deployedContractData={{ address: contract.address, abi: selectedMethods }}
                    onChange={triggerRefreshDisplayVariables}
                    removeMethod={removeMethod}
                  />
                </div>
              </div>
            </div>
            {contract.showCustomCall && (
              <div className="z-10">
                <div className="bg-base-200 rounded-2xl shadow-xl flex flex-col mt-10 relative">
                  <div className="h-[5rem] w-[7rem] bg-secondary absolute self-start rounded-[22px] -top-[38px] -left-[0px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                    <div className="flex items-center justify-center space-x-2">
                      <p className="my-0 text-sm font-bold">Custom</p>
                    </div>
                  </div>
                  <div className="divide-y divide-base-300 px-5">
                    <CustomCallForm contractAddress={contract.address} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="laptop:col-span-5 flex flex-col mt-10">
            <div className="bg-base-200 shadow-xl rounded-2xl px-6 mb-6 space-y-1 py-4">
              <div className="flex">
                <div className="flex flex-col gap-1">
                  <span className="font-bold pb-2">Contract Overview</span>
                  <div className="flex items-center pb-1 gap-1">
                    {isEditingLabel ? (
                      <input
                        className="input input-sm input-bordered font-medium text-base w-48"
                        value={labelDraft}
                        onChange={e => setLabelDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            onLabelChange(labelDraft.trim());
                            setIsEditingLabel(false);
                          }
                          if (e.key === "Escape") {
                            setLabelDraft(contract.label || "");
                            setIsEditingLabel(false);
                          }
                        }}
                        onBlur={() => {
                          onLabelChange(labelDraft.trim());
                          setIsEditingLabel(false);
                        }}
                        autoFocus
                        maxLength={40}
                        placeholder={displayContractName}
                      />
                    ) : (
                      <>
                        <span className="font-medium text-base">{contract.label || displayContractName}</span>
                        <button
                          className="btn btn-ghost btn-xs px-1"
                          onClick={() => {
                            setLabelDraft(contract.label || "");
                            setIsEditingLabel(true);
                          }}
                          aria-label="Edit contract label"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <Address address={contract.address} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">Balance:</span>
                    <Balance address={contract.address} className="h-1.5 min-h-[0.375rem] px-0" />
                  </div>
                </div>
              </div>
              {mainNetwork && (
                <p className="my-0 text-sm">
                  <span className="font-bold">Network</span>:{" "}
                  <span style={{ color: networkColor }}>
                    {mainNetwork.id == 31337 ? "Localhost" : mainNetwork.name}
                  </span>
                </p>
              )}
            </div>
            <div className="bg-base-200 shadow-xl rounded-2xl px-6 py-4">
              <span className="block font-bold pb-3">Contract Data</span>
              <ContractVariables
                refreshDisplayVariables={refreshDisplayVariables}
                deployedContractData={{ address: contract.address, abi: contract.abi }}
                onRemoveFromAbi={onRemoveFromAbi}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
