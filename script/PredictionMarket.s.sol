// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";
import {PredictionMarketOracleController, ITypes} from "../src/PredictionMarketOracleController.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";
import {ERC20Mintable} from "../src/ERC20Mintable.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Utils} from "./Utils.sol";

contract DeployPredictionMarket is Script {
    PredictionMarketOracleController public oracle;
    PredictionMarketFactory public factory;
    ERC20Mintable public collateralToken;

    function run() public {
        (uint256 privateKey, address deployer) = Utils.getPrivateKey(vm);

        uint64 fee = 5e16; // 5% fee
        // fund with 1,000 collateral tokens
        uint256 funding = 1_000e18;

        vm.startBroadcast(privateKey);

        // Get the deployed service manager
        address serviceManager = Utils.getServiceManager(vm);

        // Deploy the contracts
        oracle = new PredictionMarketOracleController(serviceManager);
        factory = oracle.factory();
        collateralToken = new ERC20Mintable("Collateral", "CLL");

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
        console.log("Oracle controller address:", address(oracle));
        console.log("Factory address:", address(factory));
        console.log("Collateral token address:", address(collateralToken));
        console.log("Conditional tokens address:", address(conditionalTokens));
        console.log("Market maker address:", address(lmsrMarketMaker));
    }
}

contract BuyYesPredictionMarket is Script {
    LMSRMarketMaker public marketMaker;
    ConditionalTokens public conditionalTokens;
    ERC20Mintable public collateralToken;

    function run() public {
        (uint256 privateKey, address deployer) = Utils.getPrivateKey(vm);

        address factoryAddress = vm.envAddress(
            "PREDICTION_MARKET_FACTORY_ADDRESS"
        );
        address marketMakerAddress = vm.envAddress("MARKET_MAKER_ADDRESS");
        address collateralTokenAddress = vm.envAddress(
            "COLLATERAL_TOKEN_ADDRESS"
        );
        address conditionalTokensAddress = vm.envAddress(
            "CONDITIONAL_TOKENS_ADDRESS"
        );
        // buy with 1 collateral token
        int256 buying = 1e18;

        marketMaker = LMSRMarketMaker(marketMakerAddress);
        conditionalTokens = ConditionalTokens(conditionalTokensAddress);
        collateralToken = ERC20Mintable(collateralTokenAddress);

        // Add more detailed logging
        console.log("Factory address:", factoryAddress);
        console.log("Market maker address:", marketMakerAddress);
        console.log("Collateral token address:", collateralTokenAddress);
        console.log("Conditional tokens address:", conditionalTokensAddress);

        vm.startBroadcast(privateKey);

        collateralToken.mint(deployer, uint256(buying));
        collateralToken.approve(address(marketMaker), uint256(buying));

        bytes32 conditionId = conditionalTokens.getConditionId(
            factoryAddress,
            bytes32(0),
            2
        );
        bytes32 collectionId = conditionalTokens.getCollectionId(
            bytes32(0),
            conditionId,
            2
        );
        uint256 positionId = conditionalTokens.getPositionId(
            IERC20(collateralTokenAddress),
            collectionId
        );
        console.log(
            "Collateral balance before:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance before:",
            conditionalTokens.balanceOf(deployer, positionId)
        );

        // buy all YES
        int256[] memory outcomeTokenAmounts = new int256[](2);
        outcomeTokenAmounts[0] = 0;
        outcomeTokenAmounts[1] = buying;
        int256 netCost = marketMaker.trade(outcomeTokenAmounts, buying);

        console.log("Net cost:", netCost);
        console.log(
            "Collateral balance after:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance after:",
            conditionalTokens.balanceOf(deployer, positionId)
        );

        vm.stopBroadcast();
    }
}

contract TriggerOracleResolvePredictionMarket is Script {
    function run() public {
        (uint256 privateKey, ) = Utils.getPrivateKey(vm);

        address oracleAddress = vm.envAddress(
            "PREDICTION_MARKET_ORACLE_CONTROLLER_ADDRESS"
        );
        address marketMakerAddress = vm.envAddress("MARKET_MAKER_ADDRESS");
        address conditionalTokensAddress = vm.envAddress(
            "CONDITIONAL_TOKENS_ADDRESS"
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

contract RedeemPredictionMarket is Script {
    function run() public {
        (uint256 privateKey, address deployer) = Utils.getPrivateKey(vm);

        address factoryAddress = vm.envAddress(
            "PREDICTION_MARKET_FACTORY_ADDRESS"
        );
        address collateralTokenAddress = vm.envAddress(
            "COLLATERAL_TOKEN_ADDRESS"
        );
        address conditionalTokensAddress = vm.envAddress(
            "CONDITIONAL_TOKENS_ADDRESS"
        );

        ERC20Mintable collateralToken = ERC20Mintable(collateralTokenAddress);
        ConditionalTokens conditionalTokens = ConditionalTokens(
            conditionalTokensAddress
        );

        // Add more detailed logging
        console.log("Factory address:", factoryAddress);
        console.log("Collateral token address:", collateralTokenAddress);
        console.log("Conditional tokens address:", conditionalTokensAddress);

        vm.startBroadcast(privateKey);

        bytes32 conditionId = conditionalTokens.getConditionId(
            factoryAddress,
            bytes32(0),
            2
        );
        bytes32 collectionId = conditionalTokens.getCollectionId(
            bytes32(0),
            conditionId,
            2
        );
        uint256 positionId = conditionalTokens.getPositionId(
            IERC20(collateralTokenAddress),
            collectionId
        );
        console.log(
            "Collateral balance before:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance before:",
            conditionalTokens.balanceOf(deployer, positionId)
        );

        // redeem payout
        uint256[] memory indexSets = new uint256[](1);
        indexSets[0] = 2;
        conditionalTokens.redeemPositions(
            IERC20(collateralTokenAddress),
            bytes32(0),
            conditionId,
            indexSets
        );

        console.log(
            "Collateral balance after:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance after:",
            conditionalTokens.balanceOf(deployer, positionId)
        );

        vm.stopBroadcast();
    }
}
