-- CreateTable
CREATE TABLE "ImportPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partner" TEXT,
    "mapping" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportPreset_name_key" ON "ImportPreset"("name");
