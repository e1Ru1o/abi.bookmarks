import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Address, Hex, TransactionReceipt, isHex, parseEther } from "viem";
import { useAccount, usePublicClient, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { TxReceipt } from "~~/components/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type CustomCallFormProps = {
  contractAddress: Address;
};

export const CustomCallForm = ({ contractAddress }: CustomCallFormProps) => {
  const mainChainId = useGlobalState(state => state.targetNetwork.id);
  const [txValue, setTxValue] = useState<string>("");
  const [valueUnit, setValueUnit] = useState<"wei" | "ether">("ether");
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
      if (valueUnit === "ether") {
        return parseEther(txValue);
      }
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
    <div className="py-5 space-y-3 first:pt-0 last:pb-1">
      <div className="flex flex-col gap-3">
        <p className="font-medium my-0 break-words">Custom Call</p>

        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center ml-2">
            <span className="text-xs font-medium mr-2 leading-none">Value</span>
            <select
              className="select select-xs bg-base-300 rounded-md"
              value={valueUnit}
              onChange={e => setValueUnit(e.target.value as "wei" | "ether")}
            >
              <option value="ether">ETH</option>
              <option value="wei">wei</option>
            </select>
          </div>
          <input
            type="text"
            className="input input-ghost focus-within:border-transparent focus:outline-none focus:bg-transparent focus:text-secondary-content h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-secondary-content/75 bg-base-200"
            placeholder={`0 ${valueUnit === "ether" ? "ETH" : "wei"}`}
            value={txValue}
            onChange={e => setTxValue(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center ml-2">
            <span className="text-xs font-medium leading-none">Calldata (hex)</span>
          </div>
          <textarea
            className="textarea bg-base-200 w-full h-20 resize-none font-mono text-sm"
            placeholder="0x..."
            value={calldata}
            onChange={e => setCalldata(e.target.value)}
          />
        </div>

        {readResult && (
          <div className="bg-secondary rounded-3xl text-sm px-4 py-1.5 break-words overflow-auto">
            <p className="font-bold m-0 mb-1">Static Call Result:</p>
            <pre className="whitespace-pre-wrap break-words font-mono text-xs">{readResult}</pre>
          </div>
        )}

        {displayedTxResult && (
          <div className="flex-grow basis-0">
            <TxReceipt txResult={displayedTxResult} />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button className="btn btn-outline btn-sm" onClick={handleStaticCall}>
            Static Call
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
                Send Transaction
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={openConnectModal}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
