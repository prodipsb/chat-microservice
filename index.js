const express = require('express');
const http =  require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config(); 
const mongoose = require('./config/database');

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);


app.get('/', (req, res) => res.send('Chat microservice running'));

const { getIO, initIO } = require('./utils/socket');
initIO(server);
// getIO();

const PORT = process.env.PORT || 8000;
server.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});
