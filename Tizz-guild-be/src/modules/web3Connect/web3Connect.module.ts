import { Module } from '@nestjs/common';
import { Web3ConnectService } from './web3Connect.service';

@Module({
  providers: [Web3ConnectService],
  exports: [Web3ConnectService],
})
export class Web3ConnectModule {}
