/*
  Warnings:

  - Added the required column `pokeId` to the `Pokemon` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pokeId" INTEGER NOT NULL,
    "deckId" INTEGER,
    CONSTRAINT "Pokemon_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pokemon" ("deckId", "id") SELECT "deckId", "id" FROM "Pokemon";
DROP TABLE "Pokemon";
ALTER TABLE "new_Pokemon" RENAME TO "Pokemon";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
