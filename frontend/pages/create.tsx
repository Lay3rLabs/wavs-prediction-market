import React from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import CreateMarketForm from '@/components/markets/CreateMarketForm';
import Card from '@/components/ui/Card';

export default function CreateMarketPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  
  const handleSuccess = (marketId: string) => {
    // Redirect to the market page after successful creation
    router.push(`/markets/${marketId}`);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create a New Prediction Market</h1>
      
      {!isConnected ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-xl mb-6">Please connect your wallet to create a market</p>
            <p className="text-gray-400">You need to connect an Ethereum wallet to create and fund a new prediction market.</p>
          </div>
        </Card>
      ) : (
        <CreateMarketForm onSuccess={handleSuccess} />
      )}
      
      <div className="mt-8 p-6 bg-neutral-850 border border-gray-800 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">How Prediction Markets Work</h2>
        
        <div className="space-y-4">
          <p>
            Prediction markets allow participants to buy and sell "shares" representing
            the probability of a future event occurring. The market price of these shares
            reflects the collective estimate of the event's likelihood.
          </p>
          
          <p>
            When you create a market, you specify a question with a clear yes/no outcome,
            provide initial funding to seed the market liquidity, and set a fee for trading.
          </p>
          
          <p>
            Once the event occurs, the market is resolved by an oracle that determines the
            true outcome. Shares representing the correct outcome can then be redeemed for rewards.
          </p>
        </div>
      </div>
    </div>
  );
}
