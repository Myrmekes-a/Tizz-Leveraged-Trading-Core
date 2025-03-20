import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UserService } from "../user/user.service";
import { TradingDataService } from "../tradingData/TradingData.service";
import { Mutex } from "async-mutex";
import { GuildService } from "../guild/guild.service";

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private readonly userService: UserService,
    private readonly guildService: GuildService,
    private readonly tradingDataService: TradingDataService,
  ) {}
  private readonly mutex = new Mutex();

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    //use cron only for the first cluster
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.CRON_WORKER === "true"
    ) {
      const release = await this.mutex.acquire();
      try {
        this.logger.debug("Called when the current time is every 10 minutes");
        await this.tradingDataService.fetchAndStoreUserWins();
      } finally {
        release();
      }
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCronAllUserWins() {
    //use cron only for the first cluster
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.CRON_WORKER === "true"
    ) {
      const release = await this.mutex.acquire();
      try {
        this.logger.debug("Called when the current time is every 10 minutes");
        await this.tradingDataService.fetchAndStoreAllUserWins();
      } finally {
        release();
      }
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleTradeCron() {
    //use cron only for the first cluster
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.CRON_WORKER === "true"
    ) {
      const release = await this.mutex.acquire();
      try {
        this.logger.debug(
          "Trading Activity Called when the current time is every 30 minutes",
        );
        await this.tradingDataService.fetchAndStoreTradeData();
      } finally {
        release();
      }
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleGeneralTradeCron() {
    //use cron only for the first cluster
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.CRON_WORKER === "true"
    ) {
      const release = await this.mutex.acquire();
      try {
        this.logger.debug(
          "General Trading Activity Called when the current time is every 10 minutes",
        );
        await this.tradingDataService.fetchAndStoreAllTradeData();
      } finally {
        release();
      }
    }
  }

  // cron update guild ranks every 2 mintes
  @Cron("0 */2 * * *")
  async handleUpdateGuildRanks() {
    //use cron only for the first cluster
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.CRON_WORKER === "true"
    ) {
      const release = await this.mutex.acquire();
      try {
        this.logger.debug("Called when the current time is every 10 minutes");
        await this.guildService.updateGuildRanks();
      } finally {
        release();
      }
    }
  }

  // cron to update user ranks every 2 minutes
  @Cron("0 */2 * * *")
  async handleUpdateUserRanks() {
    //use cron only for the first cluster
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.CRON_WORKER === "true"
    ) {
      const release = await this.mutex.acquire();
      try {
        this.logger.debug("Called when the current time is every 2 minutes");
        await this.userService.updateUserRanks();
      } finally {
        release();
      }
    }
  }
}
