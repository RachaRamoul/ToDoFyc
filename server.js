const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware pour analyser les JSON
app.use(bodyParser.json());

// Données en mémoire
let todos = [];
let users = [];
let projects = [];
let todoId = 1;
let userId = 1;
let projectId = 1;

// Routes REST pour To-Dos

// Récupérer toutes les tâches
app.get('/todos', (req, res) => {
    res.json(todos);
});

// Ajouter une nouvelle tâche
app.post('/todos', (req, res) => {
    const { title, userId, projectId } = req.body;
    if (!title || !userId || !projectId) {
        return res.status(400).json({ error: "Title, userId, and projectId are required" });
    }

    const newTodo = {
        id: todoId++,
        title,
        completed: false,
        userId,
        projectId
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// Routes REST pour les utilisateurs

// Récupérer tous les utilisateurs
app.get('/users', (req, res) => {
    res.json(users);
});

// Ajouter un nouvel utilisateur
app.post('/users', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    const newUser = {
        id: userId++,
        name
    };
    users.push(newUser);
    res.status(201).json(newUser);
});

// Routes REST pour les projets

// Récupérer tous les projets
app.get('/projects', (req, res) => {
    res.json(projects);
});

// Ajouter un nouveau projet avec un utilisateur propriétaire
app.post('/projects', (req, res) => {
    const { name, userId } = req.body;
    if (!name || !userId) {
        return res.status(400).json({ error: "Name and userId are required" });
    }

    // Vérifiez si l'utilisateur existe
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const newProject = {
        id: projectId++,
        name,
        userId
    };
    projects.push(newProject);
    res.status(201).json(newProject);
});

// Scénario REST : Récupérer les tâches d’un utilisateur avec ses projets associés

app.get('/user/:id/todos-with-projects', (req, res) => {
    const userId = parseInt(req.params.id);

    // Vérifiez si l'utilisateur existe
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    // Récupérez les projets de l'utilisateur
    const userProjects = projects.filter(project => project.userId === userId);

    // Récupérez les tâches de l'utilisateur
    const userTodos = todos.filter(todo => todo.userId === userId);

    // Ajoutez les noms des projets aux tâches
    const todosWithProjects = userTodos.map(todo => {
        const project = userProjects.find(p => p.id === todo.projectId);
        return {
            todoId: todo.id,
            todoTitle: todo.title,
            completed: todo.completed,
            projectId: project ? project.id : null,
            projectName: project ? project.name : null
        };
    });

    res.json({
        user,
        projects: userProjects,
        todos: todosWithProjects
    });
});

// Lancer le serveur
app.listen(port, () => {
    console.log(`To-Do List app listening at http://localhost:${port}`);
});
