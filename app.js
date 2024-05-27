const express = require('express');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const cors = require('cors');
const { entities } = require('./models');
const your_secret_key = 'FAF-211'

const app = express();
const port = 4000;

// Enable CORS to allow requests from the frontend
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Serve Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define a route handler for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the backend server!');
});

// Middleware to verify JWT token and extract permissions/role
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, your_secret_key, (err, decoded) => {
    console.log(err);
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.permissions = decoded.permissions;
    req.role = decoded.role;
    console.log(req);
    next();
  });
};

// Get a list of entities with pagination
app.get('/entities', verifyToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedEntities = entities.slice(startIndex, endIndex);
  res.json(paginatedEntities);
});

// Create a new entity
app.post('/entities', verifyToken, (req, res) => {
  if (!req.permissions.includes('WRITE')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const newEntity = req.body;
  entities.push(newEntity);
  res.status(201).json(newEntity);
});

// Update an existing entity
app.put('/entities/:id', verifyToken, (req, res) => {
  if (!req.permissions.includes('WRITE')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const entityId = parseInt(req.params.id);
  const updatedEntity = req.body;
  const index = entities.findIndex((entity) => entity.id === entityId);
  if (index === -1) {
    res.status(404).json({ error: 'Entity not found' });
  } else {
    entities[index] = { ...entities[index], ...updatedEntity };
    res.json(entities[index]);
  }
});

// Delete an entity
app.delete('/entities/:id', verifyToken, (req, res) => {
  if (!req.permissions.includes('WRITE')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const entityId = parseInt(req.params.id);
  const index = entities.findIndex((entity) => entity.id === entityId);
  if (index === -1) {
    res.status(404).json({ error: 'Entity not found' });
  } else {
    const deletedEntity = entities.splice(index, 1)[0];
    res.json(deletedEntity);
  }
});

// Generate a JWT token
app.post('/token', (req, res) => {
  const { permissions, role } = req.body;
  const token = jwt.sign({ permissions, role }, your_secret_key, {
    expiresIn: '10m',
  });
  res.json({ token });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});