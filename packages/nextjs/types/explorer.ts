import { Abi, Address } from "viem";

export type ExplorerContract = {
  id: string; // `${chainId}:${address}`
  address: Address;
  chainId: number;
  abi: Abi;
  label?: string;
  selectedMethodUids: string[];
  showCustomCall: boolean;
};
