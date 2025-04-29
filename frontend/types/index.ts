import { BigNumber } from 'ethers';

export interface Market {
  id: string;
  question: string;
  createdAt: number;
  resolvedAt?: number;
  isResolved: boolean;
  result?: boolean;
  marketMakerAddress: string;
  conditionalTokensAddress: string;
  collateralTokenAddress: string;
  funding: BigNumber;
  volume: BigNumber;
  yesPrice: number;
  noPrice: number;
}

export interface MarketTrade {
  id: string;
  marketId: string;
  trader: string;
  timestamp: number;
  outcome: 'YES' | 'NO';
  amount: BigNumber;
  price: BigNumber;
}

export interface CreateMarketFormData {
  question: string;
  funding: string;
  fee: string;
}

export interface MarketBuyFormData {
  outcome: 'YES' | 'NO';
  amount: string;
}

export interface MarketProbability {
  timestamp: number;
  yesProbability: number;
  noProbability: number;
}

export interface MarketPosition {
  outcome: 'YES' | 'NO';
  amount: BigNumber;
  isResolved: boolean;
  canRedeem: boolean;
}