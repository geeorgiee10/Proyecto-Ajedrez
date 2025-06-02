const { dbAdmin } = require('./firebaseAdmin');

const express = require('express');
const path = require('path');
const port = process.env.PORT || 2908;
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const cors = require('cors');
const { Chess } = require('chess.js');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  },
  addTrailingSlash: false
});

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, '../Client/AjedrezClient/index.html'));
});


require('./partidasOnline')(io, dbAdmin);

require('./foros')(io, dbAdmin);

server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
