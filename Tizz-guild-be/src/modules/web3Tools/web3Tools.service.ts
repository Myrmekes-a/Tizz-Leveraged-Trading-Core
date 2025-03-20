import { Injectable } from '@nestjs/common';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class Web3ToolsService {
  constructor(private readonly httpService: HttpService) {
    console.log('web3ToolsService instantiated');
  }

  private readonly web3 = new Web3(process.env.HTTP_PROVIDER_MAINNET);
  private readonly provider = new ethers.providers.JsonRpcProvider(
    process.env.HTTP_PROVIDER_MAINNET,
  );

  async getEnsName(wallet_address: string) {
    const ensName = await this.provider.lookupAddress(wallet_address);

    return ensName;
  }
}
