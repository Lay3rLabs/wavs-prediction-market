import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { useWalletClient } from 'wagmi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Market } from '@/types';
import { getPredictionMarketOracleControllerContract } from '@/utils/contracts';

interface TriggerOracleFormProps {
  market: Market;
  onSuccess?: () => void;
}

const TriggerOracleForm: React.FC<TriggerOracleFormProps> = ({ market, onSuccess }) => {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerId, setTriggerId] = useState<string | null>(null);
  
  const handleTriggerOracle = async () => {
    if (!isConnected || !walletClient) {
      setError('Please connect your wallet');
      return;
    }
    
    setError(null);
    setTriggerId(null);
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
      
      const oracleControllerContract = getPredictionMarketOracleControllerContract(signer);

      // Add trigger (sends 0.1 ETH)
      const triggerTx = await oracleControllerContract.addTrigger(
        { value: ethers.utils.parseEther('0.1') }
      );
      
      const receipt = await triggerTx.wait();
      
      // Try to extract trigger ID from events
      const event = receipt.events?.find((e: ethers.Event) => e.event === 'NewTrigger');
      if (event && event.args) {
        setTriggerId(`Trigger ID: ${event.args.triggerId.toString()}`);
      } else {
        setTriggerId('Oracle trigger submitted successfully!');
      }
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error triggering oracle:', err);
      setError(err.message || 'Failed to trigger oracle');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6">Trigger Oracle Resolution</h2>
      
      <p className="mb-6 text-gray-300">
        This is an admin function that triggers the AVS oracle to resolve the market.
        The oracle will determine the outcome and update the market accordingly.
        This operation requires 0.1 ETH to cover the oracle service fees.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      {triggerId && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-500">
          {triggerId}
        </div>
      )}
      
      <div className="mt-6">
        <Button
          onClick={handleTriggerOracle}
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          disabled={!isConnected}
        >
          Trigger Oracle Resolution (0.1 ETH)
        </Button>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p>
          Note: In a production environment, market resolution would typically be automated or
          controlled by a trusted entity. This interface is for demonstration purposes.
        </p>
      </div>
    </Card>
  );
};

export default TriggerOracleForm;