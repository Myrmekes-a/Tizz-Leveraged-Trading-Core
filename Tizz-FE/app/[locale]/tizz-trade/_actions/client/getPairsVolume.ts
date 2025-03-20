"use client";

import { getEndpoints } from "./config";
import { CollateralTypes } from "@tizz-hive/sdk";

import { collateralPrecisions } from "@/utils/tizz";

export async function getPairsVolume(
  chainId: number,
  collateralType: CollateralTypes,
) {
  try {
    const res = await fetch(
      getEndpoints("getPairsVolume", chainId, collateralType),
    ).then((res) => res.json());

    if (!res || !Array.isArray(res)) {
      throw new Error();
    }

    return (res as any[]).map((item) => ({
      pair: item?.pair as string,
      volume:
        parseFloat(item?.volume || 0) / collateralPrecisions[collateralType],
    }));
  } catch (err) {
    console.log(err);
    return Promise.reject(new Error("Failed at fetching getPairsVolume"));
  }
}
