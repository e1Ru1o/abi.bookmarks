import { fetchContractABIFromEtherscan } from "./abi";
import { HEIMDALL_API_URL } from "./constants";
import { Chain } from "viem";

export async function fetchAbiFromEtherscan(address: string, chainId: number): Promise<unknown[]> {
  const { abi } = await fetchContractABIFromEtherscan(address as `0x${string}`, chainId);
  if (!abi || !Array.isArray(abi) || abi.length === 0) throw new Error("Empty ABI from Etherscan");
  return abi;
}

export async function guessAbiWithHeimdall(address: string, chainId: number, chains: Chain[]): Promise<unknown[]> {
  const chain = chains.find(c => c.id === chainId);
  const rpcUrl = chain?.rpcUrls?.default?.http?.[0];
  if (!rpcUrl) throw new Error("No RPC URL available for this chain");

  const rpcUrlWithoutHttps = rpcUrl.substring(8);
  const response = await fetch(`${HEIMDALL_API_URL}/${address}?rpc_url=${rpcUrlWithoutHttps}`);
  if (!response.ok) throw new Error(`Heimdall HTTP ${response.status}`);

  const abi = await response.json();
  if (!Array.isArray(abi) || abi.length === 0) throw new Error("Empty ABI from Heimdall");
  return abi;
}
