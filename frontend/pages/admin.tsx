import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useWalletClient } from 'wagmi';
import Card from '@/components/ui/Card';
import { Market } from '@/types';
import TriggerOracleForm from '@/components/markets/TriggerOracleForm';
import { ethers, BigNumber } from 'ethers';
import { MARKET_MAKER_ADDRESS, CONDITIONAL_TOKENS_ADDRESS, FACTORY_ADDRESS } from '@/utils/env';
import { 
  getLMSRMarketMakerContract, 
  getConditionalTokensContract, 
  getERC20Contract,
  LMSRMarketMakerABI
} from '@/utils/contracts';
import { calculatePriceFromMarginalPrice } from '@/utils/helpers';

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faucetAmount, setFaucetAmount] = useState('10');
  const [faucetStatus, setFaucetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [faucetError, setFaucetError] = useState('');
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
      const collateralTokenAddress = await marketMakerContract.collateralToken();
      
      // Get condition ID (assuming first condition)
      const conditionId = await marketMakerContract.conditionIds(0);
      
      // Create conditional tokens contract
      const conditionalTokensContract = new ethers.Contract(
        conditionalTokensAddress,
        getConditionalTokensContract(conditionalTokensAddress, provider).interface,
        provider
      );
      
      // Check if condition is resolved by querying payoutDenominator
      const payoutDenominator = await conditionalTokensContract.payoutDenominator(conditionId);
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
      setCurrentBalance(ethers.utils.formatEther(BigNumber.from(balance.toString())));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setCurrentBalance(null);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const handleFaucetRequest = async () => {
    if (!address) return;
    
    try {
      setFaucetStatus('loading');
      setFaucetError('');
      
      // Convert amount to wei (1 ETH = 10^18 wei)
      const amountInWei = ethers.utils.parseEther(faucetAmount).toHexString();
      
      // Call anvil_setBalance RPC method
      const result = await publicClient.transport.request({
        method: 'anvil_setBalance',
        params: [address, amountInWei]
      });

      console.log("Balance set via anvil_setBalance:", result);
      
      setFaucetStatus('success');
      
      // Update the balance display after setting new balance
      fetchCurrentBalance();
    } catch (error: any) {
      console.error('Faucet error:', error);
      setFaucetStatus('error');
      setFaucetError(error.message || 'Failed to set balance');
    }
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        <p className="text-gray-400 mb-6">
          This page allows you to trigger the oracle to resolve markets.
          In a production system, this would typically be an automated or restricted process.
        </p>
      </div>
      
      {!isConnected ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-xl mb-6">Please connect your wallet</p>
            <p className="text-gray-400">You need to connect an Ethereum wallet to access admin functions.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Faucet Card */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Development Faucet</h2>
            <p className="text-gray-400 mb-4">
              Set the balance of your connected wallet (only works in development with Anvil).
            </p>
            
            <div className="mb-4 p-3 bg-neutral-800 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-400">Current Balance:</span>
                <div className="font-medium text-lg">
                  {isBalanceLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : currentBalance !== null ? (
                    <span>{currentBalance} ETH</span>
                  ) : (
                    <span className="text-gray-400">Unable to fetch balance</span>
                  )}
                </div>
              </div>
              <button 
                onClick={fetchCurrentBalance}
                disabled={isBalanceLoading}
                className="px-3 py-1 text-sm rounded-lg bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50"
              >
                {isBalanceLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2"
                  min="0"
                  step="0.1"
                />
              </div>
              <button
                onClick={handleFaucetRequest}
                disabled={!address || faucetStatus === 'loading'}
                className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {faucetStatus === 'loading' ? 'Setting balance...' : 'Set Balance'}
              </button>
            </div>
            
            {faucetStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
                Balance successfully set to {faucetAmount} ETH for address {address}
              </div>
            )}
            
            {faucetStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg">
                {faucetError || 'Failed to set balance. Make sure you are using Anvil.'}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Card>
                <h2 className="text-xl font-semibold mb-4">Unresolved Markets</h2>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : markets.length === 0 ? (
                  <p className="text-gray-400 py-4">No unresolved markets found.</p>
                ) : (
                  <ul className="space-y-2">
                    {markets.map(market => (
                      <li key={market.id}>
                        <button
                          onClick={() => handleMarketSelect(market)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${selectedMarket?.id === market.id
                            ? 'bg-primary-900/30 border border-primary-500'
                            : 'hover:bg-neutral-900'}`}
                        >
                          <p className="font-medium truncate">{market.question}</p>
                          <p className="text-xs text-gray-400 mt-1 truncate">{market.id}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="mt-4">
                  <button 
                    onClick={fetchMarkets}
                    className="w-full px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg"
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
                <Card>
                  <div className="text-center py-12">
                    <p className="text-xl mb-4">Select a market to resolve</p>
                    <p className="text-gray-400">Choose an unresolved market from the list on the left.</p>
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
