-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "tipperName" TEXT,
    "tipperEmail" TEXT,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "flutterwaveTxRef" TEXT NOT NULL,
    "flutterwaveTxId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" DATETIME,
    "verificationSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tip" ("amount", "createdAt", "creatorId", "flutterwaveTxId", "flutterwaveTxRef", "id", "message", "status", "tipperEmail", "tipperName") SELECT "amount", "createdAt", "creatorId", "flutterwaveTxId", "flutterwaveTxRef", "id", "message", "status", "tipperEmail", "tipperName" FROM "Tip";
DROP TABLE "Tip";
ALTER TABLE "new_Tip" RENAME TO "Tip";
CREATE UNIQUE INDEX "Tip_flutterwaveTxRef_key" ON "Tip"("flutterwaveTxRef");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
