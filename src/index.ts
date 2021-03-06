import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import "reflect-metadata";
import redis from 'redis';
import session from 'express-session';
import connectRedis from "connect-redis";
import cors from 'cors';

import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';

import "./db/mongoose";
import { COOKIE_NAME, __prod__ } from './constants';
import { MyContext } from './types';

const main = async () => {
    const app = express();

    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()

    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }))

    app.use(
    session({
        name: COOKIE_NAME,
        store: new RedisStore({ 
            client: redisClient,
            disableTouch: true
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
            httpOnly: true,
            secure: __prod__ // cookie only works in https 
        },
        saveUninitialized: false,
        secret: 'qwdasdawasdasdqweq',
        resave: false,
    })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }): MyContext => ({ req, res })
    });

    apolloServer.applyMiddleware({ app, cors: false })

    app.listen(4000, () => {
        console.log('server started on localhost:4000')
    })
}

main().catch((error) => {
    console.log(error)
})