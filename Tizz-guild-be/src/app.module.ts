import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./modules/user/user.module";
import { GuildModule } from "./modules/guild/guild.module";
import { AdminModule } from "./modules/admin/admin.module";
import { EventsModule } from "./modules/events/events.module";
import { Web3ConnectModule } from "./modules/web3Connect/web3Connect.module";
import { Web3ToolsModule } from "./modules/web3Tools/web3Tools.module";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { TasksModule } from "./modules/TasksService/TasksService.module";

@Module({
  imports: [
    UserModule,
    GuildModule,
    AdminModule,
    EventsModule,
    Web3ConnectModule,
    Web3ToolsModule,
    ScheduleModule.forRoot(),
    HttpModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
