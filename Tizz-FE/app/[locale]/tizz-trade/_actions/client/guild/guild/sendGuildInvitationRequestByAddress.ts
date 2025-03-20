"use client";

import { convertResToGuildError, isGuildApiError } from "@/utils/index";
import { customFetch } from "../fetchConfig";
import { IGuildMembershipAction } from "@/types/index";

export type InvitationRequestDto = {
  guild_id: number;
  address: string;
};

export async function sendGuildInvitationRequestByAddress(
  variables: InvitationRequestDto,
): Promise<IGuildMembershipAction> {
  try {
    const res = await customFetch("/guild/sendInvitationRequestByAddress", {
      method: "post",
      body: JSON.stringify(variables),
    }).then((res) => res.json());

    if (!res) {
      throw new Error();
    }

    if (isGuildApiError(res)) {
      return Promise.reject(convertResToGuildError(res));
    }

    return res as IGuildMembershipAction;
  } catch (err) {
    console.log(err);
    return Promise.reject(new Error("Failed at creating a guild join request"));
  }
}
