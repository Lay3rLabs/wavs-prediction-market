import { Market } from '@/types';
import { ethers, BigNumber } from 'ethers';

// Mock active market
export const mockActiveMarket: Market = {
  id: '0x1234567890123456789012345678901234567890',
  question: 'Will Bitcoin price exceed $100,000 by end of 2024?',
  createdAt: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
  isResolved: false,
  marketMakerAddress: '0x1234567890123456789012345678901234567890',
  conditionalTokensAddress: '0x2345678901234567890123456789012345678901',
  collateralTokenAddress: '0x3456789012345678901234567890123456789012',
  funding: BigNumber.from('1000000000000000000000'), // 1000 tokens
  volume: BigNumber.from('500000000000000000000'), // 500 tokens
  yesPrice: 0.65,
  noPrice: 0.35,
};

// Mock resolved markets
export const mockResolvedMarkets: Market[] = [
  {
    id: '0x2345678901234567890123456789012345678901',
    question: 'Will Ethereum switch to PoS before July 2025?',
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 14, // 14 days ago
    isResolved: true,
    resolvedAt: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
    result: true,
    marketMakerAddress: '0x2345678901234567890123456789012345678901',
    conditionalTokensAddress: '0x3456789012345678901234567890123456789012',
    collateralTokenAddress: '0x4567890123456789012345678901234567890123',
    funding: BigNumber.from('2000000000000000000000'), // 2000 tokens
    volume: BigNumber.from('1500000000000000000000'), // 1500 tokens
    yesPrice: 1,
    noPrice: 0,
  },
  {
    id: '0x3456789012345678901234567890123456789012',
    question: 'Will SpaceX successfully land on Mars by end of 2025?',
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    isResolved: true,
    resolvedAt: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
    result: false,
    marketMakerAddress: '0x3456789012345678901234567890123456789012',
    conditionalTokensAddress: '0x4567890123456789012345678901234567890123',
    collateralTokenAddress: '0x5678901234567890123456789012345678901234',
    funding: BigNumber.from('3000000000000000000000'), // 3000 tokens
    volume: BigNumber.from('2500000000000000000000'), // 2500 tokens
    yesPrice: 0,
    noPrice: 1,
  },
];

// All markets (active + resolved)
export const mockMarkets: Market[] = [mockActiveMarket, ...mockResolvedMarkets];

// Function to get a market by ID
export const getMockMarketById = (id: string): Market | undefined => {
  return mockMarkets.find(market => market.id === id);
}; 