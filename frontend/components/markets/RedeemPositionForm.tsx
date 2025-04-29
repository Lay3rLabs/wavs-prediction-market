import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { useWalletClient } from 'wagmi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Market, MarketPosition } from '@/types';
import { getConditionalTokensContract } from '@/utils/contracts';
import { formatBigNumber } from '@/utils/helpers';
import { CONDITIONAL_TOKENS_ADDRESS, FACTORY_ADDRESS } from '@/utils/env';

interface RedeemPositionFormProps {
  market: Market;
  position: MarketPosition;
  onSuccess?: () => void;
}

const RedeemPositionForm: React.FC<RedeemPositionFormProps> = ({ 
  market, 
  position,
  onSuccess
}) => {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expectedPayout, setExpectedPayout] = useState<string | null>(null);
  
  // Calculate expected payout when component mounts
  useEffect(() => {
    const calculateExpectedPayout = async () => {
      if (!isConnected || !walletClient || !market.isResolved) {
        return;
      }

      try {
        // Convert walletClient to ethers provider
        const { chain, transport } = walletClient;
        const network = {
          chainId: chain.id,
          name: chain.name,
          ensAddress: chain.contracts?.ensRegistry?.address,
        };
        const provider = new ethers.providers.Web3Provider(transport, network);
        
        // Get conditional tokens contract
        const conditionalTokensContract = getConditionalTokensContract(CONDITIONAL_TOKENS_ADDRESS, provider);
        
        // Get condition ID
        const conditionId = await conditionalTokensContract.getConditionId(
          FACTORY_ADDRESS,
          '0x0000000000000000000000000000000000000000000000000000000000000000', // questionId
          2 // outcomeSlotCount
        );

        // Get payout denominator
        const payoutDenominator = await conditionalTokensContract.payoutDenominator(conditionId);
        
        // Get outcome slot count
        const outcomeSlotCount = await conditionalTokensContract.getOutcomeSlotCount(conditionId);
        
        // Get payout numerators for all outcomes
        const payouts = [];
        for (let i = 0; i < outcomeSlotCount.toNumber(); i++) {
          const payout = await conditionalTokensContract.payoutNumerators(conditionId, i);
          payouts.push(payout);
        }

        // Calculate expected payout based on position
        let payoutNumerator;
        if (position.outcome === 'YES') {
          // YES corresponds to index 1
          payoutNumerator = payouts[1];
        } else {
          // NO corresponds to index 0
          payoutNumerator = payouts[0];
        }

        // Calculate payout amount using the formula: (token_amount * payout_numerator) / payout_denominator
        const payoutAmount = position.amount.mul(payoutNumerator).div(payoutDenominator);
        
        setExpectedPayout(formatBigNumber(payoutAmount));
      } catch (err) {
        console.error('Error calculating expected payout:', err);
      }
    };

    calculateExpectedPayout();
  }, [isConnected, walletClient, market, position]);
  
  const handleRedeem = async () => {
    if (!isConnected || !walletClient) {
      setError('Please connect your wallet');
      return;
    }
    
    if (!market.isResolved) {
      setError('Market must be resolved before redeeming');
      return;
    }
    
    setError(null);
    setSuccessMessage(null);
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
      
      const conditionalTokensContract = getConditionalTokensContract(market.conditionalTokensAddress, signer);
      
      // In Redeem.s.sol, the factoryAddress is used as the oracle, not the market maker address
      
      if (!FACTORY_ADDRESS) {
        throw new Error("Factory address not found in environment variables");
      }
      
      // Get condition ID using the factory as the oracle (matches the scripts)
      const conditionId = await conditionalTokensContract.getConditionId(
        FACTORY_ADDRESS,
        '0x0000000000000000000000000000000000000000000000000000000000000000', // questionId
        2 // outcomeSlotCount
      );
      
      // Create index sets for redemption
      // Index set 1 = binary 01 = decimal 1 (represents NO)
      // Index set 2 = binary 10 = decimal 2 (represents YES)
      const indexSets = [position.outcome === 'YES' ? 2 : 1];
      
      // Redeem position
      const redeemTx = await conditionalTokensContract.redeemPositions(
        market.collateralTokenAddress,
        '0x0000000000000000000000000000000000000000000000000000000000000000', // parentCollectionId
        conditionId,
        indexSets
      );
      
      await redeemTx.wait();
      
      setSuccessMessage(`Successfully redeemed ${formatBigNumber(position.amount)} ${position.outcome} tokens!`);
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error redeeming position:', err);
      setError(err.message || 'Failed to redeem position');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6">Redeem Your Position</h2>
      
      <div className="mb-6 p-4 bg-neutral-900 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-gray-400 text-sm">Your Position</div>
            <div className="text-xl font-semibold">
              {formatBigNumber(position.amount)} {position.outcome} Tokens
            </div>
          </div>
          
          <div className={`text-lg font-bold ${market.result === (position.outcome === 'YES') ? 'text-green-500' : 'text-red-500'}`}>
            {market.result === (position.outcome === 'YES') ? 'WINNING' : 'LOSING'}
          </div>
        </div>
        
        {expectedPayout !== null && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="text-gray-400 text-sm">Expected Redemption Amount</div>
            <div className="text-xl font-semibold text-green-500">
              {expectedPayout} Collateral Tokens
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-500">
          {successMessage}
        </div>
      )}
      
      <div className="mt-6">
        <Button
          onClick={handleRedeem}
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          disabled={!isConnected || !market.isResolved || !position.canRedeem}
        >
          {expectedPayout 
            ? `Redeem for ${expectedPayout} Tokens` 
            : 'Redeem Position'}
        </Button>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p>
          When you redeem your position, you'll receive collateral tokens based on the market outcome.
          {market.result === (position.outcome === 'YES') 
            ? ' Since you bet on the correct outcome, you can redeem your tokens for collateral.' 
            : ' Since you bet on the incorrect outcome, your tokens are now worthless.'}
        </p>
      </div>
    </Card>
  );
};

export default RedeemPositionForm;