// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "@gnosis.pm/safe-contracts/contracts/base/ModuleManager.sol";
import "@gnosis.pm/safe-contracts/contracts/base/OwnerManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {ITypes} from "./interfaces/ITypes.sol";

contract SafeAIModule is IWavsServiceHandler {
    // Address of the Gnosis Safe this module is connected to
    address public safe;

    // Store the owner who can use this module
    address public owner;

    // Address of the authorized service manager
    IWavsServiceManager public serviceManager;

    struct Trigger {
        address creator;
        bytes data;
    }

    struct TransactionPayload {
        address to;
        uint256 value;
        bytes data;
    }

    mapping(ITypes.TriggerId => Trigger) public triggersById;
    mapping(address => ITypes.TriggerId[]) public triggerIdsByCreator;
    ITypes.TriggerId public nextTriggerId;

    event Funded(address sender, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlySafe() {
        require(msg.sender == safe, "Only safe can call this function");
        _;
    }

    modifier onlyServiceManager() {
        require(
            msg.sender == address(serviceManager),
            "Only service manager can call this function"
        );
        _;
    }

    constructor(address _safe, address _serviceManager) {
        require(_safe != address(0), "Invalid safe address");
        require(
            _serviceManager != address(0),
            "Invalid service manager address"
        );

        safe = _safe;
        serviceManager = IWavsServiceManager(_serviceManager);
        owner = msg.sender;
    }

    function fundModule() external payable {
        // Accept ETH funding
        emit Funded(msg.sender, msg.value);
    }

    /**
     * @dev Handle the AVS output.
     * @param data The data returned from the oracle AVS.
     * @param signature The signature of the data.
     */
    function handleSignedData(
        bytes calldata data,
        bytes calldata signature
    ) external override {
        serviceManager.validate(data, signature);

        // Decode the transaction from the payload data
        TransactionPayload memory payload = abi.decode(
            data,
            (TransactionPayload)
        );

        require(payload.to != address(0), "Invalid target address");

        // Execute the transaction from the Safe
        bool success = ModuleManager(safe).execTransactionFromModule(
            payload.to,
            payload.value,
            payload.data,
            Enum.Operation.Call
        );

        require(success, "Module transaction failed");
    }

    function addTrigger(
        bytes memory data
    ) external payable returns (ITypes.TriggerId triggerId) {
        require(msg.value == 0.1 ether, "Payment must be exactly 0.1 ETH");

        // Forward the ETH to the Safe using low-level call
        (bool sent, ) = safe.call{value: msg.value}("");
        require(sent, "ETH transfer to Safe failed");

        // Get the next trigger id
        triggerId = nextTriggerId;
        nextTriggerId = ITypes.TriggerId.wrap(
            ITypes.TriggerId.unwrap(nextTriggerId) + 1
        );

        // Create the trigger
        Trigger memory trigger = Trigger({creator: msg.sender, data: data});

        // Update storage
        triggersById[triggerId] = trigger;
        triggerIdsByCreator[msg.sender].push(triggerId);

        // Emit trigger info
        ITypes.TriggerInfo memory triggerInfo = ITypes.TriggerInfo({
            triggerId: triggerId,
            creator: trigger.creator,
            data: trigger.data
        });

        emit ITypes.NewTrigger(abi.encode(triggerInfo));
    }

    function getTrigger(
        ITypes.TriggerId triggerId
    ) external view returns (ITypes.TriggerInfo memory) {
        Trigger storage trigger = triggersById[triggerId];

        return
            ITypes.TriggerInfo({
                triggerId: triggerId,
                creator: trigger.creator,
                data: trigger.data
            });
    }

    function getTriggerCount(address creator) external view returns (uint256) {
        return triggerIdsByCreator[creator].length;
    }

    function getTriggerIdAtIndex(
        address creator,
        uint256 index
    ) external view returns (ITypes.TriggerId) {
        require(
            index < triggerIdsByCreator[creator].length,
            "Index out of bounds"
        );
        return triggerIdsByCreator[creator][index];
    }
}
