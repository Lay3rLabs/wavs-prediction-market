// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {Strings} from "@openzeppelin-contracts/utils/Strings.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";

import {PredictionMarketFactory} from "contracts/PredictionMarketFactory.sol";
import {PredictionMarketOracleController} from "contracts/PredictionMarketOracleController.sol";
import {ERC20Mintable} from "contracts/ERC20Mintable.sol";

// forge script ./script/Deploy.s.sol ${SERVICE_MANAGER} --sig "run(string)" --rpc-url http://localhost:8545 --broadcast
contract DeployScript is Script {
    using stdJson for string;

    string root = vm.projectRoot();
    string deployments_path = string.concat(root, "/.docker/deployments.json");
    string script_output_path =
        string.concat(root, "/.docker/script_deploy.json");

    uint256 privateKey =
        vm.envOr(
            "ANVIL_PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );

    function run(string calldata serviceManagerAddr) public {
        address serviceManager = vm.parseAddress(serviceManagerAddr);
        address deployer = vm.addr(privateKey);

        uint64 fee = 5e16; // 5% fee
        // fund with 1,000 collateral tokens
        uint256 funding = 1_000e18;

        vm.startBroadcast(privateKey);

        // Deploy the contracts
        PredictionMarketOracleController oracleController = new PredictionMarketOracleController(
                serviceManager
            );
        PredictionMarketFactory factory = oracleController.factory();
        ERC20Mintable collateralToken = new ERC20Mintable("Collateral", "CLL");

        // Launch the market
        collateralToken.mint(deployer, funding);
        collateralToken.approve(address(factory), funding);
        (
            ConditionalTokens conditionalTokens,
            LMSRMarketMaker lmsrMarketMaker
        ) = factory.createConditionalTokenAndLMSRMarketMaker(
                "uri",
                bytes32(0),
                address(collateralToken),
                fee,
                funding
            );

        vm.stopBroadcast();

        // Log the deployment
        console.log("Service manager:", serviceManager);
        console.log("Oracle controller address:", address(oracleController));
        console.log("Factory address:", address(factory));
        console.log("Collateral token address:", address(collateralToken));
        console.log("Conditional tokens address:", address(conditionalTokens));
        console.log("Market maker address:", address(lmsrMarketMaker));

        string memory json = "json";
        json.serialize("service_manager", serviceManager);
        json.serialize("oracle_controller", address(oracleController));
        json.serialize("factory", address(factory));
        json.serialize("collateral_token", address(collateralToken));
        json.serialize("conditional_tokens", address(conditionalTokens));
        string memory finalJson = json.serialize(
            "market_maker",
            address(lmsrMarketMaker)
        );
        vm.writeFile(script_output_path, finalJson);
    }
}
