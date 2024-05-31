const express = require('express');
const http = require('http');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const path = require("path");
const socketIo = require('socket.io');
const Server  = require("socket.io").Server;


const app = express();
const server = http.createServer(app);
const io = new Server(server , {
  cors:{
      origin:"*"
  }
})
const PORT = process.env.PORT || 5000;


const BUILD_DIR = path.join(__dirname, '..', 'build');

// Middleware
app.use(express.static(BUILD_DIR));
app.use(express.json());
app.use(cors());

// MongoDB Data API configuration
const apiKey = process.env.API_KEY;
const clusterName = 'Cluster0'; // Your MongoDB cluster name
const databaseName = 'test'; // Your MongoDB database name
const collectionName = 'secrets'; // Your MongoDB collection name
io.on('connection', (socket) => {
  console.log('Socket Client Connected');
});

app.get('/api/secrets', async (req, res) => {
  try {
    const response = await axios.post(
      process.env.find, // Assuming this is the correct environment variable name
      {
        collection: collectionName,
        database: databaseName,
        dataSource: clusterName,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
      }
    );
    const data = response.data;
    res.json(data['documents']);
  } catch (error) {
    console.error('Error fetching secrets:', error.response ? error.response.data : error.message);
    res.status(500).send('Error fetching secrets');
  }
});

app.post('/api/secrets', async (req, res) => {
  const { name, secret } = req.body;

  try {
    await axios.post(
      process.env.insertOne, // Assuming this is the correct environment variable name
      {
        collection: collectionName,
        database: databaseName,
        dataSource: clusterName,
        document: { name, secret },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
      }
    );

    // Notify clients using Socket.IO
    io.emit('newSecret', 'New secret added');

    res.status(201).send('Secret added');
  } catch (error) {
    console.error('Error inserting data:', error.response ? error.response.data : error.message);
    res.status(500).send('Error inserting data');
  }
});

// Serve React App
app.get('/*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'), (err) => {
    if (err) {
      res.status(500).send(err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
