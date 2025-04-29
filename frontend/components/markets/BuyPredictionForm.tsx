import React, { useState, useEffect } from 'react';
import { ethers, BigNumber } from 'ethers';
import { useAccount } from 'wagmi';
import { useWalletClient } from 'wagmi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MarketBuyFormData, Market } from '@/types';
import { 
  getLMSRMarketMakerContract,
  getConditionalTokensContract,
  getERC20Contract
} from '@/utils/contracts';
import { formatBigNumber, parseBigNumber, calculatePriceFromMarginalPrice } from '@/utils/helpers';

interface BuyPredictionFormProps {
  market: Market;
  onSuccess?: () => void;
  collateralBalance?: ethers.BigNumber | null;
}

const BuyPredictionForm: React.FC<BuyPredictionFormProps> = ({ 
  market, 
  onSuccess,
  collateralBalance 
}) => {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [formData, setFormData] = useState<MarketBuyFormData>({
    outcome: 'YES',
    amount: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<string | null>(null);
  const [hasEnoughCollateral, setHasEnoughCollateral] = useState(true);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Calculate estimated cost when inputs change
  useEffect(() => {
    const calculateCost = async () => {
      if (!walletClient || !formData.amount || isNaN(Number(formData.amount))) {
        setCostEstimate(null);
        setHasEnoughCollateral(true);
        return;
      }
      
      try {
        // Convert walletClient to ethers signer
        const { account, chain, transport } = walletClient;
        const network = {
          chainId: chain.id,
          name: chain.name,
          ensAddress: chain.contracts?.ensRegistry?.address,
        };
        const provider = new ethers.providers.Web3Provider(transport, network);
        const signer = provider.getSigner(account.address);
        
        const marketMakerContract = getLMSRMarketMakerContract(market.marketMakerAddress, signer);
        
        // Create outcomeTokenAmounts array [index 0 = NO, index 1 = YES]
        const amount = parseBigNumber(formData.amount);
        const outcomeTokenAmounts = [BigNumber.from(0), BigNumber.from(0)];
        
        // Set the appropriate index based on YES/NO selection
        if (formData.outcome === 'YES') {
          outcomeTokenAmounts[1] = amount;
        } else {
          outcomeTokenAmounts[0] = amount;
        }
        
        // Calculate cost
        const netCost = await marketMakerContract.calcNetCost(outcomeTokenAmounts);
        setCostEstimate(formatBigNumber(netCost));
        
        // Check if user has enough collateral
        if (collateralBalance) {
          setHasEnoughCollateral(collateralBalance.gte(netCost));
        }
      } catch (err) {
        console.error('Error calculating cost:', err);
        setCostEstimate(null);
        setHasEnoughCollateral(true);
      }
    };
    
    calculateCost();
  }, [formData, walletClient, market.marketMakerAddress, collateralBalance]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !walletClient) {
      setError('Please connect your wallet');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Convert walletClient to ethers signer
      const { account, chain, transport } = walletClient;
      const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
      };
      const provider = new ethers.providers.Web3Provider(transport, network);
      const signer = provider.getSigner(account.address);
      
      const marketMakerContract = getLMSRMarketMakerContract(market.marketMakerAddress, signer);
      const conditionalTokensContract = getConditionalTokensContract(market.conditionalTokensAddress, signer);
      const collateralTokenContract = getERC20Contract(market.collateralTokenAddress, signer);
      
      // Create outcomeTokenAmounts array [index 0 = NO, index 1 = YES]
      const amount = parseBigNumber(formData.amount);
      const outcomeTokenAmounts = [BigNumber.from(0), BigNumber.from(0)];
      
      // Set the appropriate index based on YES/NO selection
      if (formData.outcome === 'YES') {
        outcomeTokenAmounts[1] = amount;
      } else {
        outcomeTokenAmounts[0] = amount;
      }
      
      // Calculate required collateral
      const netCost = await marketMakerContract.calcNetCost(outcomeTokenAmounts);
      const collateralLimit = netCost.mul(11).div(10); // Add 10% buffer
      
      try {
        // Mint collateral tokens for testing
        const mintTx = await collateralTokenContract.mint(account.address, collateralLimit);
        await mintTx.wait();
        
        // Check that tokens were successfully minted
        const balance = await collateralTokenContract.balanceOf(account.address);
        console.log("Token balance after mint:", ethers.utils.formatEther(balance));
        
        if (balance.lt(collateralLimit)) {
          throw new Error("Not enough tokens were minted. Please try again.");
        }
        
        // Now approve the market maker to spend collateral with explicit gas limit
        console.log("Approving tokens:", ethers.utils.formatEther(collateralLimit));
        const approveTx = await collateralTokenContract.approve(
          marketMakerContract.address, 
          collateralLimit,
          { 
            gasLimit: 100000 // Set explicit gas limit
          }
        );
        await approveTx.wait();
        
        // Verify approval worked
        const allowance = await collateralTokenContract.allowance(
          account.address, 
          marketMakerContract.address
        );
        console.log("Allowance after approval:", ethers.utils.formatEther(allowance));
        
        if (allowance.lt(collateralLimit)) {
          throw new Error("Approval failed. Please try again.");
        }
        
        // Execute trade with explicit gas limit
        const tradeTx = await marketMakerContract.trade(
          outcomeTokenAmounts, 
          collateralLimit,
          { 
            gasLimit: 500000 // Set explicit gas limit
          }
        );
        await tradeTx.wait();
        
        // Reset form
        setFormData({
          outcome: 'YES',
          amount: '',
        });
        
        if (onSuccess) onSuccess();
      } catch (err: any) {
        console.error('Error in transaction:', err);
        setError(err.message || 'Failed to buy prediction tokens');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error buying prediction tokens:', err);
      setError(err.message || 'Failed to buy prediction tokens');
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6">Buy Prediction Tokens</h2>
      
      {collateralBalance && (
        <div className="mb-4 p-3 bg-neutral-900 rounded-lg">
          <div className="text-sm text-gray-400">Your Collateral Balance:</div>
          <div className="text-lg font-semibold">{formatBigNumber(collateralBalance)} Tokens</div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="outcome" className="block text-sm font-medium text-gray-300 mb-1">
            Prediction Outcome
          </label>
          <select
            id="outcome"
            name="outcome"
            value={formData.outcome}
            onChange={handleChange}
            className="crypto-input w-full"
            required
          >
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>
        
        <Input
          id="amount"
          name="amount"
          label="Amount of Outcome Tokens"
          type="number"
          min="0.000001"
          step="0.000001"
          placeholder="E.g. 1.0"
          value={formData.amount}
          onChange={handleChange}
          required
        />
        
        {costEstimate && (
          <div className="mb-6 p-4 bg-neutral-900 rounded-lg">
            <div className={`text-sm text-gray-400 ${!hasEnoughCollateral ? 'text-red-500' : ''}`}>
              Estimated Cost:
            </div>
            <div className={`text-lg font-semibold ${!hasEnoughCollateral ? 'text-red-500' : ''}`}>
              {costEstimate} Collateral Tokens
              {!hasEnoughCollateral && (
                <span className="block text-sm mt-1 text-red-500">
                  Insufficient balance
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              (Actual cost may vary based on market conditions)
            </div>
            
            {!hasEnoughCollateral && (
              <div className="mt-3 p-2 bg-blue-900/30 border border-blue-500 rounded text-blue-400 text-xs">
                <span className="font-bold">Demo Mode:</span> Don't worry! Since this is a demo application, 
                collateral tokens will be automatically minted for you when you make a purchase.
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!isConnected}
          >
            Buy {formData.outcome} Tokens
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          <p>
            By buying prediction tokens, you're getting exposure to the outcome of this market.
            If your prediction is correct, you'll be able to redeem your tokens for collateral when the market resolves.
          </p>
        </div>
      </form>
    </Card>
  );
};

export default BuyPredictionForm;