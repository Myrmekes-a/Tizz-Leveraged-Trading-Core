import { Injectable } from "@nestjs/common";

import {
  recoverAddress,
  getAddress,
  keccak256,
  stringToBytes,
  recoverMessageAddress,
} from "viem";

@Injectable()
export class Web3ConnectService {
  async verifyWeb3Auth(
    wallet_address: `0x${string}`,
    signature: `0x${string}`,
    timestamp: number,
  ): Promise<boolean> {
    try {
      const uri = process.env.URI;
      const version = 1;
      const chainId = process.env.CHAIN_ID;
      const issuedAt = new Date(timestamp).toISOString();
      const expiresAt = new Date(timestamp + 4 * 3600 * 1000).toISOString();

      const message = [
        "Welcome to Tizz!",
        `URI: ${uri}`,
        `Version: ${version}`,
        `Chain ID: ${chainId}`,
        `Issued At: ${issuedAt}`,
        `Expires At: ${expiresAt}`,
      ].join("\n\n");
      const recoveredAddress = await recoverMessageAddress({
        message: message,
        signature,
      });
      const checksumWalletAddress = getAddress(wallet_address);

      // console.log(checksumWalletAddress, recoveredAddress);
      if (checksumWalletAddress === recoveredAddress) {
        // console.log("authenticated");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async verifyWeb3Message(
    wallet_address: string,
    signature: any,
  ): Promise<boolean> {
    try {
      const message = "Tizz Guild AUTH";
      const messageBytes = stringToBytes(message);
      const messageDigest = keccak256(messageBytes);
      // console.log(messageDigest, signature);
      const recoveredAddress = await recoverAddress({
        hash: messageDigest,
        signature,
      });
      const checksumWalletAddress = getAddress(wallet_address);

      // console.log(checksumWalletAddress, recoveredAddress);
      if (checksumWalletAddress === recoveredAddress) {
        // console.log("authenticated");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
