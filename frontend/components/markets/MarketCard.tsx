import React from 'react';
import Link from 'next/link';
import { Market } from '@/types';
import Card from '../ui/Card';
import { formatProbability, formatDate, shortenAddress } from '@/utils/helpers';
import { FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  return (
    <Link href={`/markets/${market.id}`} passHref legacyBehavior>
      <a className="block">
        <Card className="h-full hover:scale-[1.02] transition-transform">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold">{market.question}</h3>
            <div className="ml-4 flex-shrink-0">
              {market.isResolved ? (
                market.result ? (
                  <span className="flex items-center text-green-500">
                    <FaCheck className="mr-1" /> YES
                  </span>
                ) : (
                  <span className="flex items-center text-red-500">
                    <FaTimes className="mr-1" /> NO
                  </span>
                )
              ) : (
                <span className="flex items-center text-gray-400">
                  <FaQuestionCircle className="mr-1" /> Open
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <div className="space-y-1">
              <div className="text-sm text-gray-400">Created</div>
              <div className="text-sm">{formatDate(market.createdAt)}</div>
            </div>
            <div className="space-y-1 text-right">
              {market.isResolved ? (
                <>
                  <div className="text-sm text-gray-400">Resolved</div>
                  <div className="text-sm">{formatDate(market.resolvedAt!)}</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-400">Current Odds</div>
                  <div className="text-sm font-medium">
                    YES: {formatProbability(market.yesPrice)} / NO: {formatProbability(market.noPrice)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-sm">
            <div>
              <span className="text-gray-400">Volume:</span> {market.volume.toString()}
            </div>
            <div>
              <span className="text-gray-400">ID:</span> {shortenAddress(market.id)}
            </div>
          </div>
        </Card>
      </a>
    </Link>
  );
};

export default MarketCard;