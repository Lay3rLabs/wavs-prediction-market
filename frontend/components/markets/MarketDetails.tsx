import React from 'react';
import { ethers } from 'ethers';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Market, MarketPosition } from '@/types';
import { formatProbability, formatDate, formatBigNumber } from '@/utils/helpers';
import MarketProbabilityChart from '../charts/MarketProbabilityChart';

interface MarketDetailsProps {
  market: Market;
  userPosition?: MarketPosition;
  onBuy: () => void;
  collateralBalance?: ethers.BigNumber | null;
}

const MarketDetails: React.FC<MarketDetailsProps> = ({ 
  market, 
  userPosition,
  onBuy,
  collateralBalance 
}) => {
  const sampleProbabilityData = [
    { timestamp: market.createdAt, yesProbability: 0.5, noProbability: 0.5 },
    { timestamp: market.createdAt + 86400, yesProbability: 0.55, noProbability: 0.45 },
    { timestamp: market.createdAt + 172800, yesProbability: 0.62, noProbability: 0.38 },
    { timestamp: market.createdAt + 259200, yesProbability: 0.58, noProbability: 0.42 },
    { timestamp: market.createdAt + 345600, yesProbability: 0.65, noProbability: 0.35 },
    { timestamp: Date.now() / 1000, yesProbability: market.yesPrice, noProbability: market.noPrice },
  ];
  
  return (
    <div className="space-y-8">
      <div className="p-6 bg-neutral-850 border border-gray-800 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">{market.question}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div>
            <h3 className="text-sm text-gray-400 mb-1">Status</h3>
            <p className={`font-semibold ${market.isResolved ? 'text-green-500' : 'text-primary-500'}`}>
              {market.isResolved ? 'Resolved' : 'Open'}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-400 mb-1">Created</h3>
            <p>{formatDate(market.createdAt)}</p>
          </div>
          
          {market.isResolved && (
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Resolved</h3>
              <p>{formatDate(market.resolvedAt!)}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm text-gray-400 mb-1">Volume</h3>
            <p>{formatBigNumber(market.volume)} tokens</p>
          </div>
        </div>
        
        {market.isResolved && market.result !== undefined && (
          <div className="mt-6 p-4 bg-neutral-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Outcome</h3>
            <p className={`text-xl font-bold ${market.result ? 'text-green-500' : 'text-red-500'}`}>
              {market.result ? 'YES' : 'NO'}
            </p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-neutral-900 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Your Position</h3>
          {userPosition ? (
            <div className="flex justify-between items-center">
              <div>
                <p>
                  {userPosition.outcome === 'YES' ? 'YES' : 'NO'} Tokens: {formatBigNumber(userPosition.amount)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">You don't have any position in this market yet.</p>
          )}
        </div>
        
        {/* Display collateral balance */}
        {collateralBalance && (
          <div className="mt-6 p-4 bg-neutral-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Your Collateral Balance</h3>
            <p className="text-xl font-semibold">{formatBigNumber(collateralBalance)} Tokens</p>
          </div>
        )}
        
        {!market.isResolved && (
          <div className="mt-6">
            <Button onClick={onBuy} variant="primary" size="lg" className="w-full">
              Buy Prediction Tokens
            </Button>
          </div>
        )}
      </div>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4">Market Probability Over Time</h2>
        <div className="h-64">
          <MarketProbabilityChart data={sampleProbabilityData} />
        </div>
      </Card>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4">Market Info</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Market ID</span>
            <span className="font-mono text-sm">{market.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Market Maker</span>
            <span className="font-mono text-sm">{market.marketMakerAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Conditional Tokens</span>
            <span className="font-mono text-sm">{market.conditionalTokensAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Collateral Token</span>
            <span className="font-mono text-sm">{market.collateralTokenAddress}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarketDetails;