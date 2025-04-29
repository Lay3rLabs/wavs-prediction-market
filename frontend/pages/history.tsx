import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ethers, BigNumber } from 'ethers';
import MarketGrid from '@/components/markets/MarketGrid';
import Card from '@/components/ui/Card';
import { Market } from '@/types';

// Mock data for demonstration
const mockMarkets: Market[] = [
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
    yesPrice: 0.75,
    noPrice: 0.25,
  },
  {
    id: '0x3456789012345678901234567890123456789012',
    question: 'Will the 2024 US Presidential Election have more than 160 million voters?',
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    isResolved: true,
    resolvedAt: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
    result: false,
    marketMakerAddress: '0x3456789012345678901234567890123456789012',
    conditionalTokensAddress: '0x4567890123456789012345678901234567890123',
    collateralTokenAddress: '0x5678901234567890123456789012345678901234',
    funding: BigNumber.from('1500000000000000000000'), // 1500 tokens
    volume: BigNumber.from('1200000000000000000000'), // 1200 tokens
    yesPrice: 0.3,
    noPrice: 0.7,
  },
  {
    id: '0x4567890123456789012345678901234567890123',
    question: 'Will Bitcoin halving cause a price increase of at least 50% within 3 months?',
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 60, // 60 days ago
    isResolved: true,
    resolvedAt: Math.floor(Date.now() / 1000) - 86400 * 10, // 10 days ago
    result: true,
    marketMakerAddress: '0x4567890123456789012345678901234567890123',
    conditionalTokensAddress: '0x5678901234567890123456789012345678901234',
    collateralTokenAddress: '0x6789012345678901234567890123456789012345',
    funding: BigNumber.from('3000000000000000000000'), // 3000 tokens
    volume: BigNumber.from('2500000000000000000000'), // 2500 tokens
    yesPrice: 0.85,
    noPrice: 0.15,
  },
];

export default function HistoryPage() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  const [resolvedMarkets, setResolvedMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real application, you'd fetch resolved markets from your contracts
    // For now, we'll use mock data
    setResolvedMarkets(mockMarkets);
    setIsLoading(false);
  }, [publicClient]);
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-8">Market History</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : resolvedMarkets.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-lg text-gray-400">No resolved markets found.</p>
          </div>
        </Card>
      ) : (
        <MarketGrid 
          markets={resolvedMarkets} 
          title="Resolved Markets" 
          emptyMessage="No resolved markets found."
        />
      )}
      
      <Card>
        <h2 className="text-xl font-semibold mb-4">Historical Data</h2>
        <p className="text-gray-300 mb-4">
          This page shows all resolved prediction markets in the system.
          You can view the question, outcome, and market statistics for each market.
        </p>
        <p className="text-gray-400">
          Prediction markets provide valuable historical data on collective forecasting accuracy.
          By analyzing past markets, users can identify patterns and improve future predictions.
        </p>
      </Card>
    </div>
  );
}
