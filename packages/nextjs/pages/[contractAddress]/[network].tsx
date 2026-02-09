import { GetServerSideProps } from "next";
import { Address, isAddress } from "viem";

export const getServerSideProps: GetServerSideProps = async context => {
  const contractAddress = context.params?.contractAddress as Address | undefined;
  const network = context.params?.network as string | undefined;

  if (contractAddress && isAddress(contractAddress) && network) {
    const chainId = parseInt(network, 10);
    return {
      redirect: {
        destination: `/explorer?add=${chainId}:${contractAddress}`,
        permanent: false,
      },
    };
  }

  return { redirect: { destination: "/", permanent: false } };
};

// Page component is required but never rendered (always redirects)
const RedirectPage = () => null;
export default RedirectPage;
