import { BigInt, BigDecimal, Bytes, log } from "@graphprotocol/graph-ts";

import { AnswerUpdated } from "../generated/EACAggregatorProxyBTCUSDOnMumbai/EACAggregatorProxy";
import { PricePair } from "../generated/schema";

import { pairs } from "./pairs/pairs";

export function handleAnswerUpdated(event: AnswerUpdated): void {
  let id = event.params.roundId.toString() + "-" + event.address.toHex();

  let pricePair = PricePair.load(id);
  if (pricePair == null) {
    pricePair = new PricePair(id);
  }
  let pairInfo = pairs.get(event.address.toHex().toLowerCase());

  if (pairInfo) {
    pricePair.baseAsset = pairInfo.baseAsset;
    pricePair.quoteAsset = pairInfo.quoteAsset;
    pricePair.chainId = BigInt.fromI32(pairInfo.chainId);
    pricePair.decimals = BigInt.fromI32(pairInfo.decimals);
  } else {
    log.warning("No pair information found for address: {}", [
      event.address.toHex(),
    ]);
    return;
  }

  let price = event.params.current.toBigDecimal();
  pricePair.price = price;

  pricePair.roundId = event.params.roundId;
  pricePair.updatedAt = event.params.updatedAt.toI32();
  pricePair.blockNumber = event.block.number;
  pricePair.blockTimestamp = event.block.timestamp.toI32();
  pricePair.save();
}
