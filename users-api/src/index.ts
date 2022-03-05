import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const prisma = new PrismaClient();

const POKE_API = "https://pokeapi.co/api/v2/pokemon/";
const USERS_URL = process.env.PROXY_UPSTREAM
  ? `${process.env.PROXY_UPSTREAM}:${process.env.PROXY_PORT}${process.env.PROXY_PATH_USERS}`
  : `${process.env.USERS_API_BASE_URL}:${process.env.USERS_API_PORT}`;

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

app.get("/ping", async (req, res) => {
  res.json("Hello friend 👨 ! My address is the following : " + USERS_URL);
});

app.get("/pokemon/:id", async (req, res) => {
  const { data } = await axios.get(POKE_API + req.params.id);
  res.json(data);
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  // const admin = !!req.body.admin;
  try {
    const result = await prisma.user.create({
      data: {
        username,
        password,
        victory: 0,
        defeat: 0,
        decks: {
          create: [],
        },
      },
    });
    res.json(result);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        res
          .status(409)
          .send(
            "There is a unique constraint violation, a new user cannot be created with this username"
          );
      }
    }
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          equals: username,
        },
        password: {
          equals: password, // Default mode
        },
      },
    });
    if (users.length > 0) {
      const user = users[0];
      const token: any = jwt.sign(
        {
          id: user.id,
          username: user.username,
        },
        process.env.SECRET,
        { expiresIn: "24h" }
      );
      res.cookie("token", token, { httpOnly: true });
      user.password = "";
      res.json(user);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    res.sendStatus(400);
  }
});

/**
 * 
{
  "user": {
    "id": 4
  },
  "pokemons": [
    {
      "pokeId": 3
    },
    {
      "pokeId": 5
    }]
}
 */
app.post("/deck", async (req, res) => {
  const author = (req as any).user.id;
  try {
    const { pokemons } = req.body;

    if (pokemons.length === undefined || pokemons?.length < 1) {
      throw new Error("There are not enough pokemons in the decks");
    }

    if (pokemons?.length > 10) {
      throw new Error("There are too many pokemons in the decks");
    }

    // eslint-disable-next-line prefer-const
    let seen = new Set();
    const hasDuplicates = pokemons?.some((pokemon: { pokeId: unknown }) => {
      return seen.size === seen.add(pokemon.pokeId).size;
    });
    if (hasDuplicates) {
      throw new Error(
        "Whenever a player has played a pokemon, he can not reuse it. By this way, pokemons from deck should be unique"
      );
    }

    const pokeData = pokemons?.map((poke: Prisma.PokemonCreateInput) => {
      return { pokeId: poke.pokeId };
    });
    const result = await prisma.deck.create({
      data: {
        author: { connect: { id: author } },
        pokemons: {
          create: pokeData,
        },
      },
    });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      decks: {
        include: {
          pokemons: true,
        },
      },
    },
  });
  const usersWithoutPassword = users.map(
    (u: { [x: string]: any; password: any }) => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    }
  );
  res.json(usersWithoutPassword);
});

app.get("/decks", async (req, res) => {
  const decks = await prisma.deck.findMany({
    include: {
      pokemons: true,
    },
  });
  res.json(decks);
});

app.get("/decks/:userId", async (req, res) => {
  const { userId } = req.params;
  const decks = await prisma.deck.findMany({
    where: {
      authorId: {
        equals: Number(userId),
      },
    },
    include: {
      pokemons: true,
    },
  });
  res.json(decks);
});

app.get("/deck/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const deckData = await prisma.deck.findUnique({
      where: { id: Number(id) },
    });

    // TODO : why are decks private here ? whereas we can use get:/decks ?
    if (deckData?.authorId !== user.id) {
      throw new Error("Deck is private");
    }
    res.json(deckData);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.delete("/user/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  if (!id) {
    return res.status(400).send("id is missing");
  }
  if (!user.admin) {
    return res.status(403).send("not admin");
  }
  try {
    await prisma.user.delete({
      where: {
        id: Number(id),
      },
    });
    res.sendStatus(204);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.put("/deck/:id", async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { pokemons } = req.body;
  const pokeData: any = pokemons?.map((poke: Prisma.PokemonUpdateInput) => {
    return { pokeId: poke.pokeId };
  });
  try {
    const deckData = await prisma.deck.findUnique({
      where: { id: Number(id) },
    });

    if (deckData?.authorId !== user.id) {
      throw new Error("Deck is private");
    }

    await prisma.deck.update({
      where: { id: Number(id) || undefined },
      data: {
        pokemons: {
          set: [],
        },
      },
    });

    const newDeck = await prisma.deck.update({
      where: { id: Number(id) || undefined },
      data: {
        pokemons: {
          create: pokeData,
        },
      },
    });
    res.json(newDeck);
  } catch (error) {
    console.log(error);
    res.json({ error: error });
  }
});

app.get("/pokemons", async (req, res) => {
  const pokemons = await prisma.pokemon.findMany({});
  res.json(pokemons);
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "logged out" });
});

app.listen(process.env.USERS_API_PORT, () => {
  console.log(
    `🚀 User server ready at: ${process.env.USERS_API_BASE_URL}:${process.env.USERS_API_PORT}`
  );
});
