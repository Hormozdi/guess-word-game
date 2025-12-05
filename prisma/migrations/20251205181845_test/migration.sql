/*
  Warnings:

  - You are about to alter the column `status` on the `GuessWordGame` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(0))`.
  - You are about to alter the column `telegramId` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `GuessWordGame` MODIFY `status` ENUM('NEW', 'PLAYING', 'DONE') NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE `User` MODIFY `telegramId` INTEGER NOT NULL;
