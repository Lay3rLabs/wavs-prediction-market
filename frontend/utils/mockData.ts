import { Market } from "@/types";
import { ethers, BigNumber } from "ethers";

// Mock active market
export const mockActiveMarket: Market = {
  id: "0x1234567890123456789012345678901234567890",
  question: "Will the price of Bitcoin exceed $200,000 by end of 2025?",
  createdAt: new Date("2025-01-01 00:00:00").getTime() / 1000,
  isResolved: false,
  marketMakerAddress: "0x1234567890123456789012345678901234567890",
  conditionalTokensAddress: "0x2345678901234567890123456789012345678901",
  collateralTokenAddress: "0x3456789012345678901234567890123456789012",
  funding: BigNumber.from("10000000000000000000"),
  volume: BigNumber.from("5000000000000000000"),
  yesPrice: 0.65,
  noPrice: 0.35,
};

// Mock resolved markets
export const mockResolvedMarkets: Market[] = [
  {
    id: "0x2345678901234567890123456789012345678901",
    question: "Will Ethereum complete the Cancun-Deneb upgrade by Q3 2024?",
    createdAt: new Date("2024-01-01 00:00:00").getTime() / 1000,
    isResolved: true,
    resolvedAt: new Date("2024-03-13 00:00:00").getTime() / 1000,
    result: true,
    marketMakerAddress: "0x2345678901234567890123456789012345678901",
    conditionalTokensAddress: "0x3456789012345678901234567890123456789012",
    collateralTokenAddress: "0x4567890123456789012345678901234567890123",
    funding: BigNumber.from("200000000000000000"),
    volume: BigNumber.from("150000000000000000"),
    yesPrice: 1,
    noPrice: 0,
  },
  {
    id: "0x3456789012345678901234567890123456789012",
    question: "Will the price of Bitcoin exceed $200,000 by end of 2024?",
    createdAt: new Date("2024-01-01 00:00:00").getTime() / 1000,
    isResolved: true,
    resolvedAt: new Date("2025-01-01 00:00:00").getTime() / 1000,
    result: false,
    marketMakerAddress: "0x3456789012345678901234567890123456789012",
    conditionalTokensAddress: "0x4567890123456789012345678901234567890123",
    collateralTokenAddress: "0x5678901234567890123456789012345678901234",
    funding: BigNumber.from("30000000000000000"),
    volume: BigNumber.from("25000000000000000"),
    yesPrice: 0,
    noPrice: 1,
  },
];

// All markets (active + resolved)
export const mockMarkets: Market[] = [mockActiveMarket, ...mockResolvedMarkets];

// Function to get a market by ID
export const getMockMarketById = (id: string): Market | undefined => {
  return mockMarkets.find((market) => market.id === id);
};
