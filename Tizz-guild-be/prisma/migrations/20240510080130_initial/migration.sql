-- CreateTable
CREATE TABLE `Users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `wallet_address` VARCHAR(191) NOT NULL,
    `ensName` VARCHAR(191) NULL,
    `signature` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `telegram` VARCHAR(191) NULL,
    `twitter` VARCHAR(191) NULL,
    `discord` VARCHAR(191) NULL,
    `github` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `pfp` VARCHAR(191) NULL,
    `is_suspended` BOOLEAN NOT NULL DEFAULT false,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Users_wallet_address_key`(`wallet_address`),
    UNIQUE INDEX `Users_ensName_key`(`ensName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminActionApproval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actionType` VARCHAR(191) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `initiatedBy` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `action_entity_status_idx`(`actionType`, `entityId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guilds` (
    `guild_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `telegram` VARCHAR(191) NULL,
    `twitter` VARCHAR(191) NULL,
    `discord` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `picture` VARCHAR(191) NULL,
    `owner_user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Guilds_name_key`(`name`),
    PRIMARY KEY (`guild_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildOwnershipTransfers` (
    `transfer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `guild_id` INTEGER NOT NULL,
    `old_owner_id` INTEGER NOT NULL,
    `new_owner_id` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responded_at` DATETIME(3) NULL,

    PRIMARY KEY (`transfer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildMembers` (
    `guild_member_id` INTEGER NOT NULL AUTO_INCREMENT,
    `guild_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `GuildMembers_guild_id_user_id_key`(`guild_id`, `user_id`),
    PRIMARY KEY (`guild_member_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildMembershipActions` (
    `action_id` INTEGER NOT NULL AUTO_INCREMENT,
    `guild_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `action_type` ENUM('REQUEST_TO_JOIN', 'INVITATION') NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL,
    `initiated_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `guild_user_action_status_idx`(`guild_id`, `user_id`, `action_type`, `status`),
    PRIMARY KEY (`action_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TradingRounds` (
    `round_id` INTEGER NOT NULL AUTO_INCREMENT,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`round_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserTradingActivity` (
    `activity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `round_id` INTEGER NOT NULL,
    `volume` DOUBLE NOT NULL,
    `pnl` DOUBLE NOT NULL,
    `points` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `leverage` DOUBLE NOT NULL,
    `collateralPriceUsd` DOUBLE NOT NULL,
    `pair` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `tradeID` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserTradingActivity_tradeID_key`(`tradeID`),
    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserWins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `round_id` INTEGER NOT NULL,
    `wins` INTEGER NOT NULL,
    `tradeCount` INTEGER NOT NULL,
    `pnl` DOUBLE NOT NULL,
    `volume` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_round_idx`(`user_id`, `round_id`),
    UNIQUE INDEX `UserWins_user_id_round_id_key`(`user_id`, `round_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `eventType` ENUM('USER', 'GUILD') NOT NULL DEFAULT 'USER',
    `categoryType` ENUM('Nectar', 'Pollen') NOT NULL DEFAULT 'Nectar',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserTaskParticipation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `taskId` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `pointsAwarded` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserTaskParticipation_userId_taskId_key`(`userId`, `taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuildTaskParticipation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guildId` INTEGER NOT NULL,
    `taskId` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `pointsAwarded` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `GuildTaskParticipation_guildId_taskId_key`(`guildId`, `taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Guilds` ADD CONSTRAINT `Guilds_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildOwnershipTransfers` ADD CONSTRAINT `GuildOwnershipTransfers_guild_id_fkey` FOREIGN KEY (`guild_id`) REFERENCES `Guilds`(`guild_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildOwnershipTransfers` ADD CONSTRAINT `GuildOwnershipTransfers_old_owner_id_fkey` FOREIGN KEY (`old_owner_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildOwnershipTransfers` ADD CONSTRAINT `GuildOwnershipTransfers_new_owner_id_fkey` FOREIGN KEY (`new_owner_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildMembers` ADD CONSTRAINT `GuildMembers_guild_id_fkey` FOREIGN KEY (`guild_id`) REFERENCES `Guilds`(`guild_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildMembers` ADD CONSTRAINT `GuildMembers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildMembershipActions` ADD CONSTRAINT `GuildMembershipActions_guild_id_fkey` FOREIGN KEY (`guild_id`) REFERENCES `Guilds`(`guild_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildMembershipActions` ADD CONSTRAINT `GuildMembershipActions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildMembershipActions` ADD CONSTRAINT `GuildMembershipActions_initiated_by_id_fkey` FOREIGN KEY (`initiated_by_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTradingActivity` ADD CONSTRAINT `UserTradingActivity_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTradingActivity` ADD CONSTRAINT `UserTradingActivity_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `TradingRounds`(`round_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWins` ADD CONSTRAINT `UserWins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWins` ADD CONSTRAINT `UserWins_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `TradingRounds`(`round_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTaskParticipation` ADD CONSTRAINT `UserTaskParticipation_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTaskParticipation` ADD CONSTRAINT `UserTaskParticipation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildTaskParticipation` ADD CONSTRAINT `GuildTaskParticipation_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuildTaskParticipation` ADD CONSTRAINT `GuildTaskParticipation_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guilds`(`guild_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
