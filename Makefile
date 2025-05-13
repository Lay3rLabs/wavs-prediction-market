#!/usr/bin/make -f

# Check if user is in docker group to determine if sudo is needed
SUDO := $(shell if groups | grep -q docker; then echo ''; else echo 'sudo'; fi)

# Default target is build
default: build

# wavs-prediction-market custom
PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS?=`jq -r '.oracle_controller' "./.docker/script_deploy.json"`
PREDICTION_MARKET_FACTORY_ADDRESS?=`jq -r '.factory' "./.docker/script_deploy.json"`
COLLATERAL_TOKEN_ADDRESS?=`jq -r '.collateral_token' "./.docker/script_deploy.json"`
CONDITIONAL_TOKENS_ADDRESS?=`jq -r '.conditional_tokens' "./.docker/script_deploy.json"`
MARKET_MAKER_ADDRESS?=`jq -r '.market_maker' "./.docker/script_deploy.json"`

# Define common variables
AGGREGATOR_URL?=http://127.0.0.1:8001
ANVIL_PRIVATE_KEY?=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CARGO=cargo
COMPONENT_FILENAME?=prediction_market_oracle.wasm
CREDENTIAL?=""
DOCKER_IMAGE?=ghcr.io/lay3rlabs/wavs:0.4.0-beta.2
MIDDLEWARE_DOCKER_IMAGE?=ghcr.io/lay3rlabs/wavs-middleware:0.4.0-beta.2
IPFS_ENDPOINT?=http://127.0.0.1:5001
RPC_URL?=http://127.0.0.1:8545
SERVICE_FILE?=.docker/service.json
SERVICE_MANAGER_ADDR?=`jq -r .addresses.WavsServiceManager .nodes/avs_deploy.json`
WASI_BUILD_DIR ?= ""
WAVS_CMD ?= $(SUDO) docker run --rm --network host $$(test -f .env && echo "--env-file ./.env") -v $$(pwd):/data ${DOCKER_IMAGE} wavs-cli
WAVS_ENDPOINT?="http://127.0.0.1:8000"
ENV_FILE?=.env

# Default target is build
default: build

## build: building the project
build: _build_forge wasi-build

## wasi-build: building the WAVS wasi component(s)
wasi-build:
	@./script/build_components.sh $(WASI_BUILD_DIR)

## clean: cleaning the project files
clean: clean-docker
	@forge clean
	@$(CARGO) clean
	@rm -rf cache
	@rm -rf out
	@rm -rf broadcast

## clean-docker: remove unused docker containers
clean-docker:
	@$(SUDO) docker rm -v $(shell $(SUDO) docker ps -a --filter status=exited -q) 2> /dev/null || true

## fmt: formatting solidity and rust code
fmt:
	@forge fmt --check
	@$(CARGO) fmt

## test: running tests
test:
	@forge test

## setup: install initial dependencies
setup: check-requirements
	@forge install
	@npm install

## start: run start script
start:
	@bash ./script/start.sh

## deploy: run deploy script
deploy:
	@bash ./script/deploy.sh

## start-all: starting anvil and WAVS with docker compose
start-all: clean-docker setup-env
	@bash ./script/start_all.sh

## deploy-contracts: deploying the contracts | SERVICE_MANAGER_ADDR, RPC_URL
deploy-contracts:
	@forge script ./script/Deploy.s.sol ${SERVICE_MANAGER_ADDR} --sig "run(string)" --rpc-url $(RPC_URL) --broadcast

## build-service: building the service JSON
build-service:
	@bash ./script/build_service.sh

## buy-yes: buying YES in the prediction market | PREDICTION_MARKET_FACTORY_ADDRESS, MARKET_MAKER_ADDRESS, CONDITIONAL_TOKENS_ADDRESS, COLLATERAL_TOKEN_ADDRESS, RPC_URL
buy-yes:
	@forge script ./script/BuyYes.s.sol ${PREDICTION_MARKET_FACTORY_ADDRESS} ${MARKET_MAKER_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} ${COLLATERAL_TOKEN_ADDRESS} --sig "run(string,string,string,string)" --rpc-url $(RPC_URL) --broadcast -v 4

## resolve-market: trigger the service to resolve the market | PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS, RPC_URL
resolve-market:
	@forge script ./script/Trigger.s.sol ${PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS} --sig "run(string)" --rpc-url $(RPC_URL) --broadcast -v 4

