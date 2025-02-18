// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {stdJson} from "forge-std/StdJson.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {NFTDemo} from "../src/NFTDemo.sol";
import {ITypes} from "../src/interfaces/ITypes.sol";
import {Utils} from "./Utils.sol";

contract DeployNFTDemo is Script {
    function run() public {
        (uint256 privateKey, ) = Utils.getPrivateKey(vm);

        vm.startBroadcast(privateKey);

        // Get the deployed service manager
        address serviceManager = Utils.getServiceManager(vm);

        // Deploy the contract
        NFTDemo nft = new NFTDemo(serviceManager);

        vm.stopBroadcast();

        // Log the deployment
        console.log("Service manager:", serviceManager);
        console.log("NFTDemo deployed at:", address(nft));

        // Write to .env file
        Utils.saveEnvVars(
            vm,
            string.concat("\nNFT_ADDRESS=", vm.toString(address(nft)))
        );
        console.log("Updated .env file with NFT_ADDRESS");
    }
}

contract TriggerNFTDemo is Script {
    function run(string memory testMessage) public {
        (uint256 privateKey, ) = Utils.getPrivateKey(vm);

        address nftAddress = vm.envAddress("NFT_ADDRESS");

        NFTDemo nft = NFTDemo(nftAddress);

        vm.startBroadcast(privateKey);

        // Create test trigger data using the provided message
        bytes memory testData = abi.encode(testMessage);

        // Add trigger (sends 0.1 ETH)
        nft.addTrigger{value: 0.1 ether}(testData);

        vm.stopBroadcast();

        // Get the trigger ID (it will be 0 for the first trigger)
        ITypes.TriggerId triggerId = ITypes.TriggerId.wrap(0);

        // Fetch and log the trigger info
        ITypes.TriggerInfo memory info = nft.getTrigger(triggerId);
        console.log("Trigger created by:", info.creator);
        console.log("Trigger message:", testMessage);
        console.logBytes(info.data);
    }
}

contract ShowLastResultNFTDemo is Script {
    function run() public view {
        NFTDemo nft = NFTDemo(vm.envAddress("NFT_ADDRESS"));

        uint256 nextTokenId = nft.nextTokenId();
        if (nextTokenId == 0) {
            console.log("No triggers created yet");
            return;
        }

        nextTokenId--;

        console.log("Last token ID:", nextTokenId);

        string memory dataURI = nft.tokenURI(nextTokenId);
        console.log("dataURI:", dataURI);

        // remove the base64 prefix
        bytes memory dataURIBytes = bytes(dataURI);
        bytes memory base64Prefix = bytes("data:application/json;base64,");
        bytes memory data = new bytes(
            dataURIBytes.length - base64Prefix.length
        );
        for (uint256 i = 0; i < data.length; i++) {
            data[i] = dataURIBytes[base64Prefix.length + i];
        }

        console.log(
            string.concat(
                'Run `echo "',
                string(data),
                '" | base64 --decode` to view the data'
            )
        );
    }
}
