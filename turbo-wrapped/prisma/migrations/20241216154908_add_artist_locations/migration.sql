-- CreateTable
CREATE TABLE "ArtistLocation" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistLocation_artistId_key" ON "ArtistLocation"("artistId");

-- CreateIndex
CREATE INDEX "ArtistLocation_artistName_idx" ON "ArtistLocation"("artistName");
