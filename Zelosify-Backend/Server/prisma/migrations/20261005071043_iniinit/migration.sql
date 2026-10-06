-- CreateTable
CREATE TABLE "Opening" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "contractType" TEXT,
    "hiringManagerId" TEXT NOT NULL,
    "experienceMin" INTEGER NOT NULL,
    "experienceMax" INTEGER,

    CONSTRAINT "Opening_pkey" PRIMARY KEY ("id")
);
