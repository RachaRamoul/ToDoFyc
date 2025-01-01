const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the protobuf
const PROTO_PATH = './todo.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const todoProto = grpc.loadPackageDefinition(packageDefinition).todo;

// In-memory data
let users = [];
let projects = [];
let todos = [];
let userId = 1;
let projectId = 1;
let todoId = 1;

// Service implementation
const todoService = {
    AddUser: (call, callback) => {
        const { name } = call.request;
        const newUser = { id: userId++, name };
        users.push(newUser);
        callback(null, { user: newUser });
    },
    AddProject: (call, callback) => {
        const { name, userId } = call.request;
        const user = users.find(u => u.id === userId);
        if (!user) return callback(new Error('User not found'));

        const newProject = { id: projectId++, name, userId };
        projects.push(newProject);
        callback(null, { project: newProject });
    },
    AddTodo: (call, callback) => {
        const { title, userId, projectId } = call.request;
        const user = users.find(u => u.id === userId);
        const project = projects.find(p => p.id === projectId);

        if (!user) return callback(new Error('User not found'));
        if (!project) return callback(new Error('Project not found'));

        const newTodo = { id: todoId++, title, completed: false, userId, projectId };
        todos.push(newTodo);
        callback(null, { todo: newTodo });
    },
    GetUsers: (call) => {
        users.forEach(user => call.write(user));
        call.end();
    },
    GetProjects: (call) => {
        projects.forEach(project => call.write(project));
        call.end();
    },
    GetTodos: (call) => {
        todos.forEach(todo => call.write(todo));
        call.end();
    },
    GetTodosByUser: (call) => {
        const { userId } = call.request;
        todos
            .filter(todo => todo.userId === userId)
            .forEach(todo => call.write(todo));
        call.end();
    },
};

// Start the server
const server = new grpc.Server();
server.addService(todoProto.TodoService.service, todoService);

const PORT = '0.0.0.0:50051';
server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`gRPC server running at ${PORT}`);
    server.start();
});
