-- CreateTable
CREATE TABLE `BingoGame` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('NEW', 'PLAYING', 'DONE') NOT NULL DEFAULT 'NEW',
    `telegramId` BIGINT NOT NULL,
    `messageId` INTEGER NOT NULL,
    `numbers` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
