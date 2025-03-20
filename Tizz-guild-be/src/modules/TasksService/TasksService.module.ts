import { Module } from '@nestjs/common';
import { TasksService } from './TasksService.service';
import { UserModule } from '../user/user.module';
import { TradingDataModule } from '../tradingData/TradingData.module';
import { GuildModule } from '../guild/guild.module';
@Module({
  imports: [UserModule, TradingDataModule, GuildModule],
  providers: [TasksService],
})
export class TasksModule { }
