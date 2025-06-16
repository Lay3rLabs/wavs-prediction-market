import React from "react";
import Link from "next/link";
import { Market } from "@/types";
import Card from "../ui/Card";
import { formatProbability, formatDate, shortenAddress } from "@/utils/helpers";
import { FaCheck, FaTimes, FaQuestionCircle } from "react-icons/fa";

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  return (
    <Link href={`/markets/${market.id}`} passHref legacyBehavior>
      <a className="block">
        <Card
          className="h-full transition-transform duration-250 ease-soft hover:scale-[1.02]"
          elevation={2}
          interactive
        >
          <div className="flex items-start justify-between">
            <h3 className="text-body-m font-semibold text-neutral-100 leading-tight">
              {market.question}
            </h3>
            <div className="ml-m flex-shrink-0">
              {market.isResolved ? (
                market.result ? (
                  <span className="flex items-center text-success-600 text-body-s font-medium">
                    <FaCheck className="mr-xs" /> YES
                  </span>
                ) : (
                  <span className="flex items-center text-alert-600 text-body-s font-medium">
                    <FaTimes className="mr-xs" /> NO
                  </span>
                )
              ) : (
                <span className="flex items-center text-neutral-500 text-body-s font-medium">
                  <FaQuestionCircle className="mr-xs" /> Open
                </span>
              )}
            </div>
          </div>

          <div className="mt-m flex justify-between">
            <div className="space-y-xs">
              <div className="text-body-s text-neutral-500">Created</div>
              <div className="text-body-s text-neutral-300">
                {formatDate(market.createdAt)}
              </div>
            </div>
            <div className="space-y-xs text-right">
              {market.isResolved ? (
                <>
                  <div className="text-body-s text-neutral-500">Resolved</div>
                  <div className="text-body-s text-neutral-300">
                    {formatDate(market.resolvedAt!)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-body-s text-neutral-500">
                    Current Odds
                  </div>
                  <div className="text-body-s font-medium text-neutral-200">
                    YES: {formatProbability(market.yesPrice)} / NO:{" "}
                    {formatProbability(market.noPrice)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-m pt-m border-t border-neutral-700 flex justify-between text-body-s">
            <div className="text-neutral-400">
              <span className="text-neutral-500">Volume:</span>{" "}
              {market.volume.toString()}
            </div>
            <div className="text-neutral-400">
              <span className="text-neutral-500">ID:</span>{" "}
              {shortenAddress(market.id)}
            </div>
          </div>
        </Card>
      </a>
    </Link>
  );
};

export default MarketCard;
