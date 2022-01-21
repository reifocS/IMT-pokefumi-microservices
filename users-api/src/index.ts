import {Prisma, PrismaClient} from '@prisma/client'
import express from 'express'
import bodyParser from "body-parser";
import axios from "axios"

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');


const prisma = new PrismaClient()
const app = express()
const SECRET = "keyboard cat"
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.json())
app.use(cookieParser());
app.use(
    expressJwt({
        secret: SECRET,
        algorithms: ['HS256'],
        getToken: (req: any) => req.cookies.token
    }).unless({path: ['/ping', '/signup', '/login']})
);

app.use((err: { name: string; status: any; message: any; }, req: any, res: any, next: () => void) => {
    if (err.name === 'UnauthorizedError') {
        res.status(err.status).send({message: err.message});
        console.log("Auth middleware", "Auth error");
        return;
    }
    next();
});

app.get('/pokemon/:id', async (req, res) => {
    const {data} = await axios.get("https://pokeapi.co/api/v2/pokemon/" + req.params.id);
    res.json(data);
})

app.post(`/signup`, async (req, res) => {
    const {username, password} = req.body
    const result = await prisma.user.create({
        data: {
            username,
            password,
            victory: 0,
            defeat: 0,
            decks: {
                create: []
            }
        },
    })
    res.json(result)
})

app.post(`/login`, async (req, res) => {
    const {username, password} = req.body
    const users = await prisma.user.findMany({
        where: {
            username: {
                equals: username,
            },
            password: {
                equals: password, // Default mode
            },
        },
    })
    if (users.length > 0) {
        const user = users[0];
        const token: any = jwt.sign(
            {
                id: user.id,
                username: user.username,
            },
            SECRET,
            {expiresIn: '24h'}
        );
        res.cookie('token', token, {httpOnly: true});
        user.password = '';
        res.json(user);
    }
})

app.post(`/deck`, async (req, res) => {
    const {pokemons} = req.body;
    const author = ((req as any).user.id)
    const pokeData = pokemons?.map((poke: Prisma.PokemonCreateInput) => {
        return {pokeId: poke.pokeId}
    })
    const result = await prisma.deck.create({
        data: {
            author: {connect: {id: author}},
            pokemons: {
                create: pokeData
            }
        },
    })
    res.json(result)
})

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany({
        include: {
            decks: {
                include: {
                    pokemons: true,
                },
            },
        }
    })
    const usersWithoutPassword = users.map((u) => {
        const {password, ...userWithoutPassword} = u;
        return userWithoutPassword;
    })
    res.json(usersWithoutPassword)
})

app.get('/decks', async (req, res) => {
    const decks = await prisma.deck.findMany({
        include: {
            pokemons: true
        }
    })
    res.json(decks)
})


app.get('/pokemons', async (req, res) => {
    const pokemons = await prisma.pokemon.findMany({})
    res.json(pokemons)
})

app.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.json({message: "logged out"});
})

app.put('/deck/:id', async (req, res) => {
    const {id} = req.params
    const user = ((req as any).user);
    const {pokemons} = req.body
    const pokeData: any = pokemons?.map((poke: Prisma.PokemonUpdateInput) => {
        return {pokeId: poke.pokeId}
    })
    try {
        const deckData = await prisma.deck.findUnique({
            where: {id: Number(id)}
        })

        if (deckData?.authorId !== user.id) {
            throw new Error("Deck is private")
        }

        await prisma.deck.update({
                where: {id: Number(id) || undefined},
                data: {
                    pokemons: {
                        set: []
                    }
                }
            }
        )

        const newDeck = await prisma.deck.update({
            where: {id: Number(id) || undefined},
            data: {
                pokemons: {
                    create: pokeData
                }
            },
        })
        res.json(newDeck)
    } catch
        (error) {
        console.log(error)
        res.json({error: error})
    }
})
/*
app.put('/post/:id/views', async (req, res) => {
    const {id} = req.params

    try {
        const post = await prisma.post.update({
            where: {id: Number(id)},
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        })

        res.json(post)
    } catch (error) {
        res.json({error: `Post with ID ${id} does not exist in the database`})
    }
})
*/
/*
app.put('/publish/:id', async (req, res) => {
    const {id} = req.params

    try {
        const postData = await prisma.post.findUnique({
            where: {id: Number(id)},
            select: {
                published: true,
            },
        })

        const updatedPost = await prisma.post.update({
            where: {id: Number(id) || undefined},
            data: {published: !postData?.published},
        })
        res.json(updatedPost)
    } catch (error) {
        res.json({error: `Post with ID ${id} does not exist in the database`})
    }
})

app.delete(`/post/:id`, async (req, res) => {
    const {id} = req.params
    const post = await prisma.post.delete({
        where: {
            id: Number(id),
        },
    })
    res.json(post)
})


app.get('/user/:id/drafts', async (req, res) => {
    const {id} = req.params

    const drafts = await prisma.user
        .findUnique({
            where: {
                id: Number(id),
            },
        })
        .posts({
            where: {published: false},
        })

    res.json(drafts)
})

app.get(`/post/:id`, async (req, res) => {
    const {id}: { id?: string } = req.params

    const post = await prisma.post.findUnique({
        where: {id: Number(id)},
    })
    res.json(post)
})

app.get('/feed', async (req, res) => {
    const {searchString, skip, take, orderBy} = req.query

    const or: Prisma.PostWhereInput = searchString
        ? {
            OR: [
                {title: {contains: searchString as string}},
                {content: {contains: searchString as string}},
            ],
        }
        : {}

    const posts = await prisma.post.findMany({
        where: {
            published: true,
            ...or,
        },
        include: {author: true},
        take: Number(take) || undefined,
        skip: Number(skip) || undefined,
        orderBy: {
            updatedAt: orderBy as Prisma.SortOrder,
        },
    })

    res.json(posts)
})
*/
const server = app.listen(3000, () =>
    console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`),
);
