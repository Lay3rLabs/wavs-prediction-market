#!/bin/bash

set -e

FUEL_LIMIT=${FUEL_LIMIT:-1000000000000}
MAX_GAS=${MAX_GAS:-5000000}
FILE_LOCATION=${FILE_LOCATION:-".docker/service.json"}
TRIGGER_CHAIN=${TRIGGER_CHAIN:-"local"}
SUBMIT_CHAIN=${SUBMIT_CHAIN:-"local"}
AGGREGATOR_URL=${AGGREGATOR_URL:-"http://127.0.0.1:8001"}
# used in make upload-component
WAVS_ENDPOINT=${WAVS_ENDPOINT:-"http://localhost:8000"}

SERVICE_MANAGER_ADDR=`jq -r .addresses.WavsServiceManager .nodes/avs_deploy.json`

# === Addresses ===
ORACLE_CONTROLLER_ADDRESS=`jq -r '.oracle_controller' "./.docker/script_deploy.json"`
MARKET_MAKER_ADDRESS=`jq -r '.market_maker' "./.docker/script_deploy.json"`
CONDITIONAL_TOKENS_ADDRESS=`jq -r '.conditional_tokens' "./.docker/script_deploy.json"`
# COLLATERAL_TOKEN_ADDRESS=`jq -r '.collateral_token' "./.docker/script_deploy.json"`
PREDICTION_MARKET_ORACLE_COMPONENT_FILENAME=prediction_market_oracle.wasm
PREDICTION_MARKET_ORACLE_TRIGGER_EVENT="NewTrigger(bytes)"
PREDICTION_MARKET_ORACLE_CONFIG="market_maker=${MARKET_MAKER_ADDRESS},conditional_tokens=${CONDITIONAL_TOKENS_ADDRESS}"

# === Core ===

BASE_CMD="docker run --rm --network host -w /data -v $(pwd):/data ghcr.io/lay3rlabs/wavs:0.4.0-beta.2 wavs-cli service --json true --home /data --file /data/${FILE_LOCATION}"

SERVICE_ID=`$BASE_CMD init --name demo | jq -r .id`
echo "Service ID: ${SERVICE_ID}"

# If no aggregator is set, use the default (during workflow submit)
WORKFLOW_SUB_CMD="set-evm"
if [ -n "$AGGREGATOR_URL" ]; then
    WORKFLOW_SUB_CMD="set-aggregator --url ${AGGREGATOR_URL}"
fi

function new_workflow() {
    local trigger_address=$1
    local submit_address=$2
    local event_type=$3 # "event" or "cron"
    local trigger_event_or_cron_schedule=$4
    local component_filename=$5
    local env_vars=$6
    local config=$7

    local workflow_id=`$BASE_CMD workflow add | jq -r '.workflows | to_entries | map(select(.value.component == "unset")) | .[0].key'`
    echo "Workflow ID: ${workflow_id}"

    if [ "${event_type}" == "event" ]; then
        local trigger_event_hash=`cast keccak ${trigger_event_or_cron_schedule}`
        $BASE_CMD workflow trigger --id ${workflow_id} set-evm --address ${trigger_address} --chain-name ${TRIGGER_CHAIN} --event-hash ${trigger_event_hash} > /dev/null
    elif [ "${event_type}" == "cron" ]; then
        # no CMD for cron yet, edit the service.json file directly
        tmp=$(mktemp)
        jq '.workflows["'${workflow_id}'"].trigger = { "cron": { "schedule": "'"$trigger_event_or_cron_schedule"'", "start_time": null, "end_time": null } }' ${FILE_LOCATION} > ${tmp}
        mv ${tmp} ${FILE_LOCATION}
    fi

    $BASE_CMD workflow submit --id ${workflow_id} ${WORKFLOW_SUB_CMD} --address ${submit_address} --chain-name ${SUBMIT_CHAIN} --max-gas ${MAX_GAS} > /dev/null

    local digest=`COMPONENT_FILENAME=${component_filename} make --no-print-directory upload-component | cut -d':' -f2`
    $BASE_CMD workflow component --id ${workflow_id} set-source-digest --digest ${digest} > /dev/null
    $BASE_CMD workflow component --id ${workflow_id} permissions --http-hosts '*' --file-system true > /dev/null
    $BASE_CMD workflow component --id ${workflow_id} time-limit --seconds 60 > /dev/null
    if [ -n "${env_vars}" ]; then
        $BASE_CMD workflow component --id ${workflow_id} env --values ${env_vars} > /dev/null
    fi
    if [ -n "${config}" ]; then
        $BASE_CMD workflow component --id ${workflow_id} config --values ${config} > /dev/null
    fi
}

# === Prediction Market Oracle ===
new_workflow ${ORACLE_CONTROLLER_ADDRESS} ${ORACLE_CONTROLLER_ADDRESS} "event" ${PREDICTION_MARKET_ORACLE_TRIGGER_EVENT} ${PREDICTION_MARKET_ORACLE_COMPONENT_FILENAME} "" ${PREDICTION_MARKET_ORACLE_CONFIG}

$BASE_CMD manager set-evm --chain-name ${SUBMIT_CHAIN} --address `cast --to-checksum ${SERVICE_MANAGER_ADDR}`
$BASE_CMD validate > /dev/null

# inform aggregator if set
if [ -n "$AGGREGATOR_URL" ]; then
    wget -q --header="Content-Type: application/json" --post-data='{"service": '"$(cat ${FILE_LOCATION})"'}' ${AGGREGATOR_URL}/register-service -O -
fi

echo "Configuration file created at ${FILE_LOCATION}"
