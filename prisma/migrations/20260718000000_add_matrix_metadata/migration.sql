ALTER TABLE "Committee"
ADD COLUMN "portfolioTagLabel" TEXT,
ADD COLUMN "matrixBrief" TEXT;

ALTER TABLE "Portfolio"
ADD COLUMN "tag" TEXT,
ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
