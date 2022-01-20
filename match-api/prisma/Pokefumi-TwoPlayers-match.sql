DROP TABLE IF EXISTS MATCH CASCADE;
DROP TABLE IF EXISTS MROUND CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
CREATE TYPE "match_status" AS ENUM ('pending', 'started', 'finished');
CREATE TABLE "MATCH" (
  "id" SERIAL PRIMARY KEY,
  "status" match_status,
  "owner_id" integer,
  "opponent_id" integer,
  "owner_deck_id" integer,
  "opponent_deck_id" integer
);
CREATE TABLE "MROUND" (
  "id" SERIAL PRIMARY KEY,
  "match_id" integer,
  "owner_poke_id" integer,
  "opponent_poke_id" integer,
  "winner_id" integer,
  "turn" int
);
ALTER TABLE "MROUND"
ADD FOREIGN KEY ("match_id") REFERENCES "MATCH" ("id");