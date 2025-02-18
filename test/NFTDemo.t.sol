// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {NFTDemo} from "../src/NFTDemo.sol";
import {ITypes} from "../src/interfaces/ITypes.sol";
import {MockServiceManager} from "./MockServiceManager.sol";

contract NFTDemoTest is Test {
    NFTDemo public nft;
    address public owner;
    address public serviceManager;
    address public user;

    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        string dataUri
    );

    function setUp() public {
        owner = makeAddr("owner");
        serviceManager = address(new MockServiceManager());
        user = makeAddr("user");

        vm.prank(owner);
        nft = new NFTDemo(serviceManager);
    }

    function test_InitializeCorrectly() public view {
        assertEq(address(nft.serviceManager()), serviceManager);
    }

    function test_AddTriggerAndHandle() public {
        // Add trigger
        bytes memory triggerData = "test data";
        vm.deal(user, 1 ether);
        vm.prank(user);
        nft.addTrigger{value: 0.1 ether}(triggerData);

        // Get triggerId
        ITypes.TriggerId triggerId = nft.getTriggerIdAtIndex(user, 0);

        // Prepare mint data using ReturnData struct
        ITypes.DataWithId memory dataWithId = ITypes.DataWithId({
            triggerId: triggerId,
            data: abi.encode("ipfs://test")
        });

        bytes memory mintData = abi.encode(dataWithId);
        bytes memory signature = ""; // Empty signature for this test

        // Handle payload as service manager
        vm.prank(serviceManager);
        vm.expectEmit(true, true, true, true);
        emit NFTMinted(user, 0, "ipfs://test");
        nft.handleSignedData(mintData, signature);

        // Verify NFT was minted
        assertEq(nft.ownerOf(0), user);
        assertEq(nft.tokenURI(0), "ipfs://test");
    }

    function test_AddTriggerRequiresExactPayment() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        vm.expectRevert("Payment must be exactly 0.1 ETH");
        nft.addTrigger{value: 0.05 ether}("");
    }
}
