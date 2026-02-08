"use client";

import { useEffect, useState } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { Abi, AbiFunction } from "abitype";
import { Address, encodeFunctionData } from "viem";
import { useReadContract } from "wagmi";
import { CheckCircleIcon, DocumentDuplicateIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  ContractInput,
  displayTxResult,
  getFunctionInputKey,
  getInitialFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
} from "~~/components/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type ReadOnlyFunctionFormProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  inheritedFrom?: string;
  abi: Abi;
};

export const ReadOnlyFunctionForm = ({
  contractAddress,
  abiFunction,
  inheritedFrom,
  abi,
}: ReadOnlyFunctionFormProps) => {
  const mainChainId = useGlobalState(state => state.targetNetwork.id);
  const [form, setForm] = useState<Record<string, any>>(() => getInitialFormState(abiFunction));
  const [result, setResult] = useState<unknown>();
  const [calldataCopied, setCalldataCopied] = useState(false);

  const { isFetching, refetch, error } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: abi,
    args: getParsedContractFunctionArgs(form),
    chainId: mainChainId,
    query: {
      enabled: false,
      retry: false,
    },
  });

  useEffect(() => {
    if (error) {
      const parsedError = getParsedError(error);
      notification.error(parsedError);
    }
  }, [error]);

  const handleCopyCalldata = async () => {
    try {
      const calldata = encodeFunctionData({
        abi: abi,
        functionName: abiFunction.name,
        args: getParsedContractFunctionArgs(form),
      });
      await navigator.clipboard.writeText(calldata);
      setCalldataCopied(true);
      setTimeout(() => {
        setCalldataCopied(false);
      }, 800);
    } catch (e) {
      const errorMessage = getParsedError(e);
      console.error("Error copying calldata:", e);
      notification.error(errorMessage);
    }
  };

  const transformedFunction = transformAbiFunction(abiFunction);
  const inputElements = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        key={key}
        setForm={updatedFormValue => {
          setResult(undefined);
          setForm(updatedFormValue);
        }}
        form={form}
        stateObjectKey={key}
        paramType={input}
      />
    );
  });

  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
      <p className="font-medium my-0 break-words">
        {abiFunction.name}
        <InheritanceTooltip inheritedFrom={inheritedFrom} />
      </p>
      {inputElements}
      <div className="flex justify-end gap-1">
        <div className="tooltip tooltip-left" data-tip="Copy Calldata">
          <button className="btn btn-ghost btn-sm" onClick={handleCopyCalldata}>
            {calldataCopied ? (
              <CheckCircleIcon
                className="h-5 w-5 text-xl font-normal text-secondary-content cursor-pointer"
                aria-hidden="true"
              />
            ) : (
              <DocumentDuplicateIcon className="h-5 w-5 text-xl font-normal text-secondary-content cursor-pointer" />
            )}
          </button>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            const { data } = await refetch();
            setResult(data);
          }}
          disabled={isFetching}
        >
          {isFetching && <span className="loading loading-spinner loading-xs"></span>}
          Read 📡
        </button>
      </div>
      {result !== null && result !== undefined && (
        <div className="bg-secondary rounded-3xl text-sm px-4 py-1.5 break-words overflow-auto w-full relative">
          <button
            className="absolute top-1.5 right-2 text-secondary-content/60 hover:text-secondary-content"
            onClick={() => setResult(undefined)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          <p className="font-bold m-0 mb-1">Result:</p>
          <pre className="whitespace-pre-wrap break-words">{displayTxResult(result, "sm")}</pre>
        </div>
      )}
    </div>
  );
};
