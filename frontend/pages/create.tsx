import React from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import CreateMarketForm from "@/components/markets/CreateMarketForm";
import Card from "@/components/ui/Card";

export default function CreateMarketPage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const handleSuccess = (marketId: string) => {
    // Redirect to the market page after successful creation
    router.push(`/markets/${marketId}`);
  };

  return (
    <div className="max-w-2xl mx-auto section-spacing">
      <h1 className="text-title-m font-bold mb-xl text-neutral-100 title-glow">
        Create a New Prediction Market
      </h1>

      {!isConnected ? (
        <Card elevation={2}>
          <div className="text-center py-xl">
            <p className="text-body-m mb-l text-neutral-100">
              Please connect your wallet to create a market
            </p>
            <p className="text-body-s text-neutral-500">
              You need to connect an Ethereum wallet to create and fund a new
              prediction market.
            </p>
          </div>
        </Card>
      ) : (
        <CreateMarketForm onSuccess={handleSuccess} />
      )}

      <Card elevation={1}>
        <h2 className="text-body-m font-semibold mb-m text-neutral-100">
          How Prediction Markets Work
        </h2>

        <div className="content-spacing">
          <p className="text-body-s text-neutral-300 leading-relaxed">
            Prediction markets allow participants to buy and sell "shares"
            representing the probability of a future event occurring. The market
            price of these shares reflects the collective estimate of the
            event's likelihood.
          </p>

          <p className="text-body-s text-neutral-300 leading-relaxed">
            When you create a market, you specify a question with a clear yes/no
            outcome, provide initial funding to seed the market liquidity, and
            set a fee for trading.
          </p>

          <p className="text-body-s text-neutral-300 leading-relaxed">
            Once the event occurs, the market is resolved by an oracle that
            determines the true outcome. Shares representing the correct outcome
            can then be redeemed for rewards.
          </p>
        </div>
      </Card>
    </div>
  );
}
