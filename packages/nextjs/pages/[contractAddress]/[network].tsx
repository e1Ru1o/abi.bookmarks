import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AbiFunction } from "abitype";
import { GetServerSideProps } from "next";
import { ParsedUrlQuery } from "querystring";
import { Abi, Address, isAddress } from "viem";
import { PlusIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { MiniHeader } from "~~/components/MiniHeader";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { ContractUI } from "~~/components/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { parseAndCorrectJSON } from "~~/utils/abi";
import {
  addRecentContract,
  appendAbiToBookmark,
  getBookmarkedAbi,
  removeFunctionFromBookmark,
  saveAbiBookmark,
  updateBookmarkLabel,
} from "~~/utils/abiBookmarks";
import { notification } from "~~/utils/scaffold-eth";

interface ParsedQueryContractDetailsPage extends ParsedUrlQuery {
  contractAddress: Address;
  network: string;
}

type ServerSideProps = {
  addressFromUrl: Address | null;
  chainIdFromUrl: number | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const contractAddress = context.params?.contractAddress as Address | undefined;
  const network = context.params?.network as string | undefined;

  const formattedAddress = contractAddress && isAddress(contractAddress) ? contractAddress : null;
  const formattedChainId = network ? parseInt(network, 10) : null;

  return {
    props: {
      addressFromUrl: formattedAddress,
      chainIdFromUrl: formattedChainId,
    },
  };
};

const ContractDetailPage = ({ addressFromUrl, chainIdFromUrl }: ServerSideProps) => {
  const router = useRouter();
  const { contractAddress, network } = router.query as ParsedQueryContractDetailsPage;
  const [localContractAbi, setLocalContractAbi] = useState<string>("");
  const [showAbiInput, setShowAbiInput] = useState(false);
  const [contractData, setContractData] = useState<{ address: Address; abi: Abi } | null>(null);
  const [contractLabel, setContractLabel] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  const { chains, setTargetNetwork } = useGlobalState(state => ({
    chains: state.chains,
    setTargetNetwork: state.setTargetNetwork,
  }));

  const chainId = parseInt(network);

  // Set the target network
  useEffect(() => {
    if (network) {
      const chain = Object.values(chains).find(chain => chain.id === parseInt(network));
      if (chain) {
        setTargetNetwork(chain);
      }
    }
  }, [network, chains, setTargetNetwork]);

  // Load bookmarked ABI from localStorage
  useEffect(() => {
    if (!contractAddress || !network) return;

    const bookmark = getBookmarkedAbi(chainId, contractAddress);
    const abi = bookmark?.abi ?? [];
    setContractData({ address: contractAddress, abi: abi as Abi });
    setContractLabel(bookmark?.label);

    addRecentContract(chainId, contractAddress, bookmark?.label);
    setIsLoaded(true);
  }, [contractAddress, network, chainId]);

  const handleLabelChange = (newLabel: string) => {
    const label = newLabel || undefined;
    setContractLabel(label);
    updateBookmarkLabel(chainId, contractAddress, label);
    addRecentContract(chainId, contractAddress, label);
  };

  const handleRemoveFromAbi = (abiFunction: AbiFunction) => {
    const updatedAbi = removeFunctionFromBookmark(chainId, contractAddress, abiFunction);
    setContractData({ address: contractAddress, abi: updatedAbi as Abi });
  };

  const handleImportAbi = () => {
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
      if (contractData && contractData.abi.length > 0) {
        finalAbi = appendAbiToBookmark(chainId, contractAddress, parsedAbi);
      } else {
        saveAbiBookmark(chainId, contractAddress, parsedAbi, contractLabel);
        finalAbi = parsedAbi;
      }

      setContractData({ address: contractAddress, abi: finalAbi });
      setLocalContractAbi("");
      setShowAbiInput(false);
      notification.success("ABI imported and saved.");
    } catch (error) {
      console.error("Error parsing ABI:", error);
      notification.error("Invalid ABI format. Please ensure it is valid JSON.");
    }
  };

  if (!isLoaded) {
    return (
      <>
        <MetaHeader address={addressFromUrl} network={chainIdFromUrl} />
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
      <MetaHeader address={addressFromUrl} network={chainIdFromUrl} />
      <div className="bg-base-100 h-screen flex flex-col">
        <MiniHeader />
        <div className="flex flex-col gap-y-6 lg:gap-y-8 flex-grow h-full overflow-hidden">
          {contractData && (
            <ContractUI
              key={`${contractAddress}-${contractData.abi.length}`}
              initialContractData={contractData}
              onAddFunctions={() => setShowAbiInput(true)}
              onRemoveFromAbi={handleRemoveFromAbi}
              contractLabel={contractLabel}
              onLabelChange={handleLabelChange}
            />
          )}

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
                      setShowAbiInput(false);
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
        </div>
      </div>
      <SwitchTheme className="fixed bottom-3 right-6 z-50" />
    </>
  );
};

export default ContractDetailPage;
