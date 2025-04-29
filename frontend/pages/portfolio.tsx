import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ethers, BigNumber } from 'ethers';
import Card from '@/components/ui/Card';
import { Market, MarketPosition } from '@/types';
import Link from 'next/link';
import { formatBigNumber, formatProbability, formatDate } from '@/utils/helpers';
import { FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';

// Mock data for demonstration
const mockPositions = [
  {
    market: {
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
    },
    position: {
      outcome: 'YES',
      amount: BigNumber.from('100000000000000000000'), // 100 tokens
      isResolved: false,
      canRedeem: false,
    }
  },
  {
    market: {
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
    position: {
      outcome: 'YES',
      amount: BigNumber.from('200000000000000000000'), // 200 tokens
      isResolved: true,
      canRedeem: true,
    }
  },
  {
    market: {
      id: '0x3456789012345678901234567890123456789012',
      question: 'Will the US Federal Reserve raise interest rates in Q3 2025?',
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
      isResolved: false,
      marketMakerAddress: '0x3456789012345678901234567890123456789012',
      conditionalTokensAddress: '0x4567890123456789012345678901234567890123',
      collateralTokenAddress: '0x5678901234567890123456789012345678901234',
      funding: BigNumber.from('1500000000000000000000'), // 1500 tokens
      volume: BigNumber.from('300000000000000000000'), // 300 tokens
      yesPrice: 0.48,
      noPrice: 0.52,
    },
    position: {
      outcome: 'NO',
      amount: BigNumber.from('150000000000000000000'), // 150 tokens
      isResolved: false,
      canRedeem: false,
    }
  },
];

interface MarketPositionProps {
  market: Market;
  position: MarketPosition;
}

const PositionCard: React.FC<MarketPositionProps> = ({ market, position }) => {
  return (
    <Card className="h-full">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{market.question}</h3>
        
        <div className="flex items-center ml-4 flex-shrink-0">
          {market.isResolved ? (
            market.result === (position.outcome === 'YES') ? (
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-900/30 text-green-500 text-sm">
                <FaCheck className="mr-1" /> Win
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded bg-red-900/30 text-red-500 text-sm">
                <FaTimes className="mr-1" /> Loss
              </span>
            )
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-900/30 text-blue-500 text-sm">
              <FaQuestionCircle className="mr-1" /> Open
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Your Position</div>
          <div className="font-semibold">
            {position.outcome}: {formatBigNumber(position.amount)} tokens
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">
            {market.isResolved ? 'Resolved' : 'Current Odds'}
          </div>
          <div className="font-semibold">
            {market.isResolved ? (
              formatDate(market.resolvedAt!)
            ) : (
              <>
                YES: {formatProbability(market.yesPrice)} / NO: {formatProbability(market.noPrice)}
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Link href={`/markets/${market.id}`} passHref legacyBehavior>
          <a className="crypto-button w-full justify-center">
            {position.canRedeem ? 'Redeem Position' : 'View Market'}
          </a>
        </Link>
      </div>
    </Card>
  );
};

export default function PortfolioPage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  
  const [positions, setPositions] = useState<Array<{ market: Market, position: MarketPosition }>>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPositions = async () => {
      if (!isConnected || !address) {
        setPositions([]);
        setIsLoading(false);
        return;
      }
      
      try {
        // In a real application, you'd fetch user positions from your contracts
        // For now, we'll use mock data
        setPositions(mockPositions);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching positions:', err);
        setIsLoading(false);
      }
    };
    
    fetchPositions();
  }, [isConnected, address, publicClient]);
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-8">Your Portfolio</h1>
      
      {!isConnected ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-xl mb-6">Please connect your wallet</p>
            <p className="text-gray-400">Connect your wallet to view your prediction market positions.</p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : positions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-xl mb-6">No positions found</p>
            <p className="text-gray-400 mb-6">You don't have any prediction market positions yet.</p>
            
            <Link href="/" passHref legacyBehavior>
              <a className="crypto-button inline-flex">
                Browse Markets
              </a>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((item, index) => (
              <PositionCard
                key={`${item.market.id}-${item.position.outcome}-${index}`}
                market={item.market}
                position={item.position}
              />
            ))}
          </div>
          
          <Card>
            <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Total Markets</div>
                <div className="text-2xl font-bold">{positions.length}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Open Positions</div>
                <div className="text-2xl font-bold">
                  {positions.filter(p => !p.market.isResolved).length}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-1">Redeemable Positions</div>
                <div className="text-2xl font-bold">
                  {positions.filter(p => p.position.canRedeem).length}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
