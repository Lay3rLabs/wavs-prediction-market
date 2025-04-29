import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAccount, usePublicClient } from "wagmi";
import { useWalletClient } from "wagmi";
import { ethers, BigNumber } from "ethers";
import MarketDetails from "@/components/markets/MarketDetails";
import BuyPredictionForm from "@/components/markets/BuyPredictionForm";
import RedeemPositionForm from "@/components/markets/RedeemPositionForm";
import { Market, MarketPosition } from "@/types";
import Card from "@/components/ui/Card";
import {
  getLMSRMarketMakerContract,
  getConditionalTokensContract,
  getERC20Contract,
  LMSRMarketMakerABI,
} from "@/utils/contracts";
import { calculatePriceFromMarginalPrice } from "@/utils/helpers";
import { getMockMarketById } from "@/utils/mockData";

// Mock position for demonstration
const mockPosition: MarketPosition = {
  outcome: "YES",
  amount: BigNumber.from("100000000000000000000"), // 100 tokens
  isResolved: false,
  canRedeem: false,
};

export default function MarketPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [market, setMarket] = useState<Market | null>(null);
  const [userPosition, setUserPosition] = useState<MarketPosition | null>(null);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [collateralBalance, setCollateralBalance] = useState<ethers.BigNumber | null>(null);

  // Fetch market data function
  const fetchMarketData = useCallback(
    async (marketId: string) => {
      try {
        const mockMarket = getMockMarketById(marketId);
        if (mockMarket) {
          setUsingMockData(true);
          return mockMarket;
        }

        const provider = new ethers.providers.Web3Provider(
          publicClient.transport as any
        );

        try {
          // Create contract instances using the market ID as the market maker address
          const marketMakerContract = new ethers.Contract(
            marketId,
            LMSRMarketMakerABI,
            provider
          );

          // Get conditional tokens and collateral token addresses
          const conditionalTokensAddress = await marketMakerContract.pmSystem();
          const collateralTokenAddress =
            await marketMakerContract.collateralToken();

          // Get market prices
          const yesPrice = calculatePriceFromMarginalPrice(
            await marketMakerContract.calcMarginalPrice(1) // YES = index 1
          );
          const noPrice = calculatePriceFromMarginalPrice(
            await marketMakerContract.calcMarginalPrice(0) // NO = index 0
          );

          // Get the actual funding amount
          const funding = await marketMakerContract.funding();

          // Get market state
          const stageNum = await marketMakerContract.stage();
          // resolved when paused (stage 1). closed (stage 2) transfers outcome back to owner. when market is resolved, it is paused so people can redeem
          const isResolved = stageNum === 1;

          // Get condition ID (assuming first condition)
          const conditionId = await marketMakerContract.conditionIds(0);

          // Create conditional tokens contract
          const conditionalTokensContract = new ethers.Contract(
            conditionalTokensAddress,
            getConditionalTokensContract(
              conditionalTokensAddress,
              provider
            ).interface,
            provider
          );

          // Check if condition is resolved by querying payoutDenominator
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

          // Create real market object
          const marketData: Market = {
            id: marketId,
            question: "Will the price of Bitcoin be above $1 for the whole day?", // You would get the question from somewhere
            createdAt: Math.floor(Date.now() / 1000), // Mock creation date
            isResolved,
            result,
            resolvedAt: isResolved
              ? Math.floor(Date.now() / 1000) - 86400
              : undefined,
            marketMakerAddress: marketId,
            conditionalTokensAddress: conditionalTokensAddress,
            collateralTokenAddress: collateralTokenAddress,
            funding: funding,
            volume: BigNumber.from("500000000000000000000"), // Mock volume for now
            yesPrice: yesPrice,
            noPrice: noPrice,
          };

          setUsingMockData(false);
          return marketData;
        } catch (contractErr) {
          console.error(
            "Contract error, falling back to mock data:",
            contractErr
          );

          // Try to load mock data
          const mockMarket = getMockMarketById(marketId);
          if (mockMarket) {
            setUsingMockData(true);
            return mockMarket;
          }

          // If no mock data found, rethrow the original error
          throw contractErr;
        }
      } catch (err: any) {
        throw new Error(
          "Failed to fetch market data: " + (err.message || "Unknown error")
        );
      }
    },
    [publicClient]
  );

  // Fetch user position function
  const fetchUserPosition = useCallback(
    async (marketData: Market, userAddress: string) => {
      if (!isConnected || !userAddress) return null;

      // If using mock data, return a mock position
      if (usingMockData) {
        return {
          ...mockPosition,
          isResolved: marketData.isResolved,
          canRedeem: marketData.isResolved,
        };
      }

      try {
        const provider = new ethers.providers.Web3Provider(
          publicClient.transport as any
        );

        const conditionalTokensContract = new ethers.Contract(
          marketData.conditionalTokensAddress,
          getConditionalTokensContract(
            marketData.conditionalTokensAddress,
            provider
          ).interface,
          provider
        );

        const marketMakerContract = new ethers.Contract(
          marketData.marketMakerAddress,
          LMSRMarketMakerABI,
          provider
        );

        // Get the condition ID
        const conditionIds = await marketMakerContract.conditionIds(0);

        // YES position uses index set 2 (binary: 10)
        const yesIndexSet = 2;
        // NO position uses index set 1 (binary: 01)
        const noIndexSet = 1;

        // Get collection IDs
        const yesCollectionId = await conditionalTokensContract.getCollectionId(
          ethers.constants.HashZero,
          conditionIds,
          yesIndexSet
        );

        const noCollectionId = await conditionalTokensContract.getCollectionId(
          ethers.constants.HashZero,
          conditionIds,
          noIndexSet
        );

        // Get position IDs
        const yesPositionId = await conditionalTokensContract.getPositionId(
          marketData.collateralTokenAddress,
          yesCollectionId
        );

        const noPositionId = await conditionalTokensContract.getPositionId(
          marketData.collateralTokenAddress,
          noCollectionId
        );

        // Get user's balance for each position
        const yesBalance = await conditionalTokensContract.balanceOf(
          userAddress,
          yesPositionId
        );
        const noBalance = await conditionalTokensContract.balanceOf(
          userAddress,
          noPositionId
        );

        // Determine if user can redeem positions (only if market is resolved)
        const canRedeem =
          marketData.isResolved && (yesBalance.gt(0) || noBalance.gt(0));

        // Determine which outcome the user is predominantly invested in
        if (yesBalance.gt(0) || noBalance.gt(0)) {
          const outcome: "YES" | "NO" = yesBalance.gt(noBalance) ? "YES" : "NO";
          const userPositionData: MarketPosition = {
            outcome,
            amount: yesBalance.gt(noBalance) ? yesBalance : noBalance,
            isResolved: marketData.isResolved,
            canRedeem,
          };
          return userPositionData;
        }

        return null;
      } catch (err: any) {
        console.error("Error fetching user position:", err);
        return null;
      }
    },
    [isConnected, publicClient, usingMockData]
  );

  // Combined function to refresh all data
  const refreshData = useCallback(async () => {
    if (!id || typeof id !== "string") return;

    setIsLoading(true);
    try {
      const marketData = await fetchMarketData(id);
      setMarket(marketData);

      if (isConnected && address) {
        const positionData = await fetchUserPosition(marketData, address);
        setUserPosition(positionData);
        
        // Fetch user's collateral token balance
        try {
          const provider = new ethers.providers.Web3Provider(
            publicClient.transport as any
          );
          
          const collateralTokenContract = new ethers.Contract(
            marketData.collateralTokenAddress,
            getERC20Contract(marketData.collateralTokenAddress, provider).interface,
            provider
          );
          
          const balance = await collateralTokenContract.balanceOf(address);
          setCollateralBalance(balance);
        } catch (balanceErr) {
          console.error("Error fetching collateral balance:", balanceErr);
        }
      }
    } catch (err: any) {
      console.error("Error refreshing data:", err);
      setError(err.message || "Failed to load market details");
    } finally {
      setIsLoading(false);
    }
  }, [id, isConnected, address, fetchMarketData, fetchUserPosition, publicClient]);

  // Initial data loading
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleBuyClick = () => {
    setShowBuyForm(true);
  };

  const handleBuySuccess = () => {
    setShowBuyForm(false);
    refreshData();
  };

  const handleRedeemSuccess = () => {
    refreshData();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-xl text-red-500 mb-4">
            {error || "Market not found"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-primary-500 hover:text-primary-400"
          >
            Return to Markets
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {usingMockData && (
        <div className="p-3 bg-yellow-900/30 border border-yellow-500 rounded-lg text-yellow-500 text-sm">
          Viewing mock market data
        </div>
      )}

      {showBuyForm && (
        <BuyPredictionForm 
          market={market} 
          onSuccess={handleBuySuccess} 
          collateralBalance={collateralBalance}
        />
      )}

      {userPosition && userPosition.canRedeem && (
        <RedeemPositionForm
          market={market}
          position={userPosition}
          onSuccess={handleRedeemSuccess}
        />
      )}

      <MarketDetails
        market={market}
        userPosition={userPosition || undefined}
        onBuy={handleBuyClick}
        collateralBalance={collateralBalance}
      />
    </div>
  );
}
