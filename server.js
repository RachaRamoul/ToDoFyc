const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Protobuf
const PROTO_PATH = './todo.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const todoProto = grpc.loadPackageDefinition(packageDefinition).todo;

let users = [];
let projects = [];
let todos = [];
let userId = 1;
let projectId = 1;
let todoId = 1;

// Variables pour calcul des temps de traitement
let totalProcessingTimeMs = 0;
let requestCount = 0;

function calculateAverageTime() {
    return (totalProcessingTimeMs / requestCount).toFixed(2);
}

// Service implementation
const todoService = {
    AddUser: (call, callback) => {
        const start = process.hrtime();
        const { name } = call.request;
        const newUser = { id: userId++, name };
        users.push(newUser);
        const [seconds, nanoseconds] = process.hrtime(start);

        const elapsedTimeMs = seconds * 1e3 + nanoseconds / 1e6;
        totalProcessingTimeMs += elapsedTimeMs;
        requestCount++;

        callback(null, { user: newUser });
    },
    AddProject: (call, callback) => {
        const start = process.hrtime();
        const { name, userId } = call.request;
        const user = users.find(u => u.id === userId);
        if (!user) return callback(new Error('User not found'));

        const newProject = { id: projectId++, name, userId };
        projects.push(newProject);
        const [seconds, nanoseconds] = process.hrtime(start);

        const elapsedTimeMs = seconds * 1e3 + nanoseconds / 1e6;
        totalProcessingTimeMs += elapsedTimeMs;
        requestCount++;

        callback(null, { project: newProject });
    },
    AddTodo: (call, callback) => {
        const start = process.hrtime();
        const { title, userId, projectId } = call.request;
        const user = users.find(u => u.id === userId);
        const project = projects.find(p => p.id === projectId);

        if (!user) return callback(new Error('User not found'));
        if (!project) return callback(new Error('Project not found'));

        const newTodo = { id: todoId++, title, completed: false, userId, projectId };
        todos.push(newTodo);
        const [seconds, nanoseconds] = process.hrtime(start);

        const elapsedTimeMs = seconds * 1e3 + nanoseconds / 1e6;
        totalProcessingTimeMs += elapsedTimeMs;
        requestCount++;

        callback(null, { todo: newTodo });
    },
    GetTodosByUser: (call) => {
        const start = process.hrtime();
        const { userId } = call.request;
        todos
            .filter(todo => todo.userId === userId)
            .forEach(todo => call.write(todo));
        call.end();
        const [seconds, nanoseconds] = process.hrtime(start);

        const elapsedTimeMs = seconds * 1e3 + nanoseconds / 1e6;
        totalProcessingTimeMs += elapsedTimeMs;
        requestCount++;
    },
};

// Server setup
const server = new grpc.Server();
server.addService(todoProto.TodoService.service, todoService);

const PORT = '0.0.0.0:50051';
server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`gRPC server running at ${PORT}`);
    server.start();

    // Affichage toutes les 10 secondes des statistiques
    setInterval(() => {
        if (requestCount > 0) {
            console.log(`Temps de traitement moyen (ms): ${calculateAverageTime()}`);
            console.log(`Nombre total de requêtes: ${requestCount}`);
        }
    }, 10000);
});
