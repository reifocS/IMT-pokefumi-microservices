/*
  Warnings:

  - A unique constraint covering the columns `[deckId,pokeId]` on the table `Pokemon` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_deckId_pokeId_key" ON "Pokemon"("deckId", "pokeId");
