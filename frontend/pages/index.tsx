import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { ethers, BigNumber } from "ethers";
import MarketGrid from "@/components/markets/MarketGrid";
import { Market } from "@/types";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import {
  getLMSRMarketMakerContract,
  getConditionalTokensContract,
  getERC20Contract,
  LMSRMarketMakerABI,
} from "@/utils/contracts";
import { calculatePriceFromMarginalPrice } from "@/utils/helpers";
import { mockActiveMarket, mockResolvedMarkets } from "@/utils/mockData";
import { MARKET_MAKER_ADDRESS } from "@/utils/env";

export default function Home() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [activeMarkets, setActiveMarkets] = useState<Market[]>([]);
  const [resolvedMarkets, setResolvedMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active markets from contract and use mock data for resolved markets
  useEffect(() => {
    const fetchActiveMarkets = async () => {
      try {
        setIsLoading(true);

        if (!MARKET_MAKER_ADDRESS) {
          console.warn(
            "Market Maker address not found in environment variables, using mock data"
          );
          setActiveMarkets([mockActiveMarket]);
          setResolvedMarkets(mockResolvedMarkets);
          setIsLoading(false);
          return;
        }

        // Create a provider from the public client
        const provider = new ethers.providers.Web3Provider(
          publicClient.transport as any
        );

        // Create contract instances
        const marketMakerContract = new ethers.Contract(
          MARKET_MAKER_ADDRESS,
          LMSRMarketMakerABI,
          provider
        );

        const stage = await marketMakerContract.stage();
        // resolved when paused (stage 1). closed (stage 2) transfers outcome back to owner. when market is resolved, it is paused so people can redeem
        const isResolved = stage === 1;

        // Get conditional tokens and collateral token addresses
        const conditionalTokensAddress = await marketMakerContract.pmSystem();
        const collateralTokenAddress =
          await marketMakerContract.collateralToken();

        // Create conditional tokens contract instance
        const conditionalTokensContract = new ethers.Contract(
          conditionalTokensAddress,
          getConditionalTokensContract(
            conditionalTokensAddress,
            provider
          ).interface,
          provider
        );

        // Get condition ID (assuming first condition)
        const conditionId = await marketMakerContract.conditionIds(0);

        // Check if condition is resolved by checking payoutDenominator
        const payoutDenominator =
          await conditionalTokensContract.payoutDenominator(conditionId);
        const conditionResolved = payoutDenominator.gt(0);

        // Determine result if resolved
        let result = undefined;
        if (conditionResolved) {
          // Get outcome slot count first
          const outcomeSlotCount =
            await conditionalTokensContract.getOutcomeSlotCount(conditionId);

          // Initialize arrays to store payout values
          const payouts = [];

          // Query each payout value individually
          for (let i = 0; i < outcomeSlotCount.toNumber(); i++) {
            const payout = await conditionalTokensContract.payoutNumerators(
              conditionId,
              i
            );
            payouts.push(payout);
          }

          // YES wins if it has a higher payout than NO
          // Assuming binary market where index 1 is YES and index 0 is NO
          result = payouts[1].gt(payouts[0]);
        }

        // Get market prices
        const yesPrice = calculatePriceFromMarginalPrice(
          await marketMakerContract.calcMarginalPrice(1) // YES = index 1
        );
        const noPrice = calculatePriceFromMarginalPrice(
          await marketMakerContract.calcMarginalPrice(0) // NO = index 0
        );

        // Get the actual funding amount
        const funding = await marketMakerContract.funding();

        // Create market object
        const market: Market = {
          id: MARKET_MAKER_ADDRESS,
          question: "Will the price of Bitcoin be above $1 for the whole day?", // You would get the actual question from somewhere
          createdAt: Math.floor(Date.now() / 1000), // Mock creation date
          isResolved,
          result,
          resolvedAt: isResolved
            ? Math.floor(Date.now() / 1000) - 86400
            : undefined,
          marketMakerAddress: MARKET_MAKER_ADDRESS,
          conditionalTokensAddress: conditionalTokensAddress,
          collateralTokenAddress: collateralTokenAddress,
          funding,
          volume: BigNumber.from("500000000000000000000"),
          yesPrice,
          noPrice,
        };

        if (isResolved) {
          setActiveMarkets([]);
          setResolvedMarkets([market, ...mockResolvedMarkets]);
        } else {
          setActiveMarkets([market]);
          setResolvedMarkets(mockResolvedMarkets);
        }
      } catch (err) {
        console.error("Error fetching markets:", err);
        // Fallback to mock data on error
        setActiveMarkets([mockActiveMarket]);
        setResolvedMarkets(mockResolvedMarkets);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveMarkets();
  }, [publicClient]);

  return (
    <div className="section-spacing">
      <div className="flex justify-between items-center">
        <h1 className="text-title-m font-bold text-neutral-100 title-glow">
          Prediction Markets
        </h1>

        <Link href="/create" passHref legacyBehavior>
          <a className="btn-primary inline-flex items-center">
            <FaPlus className="mr-s" /> Create Market
          </a>
        </Link>
      </div>

      <MarketGrid
        markets={activeMarkets}
        title="Active Markets"
        emptyMessage="No active markets found. Create one!"
        isLoading={isLoading}
      />

      <MarketGrid
        markets={resolvedMarkets}
        title="Recently Resolved"
        emptyMessage="No resolved markets found."
      />
    </div>
  );
}
