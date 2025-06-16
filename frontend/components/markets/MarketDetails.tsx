import React from "react";
import { ethers } from "ethers";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { Market, MarketPosition } from "@/types";
import {
  formatProbability,
  formatDate,
  formatBigNumber,
} from "@/utils/helpers";
import MarketProbabilityChart from "../charts/MarketProbabilityChart";

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
  collateralBalance,
}) => {
  const sampleProbabilityData = [
    { timestamp: market.createdAt, yesProbability: 0.5, noProbability: 0.5 },
    {
      timestamp: market.createdAt + 86400,
      yesProbability: 0.55,
      noProbability: 0.45,
    },
    {
      timestamp: market.createdAt + 172800,
      yesProbability: 0.62,
      noProbability: 0.38,
    },
    {
      timestamp: market.createdAt + 259200,
      yesProbability: 0.58,
      noProbability: 0.42,
    },
    {
      timestamp: market.createdAt + 345600,
      yesProbability: 0.65,
      noProbability: 0.35,
    },
    {
      timestamp: Date.now() / 1000,
      yesProbability: market.yesPrice,
      noProbability: market.noPrice,
    },
  ];

  return (
    <div className="section-spacing">
      <Card elevation={1}>
        <h1 className="text-title-s font-bold text-neutral-100 mb-m title-glow">
          {market.question}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-l mt-l">
          <div>
            <h3 className="text-body-s text-neutral-500 mb-xs">Status</h3>
            <p
              className={`font-semibold text-body-m ${
                market.isResolved ? "text-success-600" : "text-primary-600"
              }`}
            >
              {market.isResolved ? "Resolved" : "Open"}
            </p>
          </div>

          <div>
            <h3 className="text-body-s text-neutral-500 mb-xs">Created</h3>
            <p className="text-body-m text-neutral-200">
              {formatDate(market.createdAt)}
            </p>
          </div>

          {market.isResolved && (
            <div>
              <h3 className="text-body-s text-neutral-500 mb-xs">Resolved</h3>
              <p className="text-body-m text-neutral-200">
                {formatDate(market.resolvedAt!)}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-body-s text-neutral-500 mb-xs">Volume</h3>
            <p className="text-body-m text-neutral-200">
              {formatBigNumber(market.volume)} tokens
            </p>
          </div>
        </div>

        {market.isResolved && market.result !== undefined && (
          <div className="mt-l p-m bg-neutral-800 border border-neutral-700 rounded-card-2">
            <h3 className="text-body-m font-semibold mb-s text-neutral-100">
              Outcome
            </h3>
            <p
              className={`text-title-s font-bold ${
                market.result ? "text-success-600" : "text-alert-600"
              }`}
            >
              {market.result ? "YES" : "NO"}
            </p>
          </div>
        )}

        <div className="mt-l p-m bg-neutral-800 border border-neutral-700 rounded-card-2">
          <h3 className="text-body-m font-semibold mb-s text-neutral-100">
            Your Position
          </h3>
          {userPosition ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-body-m text-neutral-200">
                  {userPosition.outcome === "YES" ? "YES" : "NO"} Tokens:{" "}
                  {formatBigNumber(userPosition.amount)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-body-m text-neutral-500">
              You don't have any position in this market yet.
            </p>
          )}
        </div>

        {/* Display collateral balance */}
        {collateralBalance && (
          <div className="mt-l p-m bg-neutral-800 border border-neutral-700 rounded-card-2">
            <h3 className="text-body-m font-semibold mb-s text-neutral-100">
              Your Collateral Balance
            </h3>
            <p className="text-title-s font-semibold text-primary-600">
              {formatBigNumber(collateralBalance)} Tokens
            </p>
          </div>
        )}

        {!market.isResolved && (
          <div className="mt-l">
            <Button
              onClick={onBuy}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Buy Prediction Tokens
            </Button>
          </div>
        )}
      </Card>

      <Card elevation={2}>
        <h2 className="text-body-m font-semibold mb-m text-neutral-100">
          Market Probability Over Time
        </h2>
        <div className="h-64">
          <MarketProbabilityChart data={sampleProbabilityData} />
        </div>
      </Card>

      <Card elevation={2}>
        <h2 className="text-body-m font-semibold mb-m text-neutral-100">
          Market Info
        </h2>
        <div className="space-y-m">
          <div className="flex justify-between">
            <span className="text-neutral-500 text-body-s">Market ID</span>
            <span className="font-mono text-body-s text-neutral-300">
              {market.id}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 text-body-s">Market Maker</span>
            <span className="font-mono text-body-s text-neutral-300">
              {market.marketMakerAddress}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 text-body-s">
              Conditional Tokens
            </span>
            <span className="font-mono text-body-s text-neutral-300">
              {market.conditionalTokensAddress}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 text-body-s">
              Collateral Token
            </span>
            <span className="font-mono text-body-s text-neutral-300">
              {market.collateralTokenAddress}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarketDetails;
