import { Module } from '@nestjs/common';
import { Web3ToolsService } from './web3Tools.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 300000,
    }),
  ],
  providers: [Web3ToolsService],
  exports: [Web3ToolsService],
})
export class Web3ToolsModule {}
