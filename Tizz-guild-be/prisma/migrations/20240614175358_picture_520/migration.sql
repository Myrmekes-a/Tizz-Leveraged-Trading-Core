/*
  Warnings:

  - You are about to alter the column `website` on the `Guilds` table. The data in that column could be lost. The data in that column will be cast from `VarChar(520)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `Guilds` MODIFY `website` VARCHAR(191) NULL,
    MODIFY `picture` VARCHAR(520) NULL;
