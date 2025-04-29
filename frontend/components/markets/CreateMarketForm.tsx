import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, usePublicClient } from 'wagmi';
import { useWalletClient } from 'wagmi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { CreateMarketFormData } from '@/types';
import { getPredictionMarketFactoryContract, getERC20Contract } from '@/utils/contracts';
import { parseBigNumber, generateQuestionId } from '@/utils/helpers';
import { COLLATERAL_TOKEN_ADDRESS } from '@/utils/env';

interface CreateMarketFormProps {
  onSuccess?: (marketId: string) => void;
}

const CreateMarketForm: React.FC<CreateMarketFormProps> = ({ onSuccess }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [formData, setFormData] = useState<CreateMarketFormData>({
    question: '',
    funding: '',
    fee: '0.05', // 5% fee default
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
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

      const factoryContract = getPredictionMarketFactoryContract(signer);
      const collateralTokenContract = getERC20Contract(COLLATERAL_TOKEN_ADDRESS, signer);
      
      // Convert values to appropriate format
      const questionId = generateQuestionId();
      const funding = parseBigNumber(formData.funding);
      const fee = parseBigNumber(formData.fee, 16); // Convert percentage to uint64
      
      // Mint tokens for user to fund market
      const mintTx = await collateralTokenContract.mint(address, funding);
      await mintTx.wait();
      
      // Approve factory to spend tokens
      const approveTx = await collateralTokenContract.approve(factoryContract.address, funding);
      await approveTx.wait();
      
      // Create market
      const createTx = await factoryContract.createConditionalTokenAndLMSRMarketMaker(
        "https://example.com", // URI
        questionId,
        collateralTokenContract.address,
        fee,
        funding
      );
      
      const receipt = await createTx.wait();
      
      // Get market creation event from logs
      const event = receipt.events?.find(e => e.event === 'LMSRMarketMakerCreation');
      
      if (event && event.args) {
        const marketId = event.args.lmsrMarketMaker;
        if (onSuccess) onSuccess(marketId);
      }
      
      // Reset form
      setFormData({
        question: '',
        funding: '',
        fee: '0.05',
      });
    } catch (err: any) {
      console.error('Error creating market:', err);
      setError(err.message || 'Failed to create market');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-6">Create Prediction Market</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          id="question"
          name="question"
          label="Market Question"
          placeholder="E.g. Will Bitcoin price exceed $100,000 by end of 2023?"
          value={formData.question}
          onChange={handleChange}
          required
        />
        
        <Input
          id="funding"
          name="funding"
          label="Initial Funding (in tokens)"
          type="number"
          min="1"
          step="1"
          placeholder="E.g. 1000"
          value={formData.funding}
          onChange={handleChange}
          required
        />
        
        <Input
          id="fee"
          name="fee"
          label="Market Fee (%)"
          type="number"
          min="0"
          max="20"
          step="0.1"
          placeholder="E.g. 5.0"
          value={formData.fee}
          onChange={handleChange}
          required
        />
        
        <div className="mt-6">
          <Button 
            type="submit" 
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!isConnected}
          >
            Create Market
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateMarketForm;