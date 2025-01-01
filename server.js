const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();
const port = 3000;

// Données en mémoire
let todos = [];
let users = [];
let projects = [];
let todoId = 1;
let userId = 1;
let projectId = 1;

// GraphQL Schema
const schema = buildSchema(`
    type User {
        id: ID!
        name: String!
        projects: [Project!]
        todos: [Todo!]
    }

    type Project {
        id: ID!
        name: String!
        user: User!
        todos: [Todo!]
    }
    
    type Todo {
        id: ID!
        title: String!
        completed: Boolean!
        user: User!
        project: Project!
    }

    type Query {
        users: [User!]
        projects: [Project!]
        todos: [Todo!]
        user(id: ID!): User
        project(id: ID!): Project
        todo(id: ID!): Todo
    }

    input AddUserInput {
        name: String!
    }

    input AddProjectInput {
        name: String!
        userId: ID!
    }

    input AddTodoInput {
        title: String!
        userId: ID!
        projectId: ID!
    }

    type Mutation {
        addUser(input: AddUserInput!): User!
        addProject(input: AddProjectInput!): Project!
        addTodo(input: AddTodoInput!): Todo!
    }
`);

// Resolvers
const root = {
    // Query Resolvers
    users: () => users,
    projects: () => projects,
    todos: () => todos,
    user: ({ id }) => users.find(user => user.id === parseInt(id)),
    project: ({ id }) => projects.find(project => project.id === parseInt(id)),
    todo: ({ id }) => todos.find(todo => todo.id === parseInt(id)),

    // Mutation Resolvers
    addUser: ({ input }) => {
        const newUser = { id: userId++, name: input.name };
        users.push(newUser);
        return newUser;
    },
    
    addProject: ({ input }) => {
        const user = users.find(u => u.id === parseInt(input.userId));
        if (!user) throw new Error("User not found");
    
        const newProject = { id: projectId++, name: input.name, userId: user.id };
        projects.push(newProject);
    
        // Return the project object along with its associated user
        return {
            ...newProject,
            user
        };
    },
    
    addTodo: ({ input }) => {
        const user = users.find(u => u.id === parseInt(input.userId));
        const project = projects.find(p => p.id === parseInt(input.projectId));
    
        if (!user) throw new Error("User not found");
        if (!project) throw new Error("Project not found");
    
        const newTodo = {
            id: todoId++,
            title: input.title,
            completed: false,
            userId: user.id,
            projectId: project.id
        };
        todos.push(newTodo);
    
        // Return the todo object with associated user and project resolved
        return {
            ...newTodo,
            user,
            project
        };
    },
    
};

// Middleware for GraphQL
app.use(
    '/graphql',
    graphqlHTTP({
        schema,
        rootValue: root,
        graphiql: true // Enables GraphiQL interface
    })
);

// Lancer le serveur
app.listen(port, () => {
    console.log(`GraphQL API listening at http://localhost:${port}/graphql`);
});
