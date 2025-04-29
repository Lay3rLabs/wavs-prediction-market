// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {ConditionalTokens} from "@lay3rlabs/conditional-tokens-contracts/ConditionalTokens.sol";
import {LMSRMarketMaker} from "@lay3rlabs/conditional-tokens-market-makers/LMSRMarketMaker.sol";

import {ITypes} from "../interfaces/ITypes.sol";
import {PredictionMarketFactory} from "./PredictionMarketFactory.sol";

// The contract responsible for triggering the oracle to resolve the market and handling the oracle output and instructing the market maker to resolve the market.
contract PredictionMarketOracleController is IWavsServiceHandler {
    // The factory that handles creating and resolving the market.
    PredictionMarketFactory public factory;

    mapping(ITypes.TriggerId => Trigger) public triggersById;

    IWavsServiceManager public serviceManager;
    ITypes.TriggerId public nextTriggerId;

    struct Trigger {
        address creator;
        bytes data;
    }

    // The data that is passed to the oracle AVS via the `NewTrigger` event.
    struct TriggerInputData {
        address lmsrMarketMaker;
        address conditionalTokens;
    }

    // The data that is returned from the oracle AVS.
    struct AvsOutputData {
        address lmsrMarketMaker;
        address conditionalTokens;
        bool result;
    }

    constructor(address serviceManager_) {
        require(serviceManager_ != address(0), "Invalid service manager");

        factory = new PredictionMarketFactory();
        serviceManager = IWavsServiceManager(serviceManager_);
    }

    /**
     * @dev Handle the AVS oracle resolution event. This should close the market and payout the corresponding outcome tokens based on the result.
     * @param data The data returned from the oracle AVS.
     * @param signature The signature of the data.
     */
    function handleSignedData(
        bytes calldata data,
        bytes calldata signature
    ) external override {
        serviceManager.validate(data, signature);

        ITypes.DataWithId memory dataWithId = abi.decode(
            data,
            (ITypes.DataWithId)
        );

        Trigger memory trigger = triggersById[dataWithId.triggerId];
        require(trigger.creator != address(0), "Trigger does not exist");

        AvsOutputData memory returnData = abi.decode(
            dataWithId.data,
            (AvsOutputData)
        );

        // Tell factory to resolve the market
        factory.resolveMarket(
            LMSRMarketMaker(returnData.lmsrMarketMaker),
            ConditionalTokens(returnData.conditionalTokens),
            returnData.result
        );
    }

    /**
     * @dev Trigger the oracle AVS to resolve the market.
     * @param triggerData The data to pass to the oracle AVS.
     * @return triggerId The ID of the trigger.
     */
    function addTrigger(
        TriggerInputData calldata triggerData
    ) external payable returns (ITypes.TriggerId triggerId) {
        require(msg.value == 0.1 ether, "Payment must be exactly 0.1 ETH");

        // Get the next trigger ID
        triggerId = nextTriggerId;
        nextTriggerId = ITypes.TriggerId.wrap(
            ITypes.TriggerId.unwrap(nextTriggerId) + 1
        );

        bytes memory data = abi.encode(triggerData);

        Trigger memory trigger = Trigger({creator: msg.sender, data: data});
        triggersById[triggerId] = trigger;

        ITypes.TriggerInfo memory triggerInfo = ITypes.TriggerInfo({
            triggerId: triggerId,
            creator: trigger.creator,
            data: trigger.data
        });

        emit ITypes.NewTrigger(abi.encode(triggerInfo));
    }

    /**
     * @dev Get the trigger info for a given trigger ID.
     * @param triggerId The ID of the trigger to get the info for.
     * @return triggerInfo The trigger info.
     */
    function getTrigger(
        ITypes.TriggerId triggerId
    ) external view returns (Trigger memory) {
        return triggersById[triggerId];
    }
}
