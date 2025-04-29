// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {ITypes} from "../src/interfaces/ITypes.sol";
import {PredictionMarketOracleController} from "../src/contracts/PredictionMarketOracleController.sol";

// forge script ./script/Trigger.s.sol ${ORACLE_CONTROLLER_ADDRESS} ${MARKET_MAKER_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} --sig "run(string,string,string)" --rpc-url http://localhost:8545 --broadcast
contract TriggerScript is Script {
    uint256 privateKey =
        vm.envOr(
            "ANVIL_PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );

    function run(
        string calldata oracleControllerAddr,
        string calldata marketMakerAddr,
        string calldata conditionalTokensAddr
    ) public {
        address oracleAddress = vm.parseAddress(oracleControllerAddr);
        address marketMakerAddress = vm.parseAddress(marketMakerAddr);
        address conditionalTokensAddress = vm.parseAddress(
            conditionalTokensAddr
        );

        PredictionMarketOracleController oracle = PredictionMarketOracleController(
                oracleAddress
            );

        vm.startBroadcast(privateKey);

        // Create test trigger data using the provided message
        PredictionMarketOracleController.TriggerInputData
            memory triggerData = PredictionMarketOracleController
                .TriggerInputData({
                    lmsrMarketMaker: marketMakerAddress,
                    conditionalTokens: conditionalTokensAddress
                });

        // Add trigger (sends 0.1 ETH)
        ITypes.TriggerId triggerId = oracle.addTrigger{value: 0.1 ether}(
            triggerData
        );

        vm.stopBroadcast();

        uint64 tid = ITypes.TriggerId.unwrap(triggerId);
        console.log("Trigger ID:", tid);
    }
}
