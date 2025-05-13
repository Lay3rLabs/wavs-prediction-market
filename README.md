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

### Configure environment

```bash
# Install packages (npm & submodules)
make setup

# Run the solidity tests
make test

# copy the example env file
cp .env.example .env
```

### Build Solidity contracts and WASI components

Now build the Solidity contracts and WASI rust components into the `compiled` output directory.

> [!WARNING]
> If you get: `error: no registry configured for namespace "wavs"`
>
> run, `wkg config --default-registry wa.dev`

> [!WARNING]
> If you get: `failed to find the 'wasm32-wasip1' target and 'rustup' is not available`
>
> `brew uninstall rust` & install it from <https://rustup.rs>

```bash
make build
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

### Start WAVS and Anvil

Start an ethereum node (anvil) and the WAVS service.

```bash
make start
```

### Deploy contracts and service

In another terminal, deploy the contracts and service to the chain and WAVS.

```bash
make deploy
```

### Buy YES outcome tokens

Buy YES outcome tokens in the prediction market governed by the oracle AVS,
which is going to resolve whether or not the price of Bitcoin is over $1.

```bash
make buy-yes
```

> Notice in the logs that you start with 1e18 collateral tokens, and then purchase 1e18 YES shares for 525090975565627651 (~5.25e17) collateral tokens, leaving 474909024434372349 (~4.75e17) collateral tokens remaining.

### Trigger the oracle AVS

Run the AVS service to resolve the market.

```bash
make resolve-market

# Wait for the component to execute
echo "waiting 3 seconds for the component to execute..."
sleep 3
```

### Redeem the outcome tokens

Redeem the YES outcome tokens for collateral tokens.

```bash
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
make start

# In another terminal, deploy the necessary contracts and service.
make deploy

# Then install frontend dependencies
cd frontend
npm install

# And start the server
npm run dev

# Frontend will be available at http://localhost:3000
```

To test the prediction market, follow these steps:

1. Go to the admin page and use the faucet to get fee tokens
2. Go to the markets page and click the active market
3. Buy YES outcome tokens
4. Go to the admin page and trigger the oracle to resolve the market as YES
5. Back on the market page, redeem your YES outcome tokens for collateral tokens now that the market has been resolved

## Claude Code

To spin up a sandboxed instance of [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) in a Docker container that only has access to this project's files, run the following command:

```bash
npm run claude-code
# or with no restrictions (--dangerously-skip-permissions)
npm run claude-code:unrestricted
```

You must have [Docker](https://www.docker.com/) installed.
