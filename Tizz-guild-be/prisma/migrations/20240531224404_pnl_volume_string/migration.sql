/*
  Warnings:

  - You are about to alter the column `volume` on the `UserGeneralTradingActivity` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(256)`.
  - You are about to alter the column `pnl` on the `UserGeneralTradingActivity` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(256)`.
  - You are about to alter the column `volume` on the `UserTradingActivity` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(256)`.
  - You are about to alter the column `pnl` on the `UserTradingActivity` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(256)`.
  - You are about to alter the column `pnl` on the `UserWins` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(256)`.
  - You are about to alter the column `volume` on the `UserWins` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE `UserGeneralTradingActivity` MODIFY `volume` VARCHAR(256) NOT NULL,
    MODIFY `pnl` VARCHAR(256) NOT NULL;

-- AlterTable
ALTER TABLE `UserTradingActivity` MODIFY `volume` VARCHAR(256) NOT NULL,
    MODIFY `pnl` VARCHAR(256) NOT NULL;

-- AlterTable
ALTER TABLE `UserWins` MODIFY `pnl` VARCHAR(256) NOT NULL,
    MODIFY `volume` VARCHAR(256) NOT NULL;
