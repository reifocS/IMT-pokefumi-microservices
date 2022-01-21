import { Prisma, PrismaClient, MatchStatus } from '@prisma/client'
import express from 'express'
import bodyParser from "body-parser";

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');


const prisma = new PrismaClient()
const app = express()
const SECRET = "keyboard cat"
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json())
app.use(cookieParser());
app.use(
    expressJwt({
        secret: SECRET,
        algorithms: ['HS256'],
        getToken: (req: any) => req.cookies.token
    }).unless({ path: ['/ping', '/signup', '/login'] })
);

app.use((err: { name: string; status: any; message: any; }, req: any, res: any, next: () => void) => {
    if (err.name === 'UnauthorizedError') {
        res.status(err.status).send({ message: err.message });
        console.log("Auth middleware", "Auth error");
        return;
    }
    next();
});

app.post(`/match`, async (req, res) => {
    const { owner, opponent, ownerDeck, opponentDeck } = req.body;
    const status: MatchStatus = "pending";
    try {
        const result = await prisma.match.create({
            data: {
                status: status,
                owner_id: owner,
                opponent_id: opponent,
                owner_deck_id: ownerDeck,
                opponent_deck_id: opponentDeck
            }
        });
        res.json(result);
    } catch (error) {
        console.log(error)
        res.json({ error: error })
    }
})

app.put('/match/:id', async (req, res) => {
    const { id } = req.params
    const { newMatchData } = req.body
    try {
        const matchData = await prisma.match.findUnique({
            where: { id: Number(id) }
        })
        if (matchData?.owner_id !== newMatchData.owner_id && matchData?.opponent_id !== newMatchData.opponent_id) {
            throw new Error("Players can not be updated")
        }
        const newMatch = await prisma.match.update({
            where: { id: Number(id) || undefined },
            data: newMatchData
        });
        res.json(newMatch);
    } catch (error) {
        console.log(error)
        res.json({ error: error })
    }
})

app.get('/matchs', async (req, res) => {
    try {
        const matchs = await prisma.match.findMany()
        res.json(matchs)
    } catch (error) {
        console.log(error)
        res.json({ error: error })
    }
})

app.get('/match/:id', async (req, res) => {
    const { id } = req.params
    try {
        const matchData = await prisma.match.findUnique({
            where: { id: Number(id) }
        })
        res.json(matchData)
    } catch (error) {
        console.log(error)
        res.json({ error: error })
    }
})


app.get('/match/:id/rounds', async (req, res) => {
    const { id } = req.params
    try {
        const roundsData = await prisma.round.findMany({
            where: { match_id: Number(id) }
        })
        res.json(roundsData)
    } catch (error) {
        console.log(error)
        res.json({ error: error })
    }

})

app.post(`/match/:id/round`, async (req, res) => {
    const { id } = req.params
    try {
        const matchData = await prisma.match.findUnique({
            where: { id: Number(id) }
        });
        const { ownerPoke, opponentPoke } = req.body;

        const roundsData = await prisma.round.findMany({
            where: { match_id: Number(id) }
        })

        if (ownerPoke && opponentPoke) {
            const turn = 1 + roundsData?.length;
            const newRound = await prisma.round.create({
                data: {
                    Match: { connect: { id: matchData?.id } },
                    owner_poke_id: ownerPoke,
                    opponent_poke_id: opponentPoke,
                    turn: turn
                },
            })
            res.json(newRound)
        } else {
            throw new Error("At least two players are required")
        }
    } catch (error) {
        console.log(error)
        res.json({ error: error })
    }

    const owner = ((req as any).owner.id);
    const opponent = ((req as any).opponent.id);
    const ownerDeck = ((req as any).ownerDeck.id);
    const opponentDeck = ((req as any).opponentDeck.id);
    const status: MatchStatus = "pending";
    const result = await prisma.match.create({
        data: {
            status: status,
            owner_id: owner,
            opponent_id: opponent,
            owner_deck_id: ownerDeck,
            opponent_deck_id: opponentDeck
        }
    });
})

app.put('/round/:id', async (req, res) => {
    const { id } = req.params
    const { newRoundData } = req.body
    try {
        const roundData = await prisma.round.findUnique({
            where: { id: Number(id) }
        })
        if (roundData?.match_id !== newRoundData.match_id) {
            throw new Error("Round can not switch of match")
        }
        // if (winner && winner !== matchData?.owner_id && winner !== matchData?.opponent_id) {
        //     throw new Error("Winner does not belong to players")
        // }
        const newRound = await prisma.round.update({
            where: { id: Number(id) || undefined },
            data: newRoundData
        });
        res.json(newRound);
    } catch (error) {
        console.log(error)
        res.json({ error: error })
    }
})

app.get('/round/:id', async (req, res) => {
    const { id } = req.params
    const roundData = await prisma.round.findUnique({
        where: { id: Number(id) }
    })
    res.json(roundData)
})

const server = app.listen(3100, () =>
    console.log(`
🚀 Server ready at: http://localhost:3100
⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`),
)
