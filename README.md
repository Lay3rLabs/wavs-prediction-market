# [WAVS](https://docs.wavs.xyz) Prediction Market Template

**Template for getting started with prediction markets and WAVS. NOT PRODUCTION READY.**

A demo where a prediction market is resolved by an AVS oracle.

## System Requirements

<details>
<summary>Core (Docker, Compose, Make, JQ, Node v21+)</summary>

### Docker

- **MacOS**: `brew install --cask docker`
- **Linux**: `sudo apt -y install docker.io`
- **Windows WSL**: [docker desktop wsl](https://docs.docker.com/desktop/wsl/#turn-on-docker-desktop-wsl-2) & `sudo chmod 666 /var/run/docker.sock`
- [Docker Documentation](https://docs.docker.com/get-started/get-docker/)

### Docker Compose

- **MacOS**: Already installed with Docker installer
- **Linux + Windows WSL**: `sudo apt-get install docker-compose-v2`
- [Compose Documentation](https://docs.docker.com/compose/)

### Make

- **MacOS**: `brew install make`
- **Linux + Windows WSL**: `sudo apt -y install make`
- [Make Documentation](https://www.gnu.org/software/make/manual/make.html)

### JQ

- **MacOS**: `brew install jq`
- **Linux + Windows WSL**: `sudo apt -y install jq`
- [JQ Documentation](https://jqlang.org/download/)

### Node.js

- **Required Version**: v21+
- [Installation via NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
</details>

<details>

<summary>Rust v1.84+</summary>

### Rust Installation

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

rustup toolchain install stable
rustup target add wasm32-wasip2
```

### Upgrade Rust

```bash
# Remove old targets if present
rustup target remove wasm32-wasi || true
rustup target remove wasm32-wasip1 || true

# Update and add required target
rustup update stable
rustup target add wasm32-wasip2
```

</details>

<details>
<summary>Cargo Components</summary>

### Install Cargo Components

```bash
# Install required cargo components
# https://github.com/bytecodealliance/cargo-component#installation
cargo install cargo-binstall
cargo binstall cargo-component warg-cli wkg --locked --no-confirm --force

# Configure default registry
wkg config --default-registry wa.dev
```

</details>

## Create Project

```bash
# If you don't have foundry: `curl -L https://foundry.paradigm.xyz | bash && $HOME/.foundry/bin/foundryup`
forge init --template Lay3rLabs/wavs-foundry-template my-wavs --branch 0.3
```

> [!TIP]
> Run `make help` to see all available commands and environment variable overrides.

### Solidity

Install the required packages to build the Solidity contracts. This project supports both [submodules](./.gitmodules) and [npm packages](./package.json).

```bash
# Install packages (npm & submodules)
make setup

# Build the contracts
forge build

# Run the solidity tests
forge test
```

### Build WASI components

Now build the WASI rust components into the `compiled` output directory.

> [!WARNING]
> If you get: `error: no registry configured for namespace "wavs"`
>
> run, `wkg config --default-registry wa.dev`

> [!WARNING]
> If you get: `failed to find the 'wasm32-wasip1' target and 'rustup' is not available`
>
> `brew uninstall rust` & install it from <https://rustup.rs>

```bash
make wasi-build # or `make build` to include solidity compilation.
```

### Execute WASI component directly

Test run the component locally to validate the business logic works. An ID of 1 is Bitcoin. Nothing will be saved on-chain, just the output of the component is shown. This input is formatted using `cast format-bytes32-string` in the makefile command.

```bash
COIN_MARKET_CAP_ID=1 make wasi-exec
```

## WAVS

> [!NOTE]
> If you are running on a Mac with an ARM chip, you will need to do the following:
>
> - Set up Rosetta: `softwareupdate --install-rosetta`
> - Enable Rosetta (Docker Desktop: Settings -> General -> enable "Use Rosetta for x86_64/amd64 emulation on Apple Silicon")
>
> Configure one of the following networking:
>
> - Docker Desktop: Settings -> Resources -> Network -> 'Enable Host Networking'
> - `brew install chipmk/tap/docker-mac-net-connect && sudo brew services start chipmk/tap/docker-mac-net-connect`

### Start Environment

Start an Ethereum node (anvil), the WAVS service, and deploy [eigenlayer](https://www.eigenlayer.xyz/) contracts to the local network.

```bash
cp .env.example .env

# Start the backend
#
# This must remain running in your terminal. Use another terminal to run other commands.
# You can stop the services with `ctrl+c`. Some MacOS terminals require pressing it twice.
make start-all
```

### Deploy prediction market contracts

```bash
forge script script/PredictionMarket.s.sol:DeployPredictionMarket --rpc-url http://localhost:8545 --broadcast

# Load the created addresses into the environment
export PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS=$(cat broadcast/PredictionMarket.s.sol/31337/run-latest.json | jq -r '.transactions[] | select(.transactionType=="CREATE" and .contractName=="PredictionMarketOracleController") | .contractAddress')
export PREDICTION_MARKET_FACTORY_ADDRESS=$(cat broadcast/PredictionMarket.s.sol/31337/run-latest.json | jq -r '.transactions[] | select(.transactionType=="CREATE" and .contractName=="PredictionMarketOracleController") | .additionalContracts[0].address')
export COLLATERAL_TOKEN_ADDRESS=$(cat broadcast/PredictionMarket.s.sol/31337/run-latest.json | jq -r '.transactions[] | select(.transactionType=="CREATE" and .contractName=="ERC20Mintable") | .contractAddress')
export CONDITIONAL_TOKENS_ADDRESS=$(cat broadcast/PredictionMarket.s.sol/31337/run-latest.json | jq -r '.transactions[] | select(.transactionType=="CALL" and .contractName=="PredictionMarketFactory" and .function=="createConditionalTokenAndLMSRMarketMaker(string,bytes32,address,uint64,uint256)") | .additionalContracts[0].address')
export MARKET_MAKER_ADDRESS=$(cat broadcast/PredictionMarket.s.sol/31337/run-latest.json | jq -r '.transactions[] | select(.transactionType=="CALL" and .contractName=="PredictionMarketFactory" and .function=="createConditionalTokenAndLMSRMarketMaker(string,bytes32,address,uint64,uint256)") | .additionalContracts[1].address')
```

### Deploy service component

```bash
COMPONENT_FILENAME=prediction_market_oracle.wasm SERVICE_TRIGGER_ADDR=$PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS SERVICE_SUBMISSION_ADDR=$PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS make deploy-service
```

### Buy YES in the prediction market

```bash
forge script script/PredictionMarket.s.sol:BuyYesPredictionMarket --rpc-url http://localhost:8545 --broadcast
```

> Notice in the logs that you start with 1e18 collateral tokens, and then purchase 1e18 YES shares for 525090975565627651 (~5.25e17) collateral tokens, leaving 474909024434372349 (~4.75e17) collateral tokens remaining.

### Trigger the prediction market oracle AVS to resolve the market

```bash
forge script script/PredictionMarket.s.sol:TriggerOracleResolvePredictionMarket --sig "run()" --rpc-url http://localhost:8545 --broadcast
```

### Redeem YES in the resolved prediction market

```bash
forge script script/PredictionMarket.s.sol:RedeemPredictionMarket --rpc-url http://localhost:8545 --broadcast
```

> Notice in the logs that you redeem 1e18 outcome (YES) shares for 1e18 collateral tokens, ending up with 1474909024434372349 (~1.47e18) collateral tokens. This is more than you started with since you earned a profit from the market by betting on the correct outcome.
