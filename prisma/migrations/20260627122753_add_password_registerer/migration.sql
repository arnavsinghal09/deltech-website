-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'REGISTERER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;
