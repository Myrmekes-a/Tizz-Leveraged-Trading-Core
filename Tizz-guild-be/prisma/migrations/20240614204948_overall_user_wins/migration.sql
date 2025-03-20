/*
  Warnings:

  - You are about to drop the `OverAllWins` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `OverAllWins` DROP FOREIGN KEY `OverAllWins_user_id_fkey`;

-- DropTable
DROP TABLE `OverAllWins`;

-- CreateTable
CREATE TABLE `UserOverAllWins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `wins` INTEGER NOT NULL,
    `tradeCount` INTEGER NOT NULL,
    `volume` VARCHAR(256) NOT NULL,
    `pnl` VARCHAR(256) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_idx`(`user_id`),
    UNIQUE INDEX `UserOverAllWins_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserOverAllWins` ADD CONSTRAINT `UserOverAllWins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
