//import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser'
import helmet from 'koa-helmet';
import neo4j from 'neo4j-driver';
import {ApolloServer} from 'apollo-server-koa'
import {ApolloLogExtension} from 'apollo-log'

import schema from './schema/graphql_schema'



/**
 *
 * @param {string} val Value is expected from process.env, but can be any string
 * @returns true if val === [TRUE | true | 1], else false
 */
const booleanEnv = (val) => val !== undefined && (val === '1' || val.toUpperCase() === 'TRUE') ? true : false

/**
 * The .env file is processed by 'nodemon -r dotenv/config so that code is more
 * deployment friendly.  If you want to change to using dotenv.config
 * directly, remove the -r option from the start script in package.json.
 * Note: the .env file is watched. If you want to change the file name, or stop
 * watching, update nodemon.json accordingly.
 */
const APOLLO_PORT = process.env.APOLLO_PORT
const NEO4J_USER = process.env.NEO4J_USER
const NEO4J_PWD = process.env.NEO4J_PWD
const NEO4J_URI = process.env.NEO4J_URI
const NEO4J_ENCRYPTED = booleanEnv(process.env.NEO4J_ENCRYPTED)

console.log('APOLLO_PORT',APOLLO_PORT)
console.log('NEO4J_USER', NEO4J_USER)
console.log('NEO4J_PWD',NEO4J_PWD)
console.log('NEO4J_URI',NEO4J_URI)
console.log('NEO4J_ENCRYPTED',NEO4J_ENCRYPTED)

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
    encrypted: NEO4J_ENCRYPTED ? 'ENCRYPTION_ON' : 'ENCRYPTION_OFF',
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
