#!/bin/bash

# run ./script/start.sh in another terminal

cd "$(dirname "$0")/.."

# wait for the anvil chain to start
while [ ! -f .docker/start.log ]; do echo "waiting for the chain to start" && sleep 1; done

# wait for the ipfs container to be ready
while ! curl -s http://localhost:8080/ipfs > /dev/null; do
  echo "waiting for ipfs to be ready on port 8080..."
  sleep 1
done

# wait for the wavs service to be ready
while ! curl -s http://localhost:8000 > /dev/null; do
  echo "waiting for wavs to be ready on port 8000..."
  sleep 1
done

# deploy the contracts
make deploy-contracts

# build the service
make build-service

# upload the service to IPFS
IPFS_CID=`make --no-print-directory upload-to-ipfs`

# deploy the service
export DEPLOYER_PK=`cat .nodes/deployer`
export SERVICE_URL="http://127.0.0.1:8080/ipfs/$IPFS_CID"
CREDENTIAL=$DEPLOYER_PK make --no-print-directory deploy-service

# register service operator
source .env
AVS_PRIVATE_KEY=`cast wallet private-key --mnemonic-path "$WAVS_SUBMISSION_MNEMONIC" --mnemonic-index 1`

# Faucet funds to the aggregator account to post on chain
cast send $(cast wallet address --private-key $WAVS_AGGREGATOR_CREDENTIAL) --rpc-url http://localhost:8545 --private-key $DEPLOYER_PK --value 1ether

# Register the operator with the WAVS service manager
AVS_PRIVATE_KEY=${AVS_PRIVATE_KEY} make operator-register

# Verify registration
make operator-list
