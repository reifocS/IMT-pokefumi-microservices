import { PrismaClient, MatchStatus, Match, Round } from "@prisma/client";
import { getStronger, getPokemonById, getDeck } from "./utils";
import express from "express";
import bodyParser from "body-parser";
import { Pokemon } from "pokenode-ts";
import { Deck } from "./models/deck";
import * as dotenv from "dotenv";
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
  }).unless({ path: ["/ping"] })
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

app.get("/ping", async (req, res) => {
  res.json("Hello friend 👽 !");
});

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
      return res.status(400).send({
        message:
          "User is already the match owner, he can't join his own match as opponent.",
      });
    }
    if (matchData.opponent_id != null) {
      return res.status(400).send({
        message: "Match is full.",
      });
    }
    if (matchData.Invitation && matchData.Invitation.user_id !== user.id) {
      return res.status(403).send({
        message: "You are not invited to this match..",
      });
    }
    const newMatch = await prisma.match.update({
      where: { id: Number(id) || undefined },
      data: {
        opponent_id: user.id,
        status: MatchStatus.accepted,
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
  // const { opponentId, ownerDeckId, opponentDeckId, Invitation } = req.body;
  const { opponentId, Invitation } = req.body;
  const author = (req as any).user;
  try {
    const result = await prisma.match.create({
      data: {
        status: MatchStatus.pending,
        owner_id: author.id,
        opponent_id: opponentId,
        // owner_deck_id: ownerDeckId,
        // opponent_deck_id: opponentDeckId,
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

app.put(`/match/:id/selectDeck`, async (req, res) => {
  const { deckId } = req.body;
  const userId = (req as any).user.id;
  const { id } = req.params;
  try {
    const matchData = prisma.match.findUnique({
      where: { id: Number(id) },
    });
    const deck = getDeck(deckId, req.cookies.token);

    Promise.all([matchData, deck]).then(async ([matchData, deck]) => {
      if (matchData?.owner_id == null || matchData?.opponent_id == null) {
        throw new Error("Match data uncompleted");
      }
      if (matchData.owner_id !== userId && matchData.opponent_id !== userId) {
        throw new Error("Not a player from the match.");
      }
      if (deck?.authorId !== userId) {
        throw new Error("Not a deck from the player.");
      }

      const isOwner: boolean = matchData?.owner_id === userId;
      const prop = isOwner ? "owner_deck_id" : "opponent_deck_id";
      matchData[prop] = deck?.id;

      const result = await prisma.match.update({
        where: { id: Number(id) },
        data: matchData,
      });
      res.json(result);
    });
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

app.get("/matchs/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const matchs = await prisma.match.findMany({
      where: {
        OR: [
          {
            owner_id: {
              equals: Number(userId),
            },
          },
          {
            opponent_id: {
              equals: Number(userId),
            },
          },
        ],
      },
    });
    res.json(matchs);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/match/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  try {
    if (!user.admin) {
      return res.status(403).send("not admin");
    }
    await prisma.match.delete({
      where: { id: Number(id) },
    });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send(error);
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

/**
 * @link https://www.prisma.io/docs/guides/general-guides/database-workflows/foreign-keys/postgresql#6-validate-the-foreign-key-constraints-in-a-nodejs-script
 * @link https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-scalar-lists-arrays#adding-items-to-a-scalar-list
 * @returns the current state of the match
 */
app.post("/match/:id/round", async (req, res) => {
  const { id } = req.params;

  try {
    const matchData = await prisma.match.findUnique({
      where: { id: Number(id) },
    });

    if (matchData?.status === MatchStatus.finished) {
      throw new Error("As the match is finished, no more rounds are allowed");
    }

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

    let turn = 1;
    const roundsData = prisma.round.findMany({
      where: { match_id: Number(id) },
    });

    const deck0: Promise<Deck> = getDeck(
      matchData?.owner_deck_id,
      req.cookies.token
    );
    const deck1: Promise<Deck> = getDeck(
      matchData?.opponent_deck_id,
      req.cookies.token
    );

    await Promise.all([deck0, deck1, roundsData]).then(
      async ([deck0, deck1, roundsData]) => {
        turn += roundsData?.length;

        const minDeckSize = Math.min(
          deck0.pokemons?.length,
          deck1?.pokemons?.length
        );
        if (minDeckSize < 1) {
          throw new Error("At least one of the players has not created a deck");
        }
        if (minDeckSize < turn) {
          throw new Error(
            "At least one of the players has not enough cards in its deck to play the round"
          );
        }

        const pokemon0: Pokemon = deck0.pokemons[turn - 1];
        const pokemon1: Pokemon = deck1.pokemons[turn - 1];
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

        let newMatch: (Match & { Round: Round[] }) | undefined;
        if (minDeckSize === turn) {
          newMatch = await prisma.match.update({
            where: { id: Number(id) },
            data: {
              status: MatchStatus.finished,
              Round: {
                create: {
                  owner_poke_id: pokemon0.id,
                  opponent_poke_id: pokemon1.id,
                  turn: turn,
                  winner_id: winnerId,
                },
              },
            },
            include: { Round: true },
          });
        } else {
          if (turn < 2) {
            await prisma.match.update({
              where: { id: Number(id) },
              data: {
                status: MatchStatus.started,
                Round: {
                  create: {
                    owner_poke_id: pokemon0.id,
                    opponent_poke_id: pokemon1.id,
                    turn: turn,
                    winner_id: winnerId,
                  },
                },
              },
              include: { Round: true },
            });
          } else {
            await prisma.match.update({
              where: { id: Number(id) },
              data: {
                Round: {
                  create: {
                    owner_poke_id: pokemon0.id,
                    opponent_poke_id: pokemon1.id,
                    turn: turn,
                    winner_id: winnerId,
                  },
                },
              },
              include: { Round: true },
            });
          }
        }
        res.json(newMatch);
      }
    );
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

/**
 * which pokemonId is the best
 */
app.get("/stronger", async (req, res) => {
  try {
    if (req?.query?.pokemonId?.length !== 2) {
      throw new Error("Invalid number of pokemonId given");
    }
    const pokemonId1 = Number((req?.query?.pokemonId as any)[0]);
    const pokemonId2 = Number((req?.query?.pokemonId as any)[1]);
    const pokemon1 = getPokemonById(pokemonId1);
    const pokemon2 = getPokemonById(pokemonId2);

    await Promise.all([pokemon1, pokemon2]).then(
      async (pokemons: Pokemon[]) => {
        if (
          pokemons.length === 2 &&
          pokemons[0] !== undefined &&
          pokemons[1] !== undefined
        ) {
          const stronger = await getStronger(pokemons[0], pokemons[1]);
          res.json(stronger?.id);
        } else {
          throw new Error("Pokemon not found with the given id");
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.listen(process.env.MATCH_API_PORT, () => {
  console.log(
    `🪐 Match server ready at: ${process.env.MATCH_API_BASE_URL}:${process.env.MATCH_API_PORT}`
  );
});
