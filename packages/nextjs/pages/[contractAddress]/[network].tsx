import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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
  saveAbiBookmark,
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
    if (bookmark && bookmark.abi.length > 0) {
      setContractData({ address: contractAddress, abi: bookmark.abi });
    }

    // Track as recent
    addRecentContract(chainId, contractAddress);
    setIsLoaded(true);
  }, [contractAddress, network, chainId]);

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

      // If there's already an ABI, merge; otherwise save fresh
      const merged = contractData
        ? appendAbiToBookmark(chainId, contractAddress, parsedAbi)
        : (saveAbiBookmark(chainId, contractAddress, parsedAbi), parsedAbi);

      const finalAbi = Array.isArray(merged) ? merged : parsedAbi;
      setContractData({ address: contractAddress, abi: finalAbi as Abi });
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
          {contractData && contractData.abi.length > 0 ? (
            <ContractUI
              key={`${contractAddress}-${contractData.abi.length}`}
              initialContractData={contractData}
              onAddFunctions={() => setShowAbiInput(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow gap-6 px-4">
              <div className="bg-base-200 rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center gap-4">
                <h2 className="text-xl font-bold text-center">No ABI Found</h2>
                <p className="text-center text-base-content/70 text-sm">
                  No saved ABI for <span className="font-mono bg-neutral px-2 py-0.5 rounded text-xs">{contractAddress}</span> on this network.
                </p>
                <p className="text-center text-base-content/70 text-sm">
                  Import an ABI to start interacting with this contract.
                </p>
                <textarea
                  className="textarea bg-neutral w-full h-32 resize-none font-mono text-sm"
                  placeholder="Paste contract ABI in JSON format here"
                  value={localContractAbi}
                  onChange={e => setLocalContractAbi(e.target.value)}
                />
                <button
                  className="btn btn-primary min-h-fit h-10 px-6 text-base font-semibold border-2 hover:bg-neutral hover:text-primary"
                  onClick={handleImportAbi}
                >
                  Import ABI
                </button>
                <Link href="/" className="btn btn-ghost btn-sm mt-2">
                  Back to home
                </Link>
              </div>
            </div>
          )}

          {/* ABI Import Modal */}
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
