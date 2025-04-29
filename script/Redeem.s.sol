// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";

import {ITypes} from "../src/interfaces/ITypes.sol";
import {ERC20Mintable} from "../src/contracts/ERC20Mintable.sol";

// forge script ./script/Redeem.s.sol ${FACTORY_ADDRESS} ${COLLATERAL_TOKEN_ADDRESS} ${CONDITIONAL_TOKENS_ADDRESS} --sig "run(string,string,string)" --rpc-url http://localhost:8545 --broadcast
contract RedeemScript is Script {
    uint256 privateKey =
        vm.envOr(
            "ANVIL_PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );

    function run(
        string calldata factoryAddr,
        string calldata collateralTokenAddr,
        string calldata conditionalTokensAddr
    ) public {
        address deployer = vm.addr(privateKey);
        address factoryAddress = vm.parseAddress(factoryAddr);
        address collateralTokenAddress = vm.parseAddress(collateralTokenAddr);
        address conditionalTokensAddress = vm.parseAddress(
            conditionalTokensAddr
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

        vm.stopBroadcast();

        console.log(
            "Collateral balance after:",
            collateralToken.balanceOf(deployer)
        );
        console.log(
            "Outcome share balance after:",
            conditionalTokens.balanceOf(deployer, positionId)
        );
    }
}
