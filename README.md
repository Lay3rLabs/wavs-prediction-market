# [WAVS](https://docs.wavs.xyz) Prediction Market Demo

This project implements a prediction market that is resolved by an AVS oracle.
There is a frontend to interact with the demo.

## System Requirements

<details>
<summary>Core (Docker, Compose, Make, JQ, NodeJS v21+)</summary>

### Docker

- **MacOS**: `brew install --cask docker`
- **Ubuntu**: `sudo apt -y install docker.io`
- [Docker Documentation](https://docs.docker.com/get-started/get-docker/)

### Docker Compose

- **MacOS**: Already installed with Docker installer
- **Linux**: `sudo apt-get install docker-compose-v2`
- [Compose Documentation](https://docs.docker.com/compose/)

### Make

- **MacOS**: `brew install make`
- **Linux**: `sudo apt -y install make`
- [Make Documentation](https://www.gnu.org/software/make/manual/make.html)

### JQ

- **MacOS**: `brew install jq`
- **Ubuntu**: `sudo apt -y install jq`
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

## Install Cargo Components

```bash
# Install required cargo components
# https://github.com/bytecodealliance/cargo-component#installation
cargo install cargo-binstall
cargo binstall cargo-component warg-cli wkg --locked --no-confirm --force

# Configure default registry
wkg config --default-registry wa.dev
```

</details>

## Installation and Setup

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

Start an ethereum node (anvil), the WAVS service, and deploy
[eigenlayer](https://www.eigenlayer.xyz/) contracts to the local network.

```bash
cp .env.example .env

# Start the backend
#
# This must remain running in your terminal. Use another terminal to run other commands.
# You can stop the services with `ctrl+c`. Some MacOS terminals require pressing it twice.
make start-all
```

### Run the demo

```bash
# Deploy contracts
make deploy-contracts

# Deploy the oracle service component
make deploy-service

# Buy YES in the prediction market
make buy-yes
# Notice in the logs that you start with 1e18 collateral tokens, and then purchase 1e18 YES shares for 525090975565627651 (~5.25e17) collateral tokens, leaving 474909024434372349 (~4.75e17) collateral tokens remaining.

# Trigger the oracle to resolve the market
make trigger-service

# Wait for the component to execute
echo "waiting 3 seconds for the component to execute..."
sleep 3

# Redeem YES in the resolved prediction market
make redeem
```

> Notice in the logs that you redeem 1e18 outcome (YES) shares for 1e18 collateral tokens, ending up with 1474909024434372349 (~1.47e18) collateral tokens. This is more than you started with since you earned a profit from the market by betting on the correct outcome.

## Frontend

A frontend application is included for interacting with the prediction market system.

### Features

- Connect your Ethereum wallet
- Submit predictions to existing markets by buying YES/NO outcome tokens
- View market history and probabilities with interactive charts
- Display payout distribution for resolved markets
- Display past markets and their results
- Admin/debug interface to trigger the AVS oracle to resolve markets

### Running the Frontend

The frontend must be started after the backend is running and the contracts are
deployed, since the environment variables are set by the rune2e.sh script and
need to be available to the frontend.

```bash
# In a terminal, start the backend
make start-all

# In another terminal, deploy the necessary contracts/service and do a test run.
make deploy-contracts
make buy-yes
make deploy-service
make trigger-service
sleep 3
make redeem

# Then install frontend dependencies
cd frontend
npm install

# Load environment variables
npm run load-env

# And start the server
npm run dev

# Frontend will be available at http://localhost:3000
```

To test the prediction market, follow these steps:

<!-- TODO: change to steps -->

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the top-right corner
2. Select your wallet provider (Metamask, WalletConnect, etc.)
3. Follow the prompts to connect your wallet

### Creating a Prediction Market

1. Click "Create Market" in the navigation
2. Enter your market question (must be a yes/no question)
3. Set the initial funding amount and fee percentage
4. Submit the transaction through your wallet

### Trading in a Market

1. Browse and select a market from the homepage
2. Click "Buy Prediction Tokens"
3. Choose YES or NO outcome
4. Enter the amount of tokens you want to buy
5. Confirm the transaction in your wallet

### Admin Functions

1. Navigate to the Admin page
2. Select an unresolved market from the list
3. Click "Trigger Oracle Resolution"
4. Confirm the transaction (0.1 ETH required)
