import React from "react";
import { Market } from "@/types";
import MarketCard from "./MarketCard";
import Card from "../ui/Card";

interface MarketGridProps {
  markets: Market[];
  title?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

const MarketGrid: React.FC<MarketGridProps> = ({
  markets,
  title = "Markets",
  emptyMessage = "No markets found",
  isLoading = false,
}) => {
  return (
    <div className="animate-in">
      {title && (
        <div className="mb-6">
          <h2 className="text-title-m font-semibold text-neutral-100 mb-2">
            {title}
          </h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full"></div>
        </div>
      )}

      {isLoading ? (
        <Card elevation={1} className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
          </div>
          <p className="text-body-s text-neutral-500">Loading markets...</p>
        </Card>
      ) : markets.length === 0 ? (
        <Card elevation={1} className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-body-m font-medium text-neutral-300 mb-2">
              {emptyMessage}
            </h3>
            <p className="text-body-s text-neutral-500">
              Markets will appear here once they're created and funded.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market, index) => (
            <div
              key={market.id}
              className="animate-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MarketCard market={market} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketGrid;
