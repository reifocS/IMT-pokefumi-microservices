import { MatchStatus, PrismaClient } from "@prisma/client";
import { isInDeck, beenPlayed, getStronger, getPokemonById } from "./utils";
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
  }).unless({ path: ["/ping", "/signup", "/login"] })
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

app.put("/match/join/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    const matchData = await prisma.match.findUnique({
      where: { id: Number(id) },
      include: {
        Invitation: true,
      },
    });
    if (!matchData) {
      return res.sendStatus(404);
    }
    if (user.id === matchData.owner_id) {
      throw new Error(
        "User is already the match owner, he can't join his own match as opponent."
      );
    }
    if (matchData.opponent_id != null) {
      throw new Error("Match is full.");
    }
    if (matchData.Invitation && matchData.Invitation.user_id !== user.id) {
      throw new Error("You are not invited to this match.");
    }
    const newMatch = await prisma.match.update({
      where: { id: Number(id) || undefined },
      data: {
        opponent_id: user.id,
        status: "started",
      },
    });
    if (matchData.Invitation) {
      await prisma.invitation.update({
        where: { id: matchData.Invitation.id },
        data: {
          ...matchData.Invitation,
          resolved: true,
        },
      });
    }
    res.json(newMatch);
  } catch (error: any) {
    console.error(error);
    res.json({ error: error.message });
  }
});

app.post(`/match`, async (req, res) => {
  const { opponentId, ownerDeckId, opponentDeckId, Invitation } = req.body;
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
        Invitation: {
          create: Invitation,
        },
      },
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/invitations", async (req, res) => {
  const user = (req as any).user;
  try {
    const invitations = await prisma.invitation.findMany({
      where: { user_id: user.id },
    });
    res.json(invitations);
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
      include: {
        Invitation: true,
        Round: true,
      },
      where: { id: Number(id) },
    });
    if (matchData == null) {
      return res.sendStatus(404);
    }
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

app.post("/match/:id/round", async (req, res) => {
  const { id } = req.params;

  try {
    const matchData = await prisma.match.findUnique({
      where: { id: Number(id) },
    });

    const { ownerPokeId, opponentPokeId } = req.body;

    const user = (req as any).user.id;

    if (matchData?.owner_id !== user && matchData?.opponent_id !== user) {
      throw new Error("Not a player from the match");
    }

    if (ownerPokeId && opponentPokeId) {
      const roundsData = await prisma.round.findMany({
        where: { match_id: Number(id) },
      });

      const turn = 1 + roundsData?.length;
      const newRound = await prisma.round.create({
        data: {
          Match: { connect: { id: matchData?.id } },
          owner_poke_id: ownerPokeId,
          opponent_poke_id: opponentPokeId,
          turn: turn,
        },
      });
      res.json(newRound);
    } else {
      throw new Error("At least two players are required");
    }
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/round", async (req, res) => {
  const { pokemonId1 } = req.params;
  const { pokemonId2 } = req.params;
  try {
    const pokemon1 = getPokemonById(pokemonId1);
    const pokemon2 = getPokemonById(pokemonId2);
    Promise.all([pokemon1, pokemon2]).then((pokemons) => {
      getStronger(pokemons[0], pokemons[1]).then((pokemon: Pokemon) => {
        res.json({ winner: pokemon.toString() });
      });
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.put("/round/:id", async (req, res) => {
  const { id } = req.params;
  const newRoundData = req.body;
  try {
    const roundData = await prisma.round.findUnique({
      where: { id: Number(id) },
    });
    if (roundData?.match_id !== newRoundData.match_id) {
      throw new Error("Round can not switch of match");
    }
    // if (winner && winner !== matchData?.owner_id && winner !== matchData?.opponent_id) {
    //     throw new Error("Winner does not belong to players")
    // }
    const newRound = await prisma.round.update({
      where: { id: Number(id) || undefined },
      data: newRoundData,
    });
    res.json(newRound);
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

app.listen(process.env.MATCH_API_PORT, () => {
  console.log(
    `🚀 Match server ready at: ${process.env.MATCH_API_BASE_URL}:${process.env.MATCH_API_PORT}`
  );
});
