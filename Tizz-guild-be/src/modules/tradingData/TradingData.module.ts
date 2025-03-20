import { Module } from '@nestjs/common';
import { TradingDataService } from './TradingData.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [TradingDataService],
  exports: [TradingDataService], // Export if other modules need to use it
})
export class TradingDataModule {}
