#!/usr/bin/make -f

# Check if user is in docker group to determine if sudo is needed
SUDO := $(shell if groups | grep -q docker; then echo ''; else echo 'sudo'; fi)

# Default target is build
default: build

# Customize these variables
COMPONENT_FILENAME ?= prediction_market_oracle.wasm
TRIGGER_EVENT ?= "NewTrigger(bytes)"
SERVICE_CONFIG ?= '{"fuel_limit":100000000,"max_gas":5000000,"host_envs":[],"kv":[],"workflow_id":"default","component_id":"default"}'

# Define common variables
CARGO=cargo
WAVS_CMD ?= $(SUDO) docker run --rm --network host $$(test -f .env && echo "--env-file ./.env") -v $$(pwd):/data ghcr.io/lay3rlabs/wavs:0.3.0 wavs-cli
ANVIL_PRIVATE_KEY?=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL?=http://localhost:8545
SERVICE_MANAGER_ADDR?=`jq -r '.eigen_service_managers.local | .[-1]' .docker/deployments.json`
PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS?=`jq -r '.oracle_controller' "./.docker/script_deploy.json"`
PREDICTION_MARKET_FACTORY_ADDRESS?=`jq -r '.factory' "./.docker/script_deploy.json"`
COLLATERAL_TOKEN_ADDRESS?=`jq -r '.collateral_token' "./.docker/script_deploy.json"`
CONDITIONAL_TOKENS_ADDRESS?=`jq -r '.conditional_tokens' "./.docker/script_deploy.json"`
MARKET_MAKER_ADDRESS?=`jq -r '.market_maker' "./.docker/script_deploy.json"`
COIN_MARKET_CAP_ID?=1

## build: building the project
build: _build_forge wasi-build

## wasi-build: building the WAVS wasi component(s)
wasi-build:
	@for component in $(shell ls ./components); do \
		echo "Building component: $$component"; \
		(cd components/$$component; cargo component build --release); \
	done
	@mkdir -p ./compiled
	@cp ./target/wasm32-wasip1/release/*.wasm ./compiled/

## wasi-exec: executing the WAVS wasi component(s) | COMPONENT_FILENAME, COIN_MARKET_CAP_ID
wasi-exec:
	@$(WAVS_CMD) exec --log-level=info --data /data/.docker --home /data \
	--component "/data/compiled/${COMPONENT_FILENAME}" \
	--input `cast format-bytes32-string $(COIN_MARKET_CAP_ID)`

## update-submodules: update the git submodules
update-submodules:
	@git submodule update --init --recursive

## clean: cleaning the project files
clean: clean-docker
	@forge clean
	@$(CARGO) clean
	@rm -rf cache
	@rm -rf out
	@rm -rf broadcast

## clean-docker: remove unused docker containers
clean-docker:
	@$(SUDO) docker rm -v $(shell $(SUDO) docker ps --filter status=exited -q) || true

## fmt: formatting solidity and rust code
fmt:
	@forge fmt --check
	@$(CARGO) fmt

## test: running tests
test:
	@forge test

## setup: install initial dependencies
setup:
	@forge install
	@npm install

## start-all: starting anvil and WAVS with docker compose
# running anvil out of compose is a temp work around for MacOS
start-all: clean-docker setup-env
	@rm --interactive=never .docker/*.json || true
	@bash -ec 'anvil --disable-code-size-limit & anvil_pid=$$!; trap "kill -9 $$anvil_pid 2>/dev/null" EXIT; $(SUDO) docker compose up; wait'

## deploy-contracts: deploying the contracts | SERVICE_MANAGER_ADDR, RPC_URL
deploy-contracts:
# `sudo chmod 0666 .docker/deployments.json`
	@forge script ./script/Deploy.s.sol ${SERVICE_MANAGER_ADDR} --sig "run(string)" --rpc-url $(RPC_URL) --broadcast

## get-oracle-controller-from-deploy: getting the oracle controller address from the script deploy
get-oracle-controller-from-deploy:
	@jq -r '.oracle' "./.docker/script_deploy.json"

## wavs-cli: running wavs-cli in docker
wavs-cli:
	@$(WAVS_CMD) $(filter-out $@,$(MAKECMDGOALS))

## deploy-service: deploying the WAVS component service | COMPONENT_FILENAME, TRIGGER_EVENT, PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS, SERVICE_CONFIG
deploy-service:
	@$(WAVS_CMD) deploy-service --log-level=info --data /data/.docker --home /data \
	--component "/data/compiled/${COMPONENT_FILENAME}" \
	--trigger-event-name ${TRIGGER_EVENT} \
	--trigger-address "${PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS}" \
	--submit-address "${PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS}" \
	--service-config ${SERVICE_CONFIG}

## buy-yes: buying YES in the prediction market | PREDICTION_MARKET_FACTORY_ADDRESS, MARKET_MAKER_ADDRESS, CONDITIONAL_TOKENS_ADDRESS, COLLATERAL_TOKEN_ADDRESS, RPC_URL
buy-yes:
	@forge script ./script/BuyYes.s.sol ${PREDICTION_MARKET_FACTORY_ADDRESS} ${MARKET_MAKER_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} ${COLLATERAL_TOKEN_ADDRESS} --sig "run(string,string,string,string)" --rpc-url $(RPC_URL) --broadcast

## trigger-service: triggering the service | PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS, MARKET_MAKER_ADDRESS, CONDITIONAL_TOKENS_ADDRESS, RPC_URL
trigger-service:
	@forge script ./script/Trigger.s.sol ${PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS} ${MARKET_MAKER_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} --sig "run(string,string,string)" --rpc-url $(RPC_URL) --broadcast

## redeem: redeeming the YES in the resolved prediction market | PREDICTION_MARKET_FACTORY_ADDRESS, COLLATERAL_TOKEN_ADDRESS, CONDITIONAL_TOKENS_ADDRESS, RPC_URL
redeem:
	@forge script ./script/Redeem.s.sol ${PREDICTION_MARKET_FACTORY_ADDRESS} ${COLLATERAL_TOKEN_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} --sig "run(string,string,string)" --rpc-url $(RPC_URL) --broadcast

_build_forge:
	@forge build

# Declare phony targets
.PHONY: build clean fmt bindings test

.PHONY: help
help: Makefile
	@echo
	@echo " Choose a command run"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo

# helpers

.PHONY: setup-env
setup-env:
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			echo "Creating .env file from .env.example..."; \
			cp .env.example .env; \
			echo ".env file created successfully!"; \
		fi; \
	fi
