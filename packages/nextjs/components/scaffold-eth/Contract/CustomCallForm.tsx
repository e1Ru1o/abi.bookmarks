import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Address, Hex, TransactionReceipt, isHex } from "viem";
import { useAccount, usePublicClient, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BytesInput, IntegerInput, TxReceipt } from "~~/components/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type CustomCallFormProps = {
  contractAddress: Address;
  onClose?: () => void;
};

export const CustomCallForm = ({ contractAddress, onClose }: CustomCallFormProps) => {
  const mainChainId = useGlobalState(state => state.targetNetwork.id);
  const [txValue, setTxValue] = useState<string>("");
  const [calldata, setCalldata] = useState<string>("");
  const [readResult, setReadResult] = useState<string>("");
  const { chain, address: connectedAddress } = useAccount();
  const { openConnectModal } = useConnectModal();
  const writeTxn = useTransactor();
  const publicClient = usePublicClient({ chainId: mainChainId });
  const wrongNetwork = !chain || chain?.id !== mainChainId;

  const { data: result, isPending, sendTransactionAsync } = useSendTransaction();

  const [displayedTxResult, setDisplayedTxResult] = useState<TransactionReceipt>();
  const { data: txResult } = useWaitForTransactionReceipt({ hash: result });

  useEffect(() => {
    setDisplayedTxResult(txResult);
  }, [txResult]);

  const getValueInWei = (): bigint => {
    if (!txValue || txValue === "0" || txValue === "") return BigInt(0);
    try {
      return BigInt(txValue);
    } catch {
      return BigInt(0);
    }
  };

  const handleSend = async () => {
    if (!sendTransactionAsync) return;
    try {
      const txData = calldata && isHex(calldata) ? (calldata as Hex) : undefined;
      const makeTx = () =>
        sendTransactionAsync({
          to: contractAddress,
          value: getValueInWei(),
          data: txData,
        });
      await writeTxn(makeTx);
    } catch (e: any) {
      console.error("Custom call error:", e);
    }
  };

  const handleStaticCall = async () => {
    if (!publicClient) {
      notification.error("No public client available");
      return;
    }
    try {
      const txData = calldata && isHex(calldata) ? (calldata as Hex) : ("0x" as Hex);
      const result = await publicClient.call({
        to: contractAddress,
        value: getValueInWei(),
        data: txData,
        account: connectedAddress,
      });
      setReadResult(result.data || "0x (empty response)");
    } catch (e: any) {
      const parsedError = getParsedError(e);
      notification.error(parsedError);
      setReadResult(`Error: ${parsedError}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex justify-between items-center">
        <p className="font-medium my-0 break-words">custom call</p>
        {onClose && (
          <button className="btn btn-ghost btn-xs px-1" onClick={onClose} aria-label="Close custom call">
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center ml-2">
          <span className="text-xs font-medium mr-2 leading-none">value</span>
          <span className="block text-xs font-extralight leading-none">wei</span>
        </div>
        <IntegerInput
          value={txValue}
          onChange={updatedTxValue => {
            setDisplayedTxResult(undefined);
            setTxValue(updatedTxValue);
          }}
          placeholder="value (wei)"
          name="custom-call-value"
        />
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center ml-2">
          <span className="text-xs font-medium mr-2 leading-none">calldata</span>
          <span className="block text-xs font-extralight leading-none">bytes</span>
        </div>
        <BytesInput
          value={calldata}
          onChange={updatedCalldata => {
            setDisplayedTxResult(undefined);
            setCalldata(updatedCalldata);
          }}
          placeholder="0x..."
          name="custom-call-data"
        />
      </div>

      {readResult && (
        <div className="bg-secondary rounded-lg text-sm px-4 py-1.5 break-words overflow-auto w-full relative">
          <button
            className="absolute top-1 right-1 hover:bg-base-100/20 rounded-md p-0.5 text-secondary-content/60 hover:text-secondary-content"
            onClick={() => setReadResult("")}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          <p className="font-bold m-0 mb-1">Result:</p>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs">{readResult}</pre>
        </div>
      )}

      {displayedTxResult && (
        <div className="flex-grow basis-0 w-full relative">
          <button
            className="absolute top-1 right-1 z-10 hover:bg-base-100/20 rounded-md p-0.5 text-secondary-content/60 hover:text-secondary-content"
            onClick={() => setDisplayedTxResult(undefined)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          <TxReceipt txResult={displayedTxResult} />
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-2 flex-wrap">
        <button className="btn btn-secondary btn-sm" onClick={handleStaticCall}>
          Read 📡
        </button>
        {connectedAddress ? (
          <div
            className={`flex ${
              wrongNetwork &&
              "tooltip before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
            }`}
            data-tip={`${wrongNetwork && "Wrong network"}`}
          >
            <button className="btn btn-secondary btn-sm" disabled={wrongNetwork || isPending} onClick={handleSend}>
              {isPending && <span className="loading loading-spinner loading-xs"></span>}
              Send 💸
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={openConnectModal}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};