## redeem: redeeming the YES in the resolved prediction market | PREDICTION_MARKET_FACTORY_ADDRESS, COLLATERAL_TOKEN_ADDRESS, CONDITIONAL_TOKENS_ADDRESS, RPC_URL
redeem:
	@forge script ./script/Redeem.s.sol ${PREDICTION_MARKET_FACTORY_ADDRESS} ${COLLATERAL_TOKEN_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} --sig "run(string,string,string)" --rpc-url $(RPC_URL) --broadcast

## wavs-cli: running wavs-cli in docker
wavs-cli:
	@$(WAVS_CMD) $(filter-out $@,$(MAKECMDGOALS))

## upload-component: uploading the WAVS component | COMPONENT_FILENAME, WAVS_ENDPOINT
upload-component:
# TODO: move to `$(WAVS_CMD) upload-component ./compiled/${COMPONENT_FILENAME} --wavs-endpoint ${WAVS_ENDPOINT}`
	@wget --post-file=./compiled/${COMPONENT_FILENAME} --header="Content-Type: application/wasm" -O - ${WAVS_ENDPOINT}/upload | jq -r .digest

SERVICE_URL?="http://127.0.0.1:8080/ipfs/service.json"
## deploy-service: deploying the WAVS component service json | SERVICE_URL, CREDENTIAL, WAVS_ENDPOINT
deploy-service:
	@$(WAVS_CMD) deploy-service --service-url "$(SERVICE_URL)" --log-level=info --data /data/.docker --home /data $(if $(WAVS_ENDPOINT),--wavs-endpoint $(WAVS_ENDPOINT),) $(if $(CREDENTIAL),--evm-credential $(CREDENTIAL),)

## upload-to-ipfs: uploading the service config to IPFS | IPFS_ENDPOINT, SERVICE_FILE
upload-to-ipfs:
	@curl -s -X POST "${IPFS_ENDPOINT}/api/v0/add?pin=true" \
		-H "Content-Type: multipart/form-data" \
		-F file=@${SERVICE_FILE} | jq -r .Hash

## operator-list: listing the AVS operators | ENV_FILE
operator-list:
	@docker run --rm --network host --env-file ${ENV_FILE} -v ./.nodes:/root/.nodes --entrypoint /wavs/list_operator.sh ${MIDDLEWARE_DOCKER_IMAGE}

AVS_PRIVATE_KEY?=""
## operator-register: listing the AVS operators | ENV_FILE, AVS_PRIVATE_KEY
operator-register:
	@if [ -z "${AVS_PRIVATE_KEY}" ]; then \
		echo "Error: AVS_PRIVATE_KEY is not set. Please set it to your AVS private key."; \
		exit 1; \
	fi
	@docker run --rm --network host --env-file ${ENV_FILE} -v ./.nodes:/root/.nodes --entrypoint /wavs/register.sh ${MIDDLEWARE_DOCKER_IMAGE} "${AVS_PRIVATE_KEY}"

## update-submodules: update the git submodules
update-submodules:
	@git submodule update --init --recursive

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
_build_forge:
	@forge build

.PHONY: setup-env
setup-env:
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			echo "Creating .env file from .env.example..."; \
			cp .env.example .env; \
			echo ".env file created successfully!"; \
		fi; \
	fi

pull-image:
	@if ! docker image inspect ${DOCKER_IMAGE} &>/dev/null; then \
		echo "Image ${DOCKER_IMAGE} not found. Pulling..."; \
		$(SUDO) docker pull ${DOCKER_IMAGE}; \
	fi

# check versions

## check-requirements: verify system requirements are installed
check-requirements: check-node check-jq check-cargo

check-command:
	@command -v $(1) > /dev/null 2>&1 || (echo "Command $(1) not found. Please install $(1), reference the System Requirements section"; exit 1)

.PHONY: check-node
check-node:
	@$(call check-command,node)
	@NODE_VERSION=$$(node --version); \
	MAJOR_VERSION=$$(echo $$NODE_VERSION | sed 's/^v\([0-9]*\)\..*/\1/'); \
	if [ $$MAJOR_VERSION -lt 21 ]; then \
		echo "Error: Node.js version $$NODE_VERSION is less than the required v21."; \
		echo "Please upgrade Node.js to v21 or higher."; \
		exit 1; \
	fi

.PHONY: check-jq
check-jq:
	@$(call check-command,jq)

.PHONY: check-cargo
check-cargo:
	@$(call check-command,cargo)
