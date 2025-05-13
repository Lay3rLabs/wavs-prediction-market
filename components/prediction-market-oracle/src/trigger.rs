use crate::bindings::wavs::worker::layer_types::{TriggerData, TriggerDataEvmContractEvent};
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_utils::{decode_event_log_data, evm::alloy_primitives::Address};

pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<solidity::TriggerInfo, String> {
    match trigger_data {
        TriggerData::EvmContractEvent(TriggerDataEvmContractEvent { log, .. }) => {
            let event: solidity::NewTrigger =
                decode_event_log_data!(log).map_err(|e| e.to_string())?;

            let trigger_info = solidity::TriggerInfo::abi_decode(&event._triggerInfo)
                .map_err(|e| e.to_string())?;

            Ok(trigger_info)
        }
        _ => Err("Unsupported trigger data type".to_string()),
    }
}

pub fn encode_trigger_output(
    trigger_id: u64,
    lmsr_market_maker: Address,
    conditional_tokens: Address,
    result: bool,
) -> Vec<u8> {
    solidity::DataWithId {
        triggerId: trigger_id,
        data: solidity::AvsOutputData {
            lmsrMarketMaker: lmsr_market_maker,
            conditionalTokens: conditional_tokens,
            result,
        }
        .abi_encode()
        .to_vec()
        .into(),
    }
    .abi_encode()
}

mod solidity {
    use alloy_sol_macro::sol;
    pub use ITypes::*;
    // imports DataWithId, TriggerInfo, NewTrigger, and TriggerId
    sol!("../../src/interfaces/ITypes.sol");
}
