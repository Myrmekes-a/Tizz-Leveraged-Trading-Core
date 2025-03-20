-- CreateTable
CREATE TABLE `UserGeneralTradingActivity` (
    `activity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `volume` DOUBLE NOT NULL,
    `pnl` DOUBLE NOT NULL,
    `points` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `leverage` DOUBLE NOT NULL,
    `pair` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `tradeID` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserGeneralTradingActivity_tradeID_key`(`tradeID`),
    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LastProcessedTimestamp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserGeneralTradingActivity` ADD CONSTRAINT `UserGeneralTradingActivity_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
