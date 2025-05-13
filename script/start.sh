#!/bin/bash

set -e

cd "$(dirname "$0")/.."

cast wallet new-mnemonic --json > .docker/operator1.json
export OPERATOR_MNEMONIC=`cat .docker/operator1.json | jq -r .mnemonic`
export OPERATOR_PK=`cat .docker/operator1.json | jq -r '.accounts[0].private_key'`

echo "OPERATOR_MNEMONIC: $OPERATOR_MNEMONIC"
echo "OPERATOR_PK: $OPERATOR_PK"

make start-all

# run ./script/deploy.sh in another terminal
