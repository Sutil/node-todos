const express = require('express');
const cors = require('cors');
const { v4: uuidv4} = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

/**
 * Middleware that checks if user exists.
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 * @returns 
 */
function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if(!user) {
    return response.status(404).json({ error: "User not found."})
  }

  request.user = user;

  return next();

}

/**
 * Create user
 */
app.post('/users', (request, response) => {
  const { username, name } = request.body;

  const userAlreadyExists = users.some(user => user.username === username);

  if(userAlreadyExists) {
    return response.status(400).json({error: "User already exists."});
  }

  const user = {
    id: uuidv4(),
    username,
    name,
    todos: []
  }

  users.push(user);

  return response.status(201).json(user);
});

/**
 * Get a list of todos of user
 */
app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

/**
 * Get a todo of user by todo id.
 */
app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const {id} = request.params;
  const { title, deadline } = request.body;
  
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo) {
    return response.status(404).json({ error: "Todo not found."});
  }

  todo.deadline =  new Date(deadline);
  todo.title = title;

  return response.json(todo);
});

/**
 * Mark a todo as done.
 */
app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const {id} = request.params;
  
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo) {
    return response.status(404).json({ error: "Todo not found."});
  }

  todo.done = true;
  return response.json(todo);

});

/**
 * Delete a todo from list.
 */
app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const idx = user.todos.findIndex(t => t.id === id);

  if (idx > -1) {
    user.todos.splice(idx, 1);
    return response.status(204).send();
  }

  response.status(404).json({error: 'Todo not found.'});

});

module.exports = app;