// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";

contract MockServiceManager is IWavsServiceManager {
    function validate(
        bytes calldata data,
        bytes calldata signature
    ) external view {
        // Do nothing (pass validation)
    }
}
