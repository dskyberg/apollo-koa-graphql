import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser'
import helmet from 'koa-helmet';
import neo4j from 'neo4j-driver';
import {ApolloServer} from 'apollo-server-koa'
import {ApolloLogExtension} from 'apollo-log'

import schema from './schema/graphql_schema'

// Load env variables early
dotenv.config()
const {
  APOLLO_PORT = 9000,
  NEO4J_USER = 'neo4j',
  NEO4J_PWD = 'neo4j',
  NEO4J_URI = 'bolt://localhost:7687',
  NEO4J_ENCRYPTED=false,
  NEO4J_DATABASE='neo4j'
} = process.env;

/**
 * Standard Koa server setup
 */
const app = new Koa();
app.use(helmet());

/**
 * Apollo Server and Neo4J setup
 */
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PWD),
  {
    encrypted: process.env.NEO4J_ENCRYPTED ? 'ENCRYPTION_ON' : 'ENCRYPTION_OFF',
  }
)

// Set up a logger. This is very verbos, even in "info" mode.
const options = {
  level: "debug",
  timestamp: true,
  mutate: (level, data) => {
    if(data === undefined || data === null) {
      return data
    }
    if(data.action !== "response") {
      return data
    }
    console.log(JSON.stringify(data.data, null, 3))
    console.log(data)
    //console.log(data.queryType)
    return data
  }
 };

const extensions = [() => new ApolloLogExtension(options)];

// Apollo server
const server = new ApolloServer({
  context: async ({ ctx }) => {
    // get the user token from the headers
    const token = ctx.headers.authorization || '';
    console.log('Access Token:', token);
    let user = {};
    try {
      const response = await fetch('http://localhost:3082/me', {
        headers: {"authorization": `Bearer ${token}`}
      })
      user = await response.json();
      console.log('User:', user);
      //return { user};
      //const user = { id: 12345, username: token, roles: ['user', 'admin'] }

    } catch(error) {
      console.log(error);
    }
    return {
      user,
      driver,
      neo4jDatabase: process.env.NEO4J_DATABASE
    }
  },
  extensions,
  schema: schema,
  introspection: true,
  playground: true,
  bodyParser: true,
});

server.applyMiddleware({ app });
app.use(bodyParser());

(async () => {

  // For API functions that call Neo4j
  app.context.neo4j = driver

  app.listen(APOLLO_PORT, () => {
    console.log(`application is listening on port ${APOLLO_PORT}`);
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  if(driver) driver.close()
  console.error(err);
  process.exitCode = 1;
});
