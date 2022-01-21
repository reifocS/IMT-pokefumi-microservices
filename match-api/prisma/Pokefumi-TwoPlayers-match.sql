DROP TABLE IF EXISTS "Match" CASCADE;
DROP TABLE IF EXISTS "Round" CASCADE;
DROP TYPE IF EXISTS "MatchStatus" CASCADE;
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'started', 'finished');
CREATE TABLE "Match" (
  "id" SERIAL PRIMARY KEY,
  "status" "MatchStatus",
  "owner_id" integer,
  "opponent_id" integer,
  "owner_deck_id" integer,
  "opponent_deck_id" integer
);
CREATE TABLE "Round" (
  "id" SERIAL PRIMARY KEY,
  "match_id" integer,
  "owner_poke_id" integer,
  "opponent_poke_id" integer,
  "winner_id" integer,
  "turn" int
);
ALTER TABLE "Round"
ADD FOREIGN KEY ("match_id") REFERENCES "Match" ("id");