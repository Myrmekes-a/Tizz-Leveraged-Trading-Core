-- AlterTable
ALTER TABLE `LastProcessedTimestamp` ADD COLUMN `timeStampUserWins` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `OverAllWins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `wins` INTEGER NOT NULL,
    `tradeCount` INTEGER NOT NULL,
    `volume` VARCHAR(256) NOT NULL,
    `pnl` VARCHAR(256) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_idx`(`user_id`),
    UNIQUE INDEX `OverAllWins_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OverAllWins` ADD CONSTRAINT `OverAllWins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
