import { ethers, BigNumber } from 'ethers';

// Format a BigNumber with decimals to a human-readable string
export function formatBigNumber(value: BigNumber | string | number, decimals = 18): string {
  return ethers.utils.formatUnits(value.toString(), decimals);
}

// Parse a string to a BigNumber with decimals
export function parseBigNumber(value: string, decimals = 18): BigNumber {
  try {
    return ethers.utils.parseUnits(value, decimals);
  } catch (e) {
    return BigNumber.from(0);
  }
}

// Shorten an Ethereum address for display
export function shortenAddress(address: string, chars = 4): string {
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

// Convert a probability from 0-1 to percentage string
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(2)}%`;
}

// Format a timestamp to a readable date
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

// Calculate the price from a marginal price (0-1000000000000000000)
export function calculatePriceFromMarginalPrice(marginalPrice: BigNumber): number {
  return Number(marginalPrice.toBigInt()) / 0x10000000000000000;
}

// Generate a random bytes32 question ID
export function generateQuestionId(): string {
  return ethers.utils.hexlify(ethers.utils.randomBytes(32));
}

// Get the URL for an Etherscan transaction 
export function getEtherscanTxUrl(txHash: string, chainId: number): string {
  const domain = chainId === 1 ? 'etherscan.io' : 
               chainId === 5 ? 'goerli.etherscan.io' : 
               chainId === 31337 ? 'localhost:8545' :
               'etherscan.io';
  
  return chainId === 31337 
    ? `http://${domain}` 
    : `https://${domain}/tx/${txHash}`;
}