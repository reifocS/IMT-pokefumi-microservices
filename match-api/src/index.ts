import { PrismaClient, MatchStatus } from "@prisma/client";
import { getStronger, getPokemonById, getPokemonsFromDeck } from "./utils";
import express from "express";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import { Pokemon } from "pokenode-ts";
dotenv.config();

const cookieParser = require("cookie-parser");
const expressJwt = require("express-jwt");

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(
  expressJwt({
    secret: process.env.SECRET,
    algorithms: ["HS256"],
    getToken: (req: any) => req.cookies.token,
  })
);

app.use(
  (
    err: { name: string; status: any; message: any },
    req: any,
    res: any,
    next: () => void
  ) => {
    if (err.name === "UnauthorizedError") {
      res.status(err.status).send({ message: err.message });
      console.log("Auth middleware", "Auth error");
      return;
    }
    next();
  }
);

app.post(`/match`, async (req, res) => {
  const { opponentId, ownerDeckId, opponentDeckId } = req.body;
  const author = (req as any).user;
  const status: MatchStatus = "pending";
  try {
    const result = await prisma.match.create({
      data: {
        status: status,
        owner_id: author.id,
        opponent_id: opponentId,
        owner_deck_id: ownerDeckId,
        opponent_deck_id: opponentDeckId,
      },
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.put("/match/:id", async (req, res) => {
  const { id } = req.params;
  const { newMatchData } = req.body;
  try {
    const matchData = await prisma.match.findUnique({
      where: { id: Number(id) },
    });
    if (
      newMatchData?.owner_id &&
      matchData?.owner_id !== newMatchData.owner_id
    ) {
      throw new Error("Players can not be updated");
    }
    const newMatch = await prisma.match.update({
      where: { id: Number(id) || undefined },
      data: newMatchData,
    });
    res.json(newMatch);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/matchs", async (req, res) => {
  try {
    const matchs = await prisma.match.findMany();
    res.json(matchs);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/match/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const matchData = await prisma.match.findUnique({
      where: { id: Number(id) },
    });
    res.json(matchData);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/match/:id/rounds", async (req, res) => {
  const { id } = req.params;
  try {
    const roundsData = await prisma.round.findMany({
      where: { match_id: Number(id) },
    });
    res.json(roundsData);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.post("/match/:id/rounds", async (req, res) => {
  const { id } = req.params;

  try {
    const matchData = await prisma.match.findUnique({
      where: { id: Number(id) },
    });

    if (matchData?.owner_id == null || matchData?.opponent_id == null) {
      throw new Error("At least two players are required");
    }

    const user = (req as any).user.id;
    if (matchData?.owner_id !== user && matchData?.opponent_id !== user) {
      throw new Error("Not a player from the match");
    }

    if (
      matchData?.owner_deck_id == null ||
      matchData?.opponent_deck_id == null
    ) {
      throw new Error("At least one of the players has not created a deck");
    }

    // TODO : is it better to ask to the Round table from match ? or to all Rounds ? orm ?
    let turn = 1;
    const roundsData = prisma.round.findMany({
      where: { match_id: Number(id) },
    });

    const pokemons0 = getPokemonsFromDeck(
      matchData?.owner_deck_id,
      req.cookies.token
    );
    const pokemons1 = getPokemonsFromDeck(
      matchData?.opponent_deck_id,
      req.cookies.token
    );

    Promise.all([roundsData, pokemons0, pokemons1]).then(async (results) => {
      turn += results[0]?.length;
      if (Math.min(results[0]?.length, results[1]?.length) < turn) {
        throw new Error(
          "At least one of the players has not enough cards in its deck to play the round"
        );
      }

      const pokemon0 = results[1][turn - 1];
      const pokemon1 = results[2][turn - 1];
      const winner = await getStronger(pokemon0, pokemon1);
      let winnerId: number | null = null;
      if (winner !== undefined) {
        if (winner.id === pokemon0.id) {
          winnerId = matchData!.owner_id;
        }
        if (winner.id === pokemon1.id) {
          winnerId = matchData!.opponent_id;
        }
      }

      const newRound = await prisma.round.create({
        data: {
          Match: { connect: { id: matchData?.id } },
          owner_poke_id: pokemon0.id,
          opponent_poke_id: pokemon1.id,
          turn: turn,
          winner_id: winnerId,
        },
      });
      res.json(newRound);
      // redundancy ?
      const newMatchData = matchData?.Round.push(newRound);
      prisma.match.update({
        where: { id: Number(id) || undefined },
        data: newMatchData,
      });
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/round/:id", async (req, res) => {
  const { id } = req.params;
  const roundData = await prisma.round.findUnique({
    where: { id: Number(id) },
  });
  res.json(roundData);
});

app.get("/stronger", async (req, res) => {
  try {
    const { pokemonId1, pokemonId2 } = req.body;
    const pokemon1 = getPokemonById(pokemonId1);
    const pokemon2 = getPokemonById(pokemonId2);
    Promise.all([pokemon1, pokemon2]).then((pokemons: Pokemon[]) => {
      if (
        pokemons.length === 2 &&
        pokemons[0] !== undefined &&
        pokemons[1] !== undefined
      ) {
        getStronger(pokemons[0]!, pokemons[1]!).then(
          (pokemon: Pokemon | undefined) => {
            res.json({ winner: pokemon?.toString() });
          }
        );
      } else {
        throw new Error("Pokemon not found with the given id");
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.listen(process.env.MATCH_API_PORT, () => {
  console.log(
    `🚀 Match server ready at: ${process.env.MATCH_API_BASE_URL}:${process.env.MATCH_API_PORT}`
  );
});
