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

/**Llamar a los otros archivos que contienen la lógica del servidor */
require('./partidasOnline')(io, dbAdmin);

require('./foros')(io, dbAdmin);

app.use(express.static(path.join(__dirname, 'public')));

/**Para que el servidor tome las rutas del cliente y pueda funcionar correctamente las rutas */
app.get(/^\/(?!api\/|socket\.io\/).*/, (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
