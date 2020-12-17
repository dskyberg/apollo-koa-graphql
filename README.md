# Apollo Server for Graphql on Koa
This is a drop dead simple example to enable rapidly setting up an Apollo Server
for experimenting with GraphQL. There are two key components:

* Neo4J:  Community edition of Neo4J, running in Docker.  the only setup needed
is to create the local folders for data and logs.  The rest is managed in
[docker-compose.yml](docker-compose.yml).

* Apollo Server: Running in Koa.  Only because I wanted to play with setting it
up.  But you can easily punt this and run ApolloServer natively (uses Express)
or set up your own Express server.  Everything associated with getting Koa set
up and running is in [index.js](index.js).

## Neo4j
In order to run the Neo4j Docker image, all you need to do is ensure the
data and logs folders are available and then run docker!  I have added a cheezy
script in [package.json](package.json) called `neo4j:cleanup`.  Use this to
ensure the right folders are set up for volume mapping.  It will also remove any
residual docker container betwen runs.  The container runs on the standard
Neo4J ports:  7474 and 7687

````bash
npm run neo4j:cleanup
docker-compose up
````

## Apollo Server
Apollo run within a very minimal Koa server.  Nothing fancy.  There are two key
components:

* Koa Server: All configuration for the Koa server is found either in [index.js](index.js)
directly, or in [.env](.env).  Take a look at both before making changes

* GraphQL Schema:  The schema for GraphQL is contained in [schema.graphql](schema/schema.graphql).
Everything is right there.  No resolvers have been coded.  You get what you get
with standard Apollo Server, and that's it.

# Building and Running
After downloading this repo, there isn't much left to do do.

### Complete the Node install

Download this repo and install the dependencies
````bash
$ git clone https://github.com/dskyberg/apollo-koa-graphql.git
...
$ cd apollo-koa-graphql
$ npm i
````
### Create a .env file
Open a file in the root apollo-koa-graphql folder called `.env` and add the following.
Then change what you want.
````code
APOLLO_PORT=9000
NEO4J_URI="bolt://localhost:7687"
NEO4J_PWD="letmein"
APOLLO_PORT = 9000,
NEO4J_USER = 'neo4j',
NEO4J_PWD = 'neo4j',
````

### Setup the mount points
````bash
$ npm run neo4j:cleanup
````
### Run the Neo4j database
Note, I set this up so that I get console logging.  So I do it in a separate
terminal window/tab.  If you don't want the output, just add -d to the following
command.
````bash
$ docker-compose up
````
### Load the initial database configuration
This step creates a bunch of test data in the database to play with that matches
the schema.

````bash
$ npm run init-db
````

### Run the Apollo Server
The server builds and runs with bable-node.  So, you'll see logging output, and
file changes will cause the server to restart.  The server runs on port 9000 by
default. But you can change that in [.env](.env)

Download this repository
````bash
$ git clone https://github.com/dskyberg/apollo-koa-graphql.git
````

Install the node components
````bash
$ cd apollo-koa-graphql
$ npm install
````

Run Neo4J in a Docker container and initialize with the demo data.
````bash
$ docker-compose up -d
$ npm run init-db
````

Run this server
````bash
$ npm start
````
The server should be running
You now have a running GraphQL server!

Note, to modify the default data, edit [initialize.js](./schema/iitialize.js) and re-run
````bash
$ npm run init-db
````
# Suggestions

## Browse with Neo4J Browser
Browse to http://localhost:7474/browser.  You can run Cypher queries
directly from there.

## Browse with GraphiQl
Apollo Server ships with the graphiql browser.  You can browse in your web browser
to http://localhost:9000/graphql and run queries from there.

