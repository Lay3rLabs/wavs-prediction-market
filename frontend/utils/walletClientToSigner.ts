import { type WalletClient } from 'wagmi';
import { providers, type Signer } from 'ethers';

// Function to convert WalletClient from wagmi to an ethers.js Signer
export function walletClientToSigner(walletClient: WalletClient): Signer {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  
  // Create a Web3Provider using the transport's provider
  const provider = new providers.Web3Provider(transport, network);
  
  // Return a JsonRpcSigner connected to the account
  return provider.getSigner(account.address);
}