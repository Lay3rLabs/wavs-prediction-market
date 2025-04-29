import React from 'react';
import { Market } from '@/types';
import MarketCard from './MarketCard';

interface MarketGridProps {
  markets: Market[];
  title?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

const MarketGrid: React.FC<MarketGridProps> = ({
  markets,
  title = 'Markets',
  emptyMessage = 'No markets found',
  isLoading = false,
}) => {
  return (
    <div>
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      
      {isLoading ? (
        <div className="text-center py-12 bg-neutral-850 rounded-xl border border-gray-800">
          <p className="text-gray-400">Loading markets...</p>
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12 bg-neutral-850 rounded-xl border border-gray-800">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketGrid;