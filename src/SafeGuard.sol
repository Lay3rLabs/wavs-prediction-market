// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@gnosis.pm/safe-contracts/contracts/base/GuardManager.sol";
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "@gnosis.pm/safe-contracts/contracts/Safe.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {ITypes} from "./interfaces/ITypes.sol";

contract SafeGuard is Guard, IWavsServiceHandler {
    enum ValidationStatus {
        NotExists,
        Pending,
        Approved,
        Rejected,
        Expired
    }

    // Add validation timeout
    uint256 public constant VALIDATION_TIMEOUT = 1 hours;

    struct TransactionDetails {
        ValidationStatus status;
        uint256 validationExpiry;
    }

    struct ValidationPayload {
        bytes32 approvedHash;
        bool approved;
    }

    // Address of the Gnosis Safe this guard is connected to
    address payable public immutable safe;

    // Address of the authorized service manager
    IWavsServiceManager public serviceManager;

    // Validation state mappings
    mapping(bytes32 => TransactionDetails) public txDetails;

    event ValidationStatusUpdated(
        bytes32 indexed approvedHash,
        ValidationStatus status
    );

    error AsyncValidationRequired();
    error TransactionExpired();

    modifier onlyServiceManager() {
        require(
            msg.sender == address(serviceManager),
            "Only service manager can call this function"
        );
        _;
    }

    constructor(address payable _safe, address _serviceManager) {
        require(_safe != address(0), "Invalid safe address");
        require(
            _serviceManager != address(0),
            "Invalid service manager address"
        );
        safe = _safe;
        serviceManager = IWavsServiceManager(_serviceManager);
    }

    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory, //signatures,
        address //initiator
    ) external view override {
        require(msg.sender == address(safe), "Unauthorized");

        // Calculate the transaction hash using Safe's getTransactionHash with current nonce - 1
        // since the nonce has already been incremented when this check is called
        uint256 currentNonce = Safe(safe).nonce();
        bytes32 txHash = Safe(safe).getTransactionHash(
            to,
            value,
            data,
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            currentNonce - 1 // Use nonce - 1 since it's already incremented
        );

        TransactionDetails storage details = txDetails[txHash];

        if (details.status == ValidationStatus.NotExists) {
            revert AsyncValidationRequired();
        }

        if (details.status == ValidationStatus.Rejected) {
            revert("Transaction was rejected");
        }

        if (details.status == ValidationStatus.Approved) {
            if (block.timestamp > details.validationExpiry) {
                revert TransactionExpired();
            }
            return; // Allow execution if validated and not expired
        }

        // If pending or other status, revert
        revert AsyncValidationRequired();
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

        ITypes.DataWithId memory dataWithId = abi.decode(
            data,
            (ITypes.DataWithId)
        );

        ValidationPayload memory payload = abi.decode(
            dataWithId.data,
            (ValidationPayload)
        );

        ValidationStatus newStatus = payload.approved
            ? ValidationStatus.Approved
            : ValidationStatus.Rejected;

        txDetails[payload.approvedHash] = TransactionDetails({
            status: newStatus,
            validationExpiry: payload.approved
                ? block.timestamp + VALIDATION_TIMEOUT
                : 0
        });

        emit ValidationStatusUpdated(payload.approvedHash, newStatus);
    }

    function getTransactionStatus(
        bytes32 txHash
    ) external view returns (ValidationStatus status, uint256 remainingTime) {
        TransactionDetails storage details = txDetails[txHash];

        if (details.status == ValidationStatus.NotExists) {
            return (ValidationStatus.NotExists, 0);
        }

        uint256 remaining = details.validationExpiry > block.timestamp
            ? details.validationExpiry - block.timestamp
            : 0;

        return (details.status, remaining);
    }

    /// @dev Called after a transaction is executed
    /// @param success True if the transaction was successful
    function checkAfterExecution(
        bytes32, //txHash,
        bool success
    ) external view override {
        require(msg.sender == address(safe), "Unauthorized");
        require(success, "Transaction failed");
        // Note: We don't clean up state here anymore since it's tied to parameters
        // not the specific transaction hash
    }

    /// @dev Returns whether the contract implements the given interface
    /// @param interfaceId The interface identifier
    /// @return true if the contract implements the interface
    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return interfaceId == type(Guard).interfaceId;
    }
}
