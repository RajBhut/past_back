/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "accessId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "accesstocken" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT DEFAULT '',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'javascript',
ADD COLUMN     "linkId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT DEFAULT '',
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
