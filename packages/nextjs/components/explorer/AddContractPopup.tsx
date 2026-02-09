import { useEffect, useState } from "react";
import { isAddress } from "viem";
import { mainnet } from "viem/chains";
import { BookmarkIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { NetworksDropdown } from "~~/components/NetworksDropdown/NetworksDropdown";
import { AddressInput } from "~~/components/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import {
  AbiBookmark,
  RecentContract,
  getAllBookmarksList,
  getRecentContractsList,
  removeAbiBookmark,
} from "~~/utils/abiBookmarks";
import { notification } from "~~/utils/scaffold-eth";

type AddContractPopupProps = {
  onAdd: (address: string, chainId: number) => void;
  onClose: () => void;
};

export const AddContractPopup = ({ onAdd, onClose }: AddContractPopupProps) => {
  const [network, setNetwork] = useState(mainnet.id.toString());
  const [contractAddress, setContractAddress] = useState("");
  const [bookmarks, setBookmarks] = useState<AbiBookmark[]>([]);
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);

  const chains = useGlobalState(state => state.chains);

  useEffect(() => {
    setBookmarks(getAllBookmarksList());
    setRecentContracts(getRecentContractsList());
  }, []);

  const getNetworkName = (chainId: number) => {
    const chain = chains.find(c => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleGo = () => {
    if (!isAddress(contractAddress)) {
      notification.error("Please enter a valid contract address.");
      return;
    }
    onAdd(contractAddress, parseInt(network));
  };

  const handleSelectContract = (address: string, chainId: number) => {
    onAdd(address, chainId);
  };

  const handleRemoveBookmark = (chainId: number, address: string) => {
    removeAbiBookmark(chainId, address);
    setBookmarks(getAllBookmarksList());
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-base-200 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 sticky top-0 bg-base-200 z-10 rounded-t-2xl">
          <h3 className="font-bold text-lg">Add Contract</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col items-center gap-4">
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <div id="react-select-container" className="w-full flex justify-center">
              <NetworksDropdown onChange={option => setNetwork(option ? option.value.toString() : "")} />
            </div>
            <div className="w-full">
              <AddressInput placeholder="Contract address" value={contractAddress} onChange={setContractAddress} />
            </div>
            <button
              className="btn btn-primary min-h-fit h-10 px-8 text-base font-semibold border-2 hover:bg-neutral hover:text-primary"
              onClick={handleGo}
              disabled={!contractAddress}
            >
              Add Contract
            </button>
          </div>

          {recentContracts.length > 0 && (
            <div className="w-full max-w-sm mt-4">
              <span className="font-semibold text-sm mb-3 block">Recent</span>
              <div className="flex flex-wrap gap-2">
                {recentContracts.slice(0, 6).map(rc => (
                  <button
                    key={`${rc.chainId}:${rc.address}`}
                    className="badge badge-outline badge-lg gap-1 hover:bg-primary hover:text-primary-content transition-colors cursor-pointer"
                    onClick={() => handleSelectContract(rc.address, rc.chainId)}
                  >
                    <span className="font-mono text-xs">{rc.label || truncateAddress(rc.address)}</span>
                    <span className="text-xs opacity-60">{getNetworkName(rc.chainId)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {bookmarks.length > 0 && (
            <div className="w-full max-w-sm mt-2 mb-2">
              <div className="flex items-center gap-2 mb-3">
                <BookmarkIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Saved ABIs</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {(showAllBookmarks ? bookmarks : bookmarks.slice(0, 5)).map(bm => (
                  <div
                    key={`${bm.chainId}:${bm.address}`}
                    className="flex items-center gap-2 bg-base-300 rounded-lg px-3 py-2"
                  >
                    <button
                      className="flex-grow flex justify-between items-center text-base-content hover:text-primary transition-colors min-w-0 text-left"
                      onClick={() => handleSelectContract(bm.address, bm.chainId)}
                    >
                      <div className="flex flex-col min-w-0">
                        {bm.label && <span className="text-sm font-medium truncate">{bm.label}</span>}
                        <span className="font-mono text-xs text-base-content/60 truncate">
                          {truncateAddress(bm.address)}
                        </span>
                      </div>
                      <span className="text-xs text-base-content/60 shrink-0 ml-2">{getNetworkName(bm.chainId)}</span>
                    </button>
                    <button
                      className="btn btn-ghost btn-xs px-1"
                      onClick={() => handleRemoveBookmark(bm.chainId, bm.address)}
                      aria-label="Remove bookmark"
                    >
                      <TrashIcon className="h-3.5 w-3.5 text-error/70" />
                    </button>
                  </div>
                ))}
              </div>
              {bookmarks.length > 5 && (
                <button
                  className="btn btn-ghost btn-xs mt-2 text-base-content/60"
                  onClick={() => setShowAllBookmarks(!showAllBookmarks)}
                >
                  {showAllBookmarks ? "Show less" : `Show more (${bookmarks.length - 5})`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
