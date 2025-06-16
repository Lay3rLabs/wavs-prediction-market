import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useWalletClient } from "wagmi";
import Card from "@/components/ui/Card";
import { Market } from "@/types";
import TriggerOracleForm from "@/components/markets/TriggerOracleForm";
import { ethers, BigNumber } from "ethers";
import {
  MARKET_MAKER_ADDRESS,
  CONDITIONAL_TOKENS_ADDRESS,
  FACTORY_ADDRESS,
} from "@/utils/env";
import {
  getLMSRMarketMakerContract,
  getConditionalTokensContract,
  getERC20Contract,
  LMSRMarketMakerABI,
} from "@/utils/contracts";
import { calculatePriceFromMarginalPrice } from "@/utils/helpers";

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faucetAmount, setFaucetAmount] = useState("10");
  const [faucetStatus, setFaucetStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [faucetError, setFaucetError] = useState("");
  const [currentBalance, setCurrentBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Function to fetch real market data
  const fetchMarkets = useCallback(async () => {
    if (!publicClient) return;

    try {
      setIsLoading(true);

      // Only proceed if we have the market maker address
      if (!MARKET_MAKER_ADDRESS) {
        console.warn("Market Maker address not found in environment variables");
        setIsLoading(false);
        return;
      }

      const provider = new ethers.providers.Web3Provider(
        publicClient.transport as any
      );

      // Create contract instances
      const marketMakerContract = new ethers.Contract(
        MARKET_MAKER_ADDRESS,
        LMSRMarketMakerABI,
        provider
      );

      // Get conditional tokens and collateral token addresses
      const conditionalTokensAddress = await marketMakerContract.pmSystem();
      const collateralTokenAddress =
        await marketMakerContract.collateralToken();

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
      const isResolved = payoutDenominator.gt(0);

      // If market is already resolved, don't show it
      if (isResolved) {
        setMarkets([]);
        setIsLoading(false);
        return;
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
        question: "Will the price of Bitcoin be above $1 for the whole day?", // Could be fetched from somewhere
        createdAt: Math.floor(Date.now() / 1000), // Mock creation date
        isResolved: false,
        marketMakerAddress: MARKET_MAKER_ADDRESS,
        conditionalTokensAddress: conditionalTokensAddress,
        collateralTokenAddress: collateralTokenAddress,
        funding: funding,
        volume: BigNumber.from("500000000000000000000"), // Approximation
        yesPrice: yesPrice,
        noPrice: noPrice,
      };

      setMarkets([market]);

      // Auto-select the market if there's only one
      if (!selectedMarket) {
        setSelectedMarket(market);
      }
    } catch (err) {
      console.error("Error fetching markets:", err);
      setMarkets([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, selectedMarket]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    if (address) {
      fetchCurrentBalance();
    }
  }, [address, publicClient]);

  const handleMarketSelect = (market: Market) => {
    setSelectedMarket(market);
  };

  const handleTriggerSuccess = () => {
    // Refresh markets list to update status
    fetchMarkets();
  };

  const fetchCurrentBalance = async () => {
    if (!address || !publicClient) return;

    try {
      setIsBalanceLoading(true);
      const balance = await publicClient.getBalance({ address });
      setCurrentBalance(
        ethers.utils.formatEther(BigNumber.from(balance.toString()))
      );
    } catch (error) {
      console.error("Error fetching balance:", error);
      setCurrentBalance(null);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const handleFaucetRequest = async () => {
    if (!address) return;

    try {
      setFaucetStatus("loading");
      setFaucetError("");

      // Convert amount to wei (1 ETH = 10^18 wei)
      const amountInWei = ethers.utils.parseEther(faucetAmount).toHexString();

      // Call anvil_setBalance RPC method
      const result = await publicClient.transport.request({
        method: "anvil_setBalance",
        params: [address, amountInWei],
      });

      console.log("Balance set via anvil_setBalance:", result);

      setFaucetStatus("success");

      // Update the balance display after setting new balance
      fetchCurrentBalance();
    } catch (error: any) {
      console.error("Faucet error:", error);
      setFaucetStatus("error");
      setFaucetError(error.message || "Failed to set balance");
    }
  };

  return (
    <div className="section-spacing">
      <div>
        <h1 className="text-title-m font-bold mb-xl text-neutral-100 title-glow">
          Admin Panel
        </h1>
        <p className="text-body-m text-neutral-500 mb-l">
          This page allows you to trigger the oracle to resolve markets. In a
          production system, this would typically be an automated or restricted
          process.
        </p>
      </div>

      {!isConnected ? (
        <Card elevation={2}>
          <div className="text-center py-xl">
            <p className="text-body-m mb-l text-neutral-100">
              Please connect your wallet
            </p>
            <p className="text-body-s text-neutral-500">
              You need to connect an Ethereum wallet to access admin functions.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Faucet Card */}
          <Card elevation={2}>
            <h2 className="text-body-m font-semibold mb-m text-neutral-100">
              Development Faucet
            </h2>
            <p className="text-body-s text-neutral-500 mb-m">
              Set the balance of your connected wallet (only works in
              development with Anvil).
            </p>

            <div className="mb-m p-m bg-neutral-800 border border-neutral-700 rounded-card-2 flex justify-between items-center">
              <div>
                <span className="text-body-s text-neutral-500">
                  Current Balance:
                </span>
                <div className="font-medium text-body-m">
                  {isBalanceLoading ? (
                    <span className="text-neutral-500">Loading...</span>
                  ) : currentBalance !== null ? (
                    <span className="text-neutral-200">
                      {currentBalance} ETH
                    </span>
                  ) : (
                    <span className="text-neutral-500">
                      Unable to fetch balance
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={fetchCurrentBalance}
                disabled={isBalanceLoading}
                className="btn-secondary btn-small disabled:opacity-50"
              >
                {isBalanceLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="flex items-end gap-m">
              <div className="flex-1">
                <label className="block text-body-s font-medium text-neutral-500 mb-xs">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  className="input-field w-full"
                  min="0"
                  step="0.1"
                />
              </div>
              <button
                onClick={handleFaucetRequest}
                disabled={!address || faucetStatus === "loading"}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {faucetStatus === "loading"
                  ? "Setting balance..."
                  : "Set Balance"}
              </button>
            </div>

            {faucetStatus === "success" && (
              <div className="mt-m status-success">
                Balance successfully set to {faucetAmount} ETH for address{" "}
                {address}
              </div>
            )}

            {faucetStatus === "error" && (
              <div className="mt-m status-error">
                {faucetError ||
                  "Failed to set balance. Make sure you are using Anvil."}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="md:col-span-1">
              <Card elevation={2}>
                <h2 className="text-body-m font-semibold mb-m text-neutral-100">
                  Unresolved Markets
                </h2>

                {isLoading ? (
                  <div className="flex justify-center py-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : markets.length === 0 ? (
                  <p className="text-body-s text-neutral-500 py-m">
                    No unresolved markets found.
                  </p>
                ) : (
                  <ul className="space-y-s">
                    {markets.map((market) => (
                      <li key={market.id}>
                        <button
                          onClick={() => handleMarketSelect(market)}
                          className={`w-full text-left p-m rounded-card-2 transition-all duration-250 ease-soft ${
                            selectedMarket?.id === market.id
                              ? "bg-primary-900/30 border border-primary-600"
                              : "hover:bg-neutral-800 border border-transparent"
                          }`}
                        >
                          <p className="font-medium truncate text-neutral-200 text-body-s">
                            {market.question}
                          </p>
                          <p className="text-body-s text-neutral-500 mt-xs truncate">
                            {market.id}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-m">
                  <button
                    onClick={fetchMarkets}
                    className="btn-secondary w-full btn-small"
                  >
                    Refresh Markets
                  </button>
                </div>
              </Card>
            </div>

            <div className="md:col-span-2">
              {selectedMarket ? (
                <TriggerOracleForm
                  market={selectedMarket}
                  onSuccess={handleTriggerSuccess}
                />
              ) : (
                <Card elevation={2}>
                  <div className="text-center py-xl">
                    <p className="text-body-m mb-m text-neutral-100">
                      Select a market to resolve
                    </p>
                    <p className="text-body-s text-neutral-500">
                      Choose an unresolved market from the list on the left.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
