/**
 * This module establishes test data in the graph.  There are 4 key components:
 * Projects
 * Categories
 * Items
 * Users
 */
import dotenv from 'dotenv';
import process from 'process';
import neo4j from 'neo4j-driver';

// Projects
const PROJECTS = [
    {
        name: "Project 1",
        description: "Project 1 description",
    }
]

const CATEGORIES = [
    {
        "order": 1,
        "name": "Project 1",
        "title": "Queue",
        "titleBackgroundColor": "#ffcdd2",
        "backgroundColor": "#ffebee"
    },
    {
        "order": 2,
        "name": "Project 1",
        "title": "Working",
        "titleBackgroundColor": "#e1bee7",
        "backgroundColor": "#f3e5f5"
    },
    {
        "order": 3,
        "name": "Project 1",
        "title": "Blocked",
        "titleBackgroundColor": "#d1c4e9",
        "backgroundColor": "#ede7f6"
    },
    {
        "order": 4,
        "name": "Project 1",
        "title": "Done",
        "titleBackgroundColor": "#b2dfdb",
        "backgroundColor": "#e0f2f1"
    }
]

const USERS = [
    {
        "displayname": "John Smith",
        "email": "john.smith@gmail.com",
        "username": "johnsmith"
    },
    {
        "displayname": "David Skyberg",
        "email": "david.skyberg@gmail.com",
        "username": "davidskyberg"
    },
    {
        "displayname": "Lila Gardner",
        "email": "lila.gardner@gmail.com",
        "username": "lilagardner"
    },
]

const ITEMS = [
    {
        "summary": "Go Shopping",
        "description": "Remember to go to the store for groceries",
        "category": "Queue",
        "order": 1
    },
    {
        "summary": "Do the work!",
        "description": "Don't give up on your dream.  Dig in and do the work.",
        "category": "Queue",
        "order": 2
    },
    {
        "summary": "Call the landscaper",
        "description": "Time for the seasonal grass treatment.",
        "category": "Queue",
        "order": 3
    },

    {
        "summary": "Read the book",
        "description": "Get that special book read",
        "category": "Working",
        "order": 1
    },
    {
        "summary": "Pick up bread",
        "description": null,
        "category": "Working",
        "order": 2
    },
    {
        "summary": "Mow the yard",
        "description": "Item 3 description",
        "category": "Working",
        "order": 3
    },
    {
        "summary": "Develop a cool patent",
        "description": "Item 4 description",
        "category": "Working",
        "order": 4
    },
    {
        "summary": "Maximize your return",
        "description": "Item 5 description",
        "category": "Working",
        "order": 5
    },

    {
        "summary": "Give a high five",
        "description": "Item 1 description",
        "category": "Blocked",
        "order": 1
    },
    {
        "summary": "Automate a process",
        "description": "Item 2 description",
        "category": "Blocked",
        "order": 2
    },

    {
        "summary": "Turn a corner",
        "description": "Item 1 description",
        "category": "Done",
        "order": 1
    },
]


// Load env variables early
dotenv.config()
const {
  PORT = 9000,
  NEO4J_USER = 'neo4j',
  NEO4J_PWD = 'neo4j',
  NEO4J_URI = 'bolt://localhost:7687',
  NEO4J_ENCRYPTED=false,
  NEO4J_DATABASE='neo4j'
} = process.env;

const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PWD),
    {
        encrypted: process.env.NEO4J_ENCRYPTED ? 'ENCRYPTION_ON' : 'ENCRYPTION_OFF',
    }
)

/**
 * The following Cypher statements are used in the initialize function.
 */
const CONSTRAINTS = [
    {name: 'category_title_constraint', statement: 'CREATE CONSTRAINT category_title_constraint ON (c:Category) ASSERT c.title IS UNIQUE'},
    {name: 'project_name_constraint', statement: 'CREATE CONSTRAINT project_name_constraint ON (p:Project) ASSERT p.name IS UNIQUE'},
    {name: 'user_username_constraint', statement: 'CREATE CONSTRAINT user_username_constraint ON (u:User) ASSERT u.username IS UNIQUE'}
];

const CREATE_PROJECT = "CREATE (project:Project { name: $name, description: $description }) RETURN project.name AS name, id(project) as id"
const CREATE_CATEGORY = "MATCH (p:Project {name: $name}) CREATE (p)<-[:CATEGORY_OF]-(c:Category {title:$title, order:toInteger($order), titleBackgroundColor:$titleBackgroundColor, backgroundColor:$backgroundColor}) RETURN c.title as title"
const CREATE_USER = "MATCH (project:Project) CREATE (project)<-[:MEMBER_OF]-(user:User { username: $username, displayname: $displayname, email: $email }) RETURN user.displayName as name, id(user) as id"
const CREATE_ITEM = "MATCH (project:Project)<-[:CATEGORY_OF]-(category:Category {title:$category}) CREATE (category)<-[:MEMBER_OF]-(item:Item { summary: $summary, description: $description, order:toInteger($order) }) RETURN item.summary as name, id(item) as id, category.title as category"

const initialize = async () => {
    let session
    const response = {error:null, properties: null}

    try{

        session = driver.session()

        console.log('DELETE EVERYTHING')
        await session.run('MATCH (i) DETACH DELETE i')
        console.log('\tDatabase is now empty')

        console.log('REMOVE INDEXES AND CONSTRAINTS')
        await session.run('CALL apoc.schema.assert({},{},true) YIELD label, key RETURN *')
        console.log('\tAll indexes and constraints are removed')

        console.log('CONSTRAINTS')
        for(let i=0; i < CONSTRAINTS.length; i++) {
            const result = await session.run(CONSTRAINTS[i].statement)
            console.log(`\t${CONSTRAINTS[i].name}`)
        }

        console.log('PROJECTS')
        for(let i=0; i < PROJECTS.length; i++) {
               const result = await session.run(CREATE_PROJECT,PROJECTS[i])
               console.log(`\t${result.records[0].get('name')} - ${result.records[0].get('id')}`)
        }

        console.log('CATEGORIES')
        for(let i=0; i < CATEGORIES.length; i++) {
            const result = await session.run(CREATE_CATEGORY,CATEGORIES[i])
            console.log(`\t${result.records[0].get('title')}`)
     }

        console.log('USERS')
        for(let i=0; i < USERS.length; i++) {
               const result = await session.run(CREATE_USER,USERS[i])
               //console.log(`\t${result.get('name')} ${result.get('id')}`)
               console.log(`\t${result.records[0].get('name')} - ${result.records[0].get('id')}`)
        }
        console.log('ITEMS')
        for(let i=0; i < ITEMS.length; i++) {
               const result = await session.run(CREATE_ITEM,ITEMS[i])
               //console.log(`\t${result.get('name')} ${result.get('id')}`)
               console.log(`\t${result.records[0].get('name')} - ${result.records[0].get('category')} - ${result.records[0].get('id')}`)
        }

    } catch(err) {
        console.log('initialize error:', err)
        response.error = err
    }
    finally {
        if(session !== undefined) {
            await session.close()
        }
    }
}

initialize()
.then(() => {
    console.log('Done!! ')
    process.exitCode = 0
    process.exit(0)
})
.catch(error => {
    console.log('what happened!:', error)
    process.exit(1)
})
