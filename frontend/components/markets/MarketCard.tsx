import React, { useState } from "react";
import Link from "next/link";
import { Market } from "@/types";
import Card from "../ui/Card";
import { formatProbability, formatDate, shortenAddress } from "@/utils/helpers";
import {
  FaCheck,
  FaTimes,
  FaQuestionCircle,
  FaCopy,
  FaCheckCircle,
} from "react-icons/fa";

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(market.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };

  const getStatusPill = () => {
    if (market.isResolved) {
      if (market.result) {
        return (
          <div className="pill-status yes">
            <FaCheck className="w-3 h-3 mr-1" />
            YES
          </div>
        );
      } else {
        return (
          <div className="pill-status no">
            <FaTimes className="w-3 h-3 mr-1" />
            NO
          </div>
        );
      }
    } else {
      return (
        <div className="pill-status open">
          <FaQuestionCircle className="w-3 h-3 mr-1" />
          OPEN
        </div>
      );
    }
  };

  const yesPercentage = market.yesPrice * 100;
  const noPercentage = market.noPrice * 100;

  return (
    <Link href={`/markets/${market.id}`} passHref legacyBehavior>
      <a className="block group">
        <Card
          className="h-full transition-all duration-250 ease-soft hover:shadow-card-hover"
          elevation={2}
          interactive
        >
          {/* Header */}
          <div className="market-header">
            <h3 className="market-question flex-1 pr-4">{market.question}</h3>
            <div className="flex-shrink-0">{getStatusPill()}</div>
          </div>

          {/* Progress Bar Section */}
          {!market.isResolved && (
            <div className="mb-4">
              <div className="progress-container">
                <div
                  className="progress-bar yes"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
              <div className="progress-indicator">
                <div className="progress-label yes">
                  <FaCheck className="w-3 h-3" />
                  <span>YES {formatProbability(market.yesPrice)}</span>
                </div>
                <div className="progress-label no">
                  <FaTimes className="w-3 h-3" />
                  <span>NO {formatProbability(market.noPrice)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="market-metadata">
            <div className="metadata-item">
              <div className="metadata-label">Created</div>
              <div className="metadata-value">
                {formatDate(market.createdAt)}
              </div>
            </div>
            {market.isResolved ? (
              <div className="metadata-item">
                <div className="metadata-label">Resolved</div>
                <div className="metadata-value">
                  {formatDate(market.resolvedAt!)}
                </div>
              </div>
            ) : (
              <div className="metadata-item">
                <div className="metadata-label">Volume</div>
                <div className="metadata-value">
                  {market.volume.toString().slice(0, 8)}...
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="market-footer">
            <div
              className="pill-id group/copy"
              onClick={handleCopyId}
              title="Click to copy ID"
            >
              <span className="mr-2">{shortenAddress(market.id)}</span>
              {copied ? (
                <FaCheckCircle className="w-3 h-3 text-success-400" />
              ) : (
                <FaCopy className="w-3 h-3 opacity-60 group-hover/copy:opacity-100 transition-opacity" />
              )}
            </div>

            <div className="text-body-xs text-neutral-500">
              {market.isResolved ? "Settled" : "Active"}
            </div>
          </div>
        </Card>
      </a>
    </Link>
  );
};

export default MarketCard;
