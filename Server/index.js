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

const partidas = {}; // { roomId: { chess, players } }
const jugadoresDeSala = {};

io.on('connection', (socket) => {
  let roomId;
  let color;
  let userId = null;

  console.log(`Nuevo usuario conectado: ${socket.id}`);

  socket.on('unirsePartida', ({ userId: id }) => {
    userId = id || socket.id;
    console.log(`Jugador con ID ${userId || socket.id} se ha unido`);

    // Buscar partida con espacio
    let room = Object.keys(partidas).find(id => partidas[id].players.length < 2);

    if (!room) {
      room = socket.id;
      partidas[room] = {
        players: [],
        chess: new Chess(),
        estado: '',
        clocks: { w: 300, b: 300 },
        captured: []
      };
    }

    roomId = room;
    const partida = partidas[roomId]; 

    color = partida.players.length === 0 ? 'w' : 'b';
    partida.players.push({ id: userId || socket.id, color });

    socket.join(roomId);
    socket.emit('colorAsignado', color);

    if (partida.players.length === 2) {
        io.to(roomId).emit('partidaIniciada');
        estadoPartidaSocket(roomId); 

        iniciarCronometro(roomId);
    }
  });

  socket.on('mover', ({ from, to }) => {
    const partida = partidas[roomId];
    if (!partida) {
        return
    };

    const chess = partida.chess;
    const movimiento = chess.move({ from, to, promotion: 'q' });

    if (movimiento) {
        if(movimiento.captured){
            partida.captured.push({ piece: movimiento.captured, color: movimiento.color === 'w' ? 'b' : 'w'});
        }
      estadoPartidaSocket(roomId);
    }
  });

  socket.on('abandonarPartida', ({userId}) => {
        if (!roomId || !partidas[roomId]) {
            return;
        }

        const partida = partidas[roomId];
        const oponente =partida.players.find(p => p.id !== userId);


        if(oponente){
            const turno = partida.chess.turn();

            io.to(roomId).emit('estadoPartida', {
                fen: partida.chess.fen(),
                turno,
                estado: 'El oponente ha abandonado. Has ganado',
                capturadas: partida.captured,
                cronometro: partida.clocks
            });
        }

        clearInterval(partida.interval);
        delete partidas[roomId];

  });

  socket.on('disconnect', () => {
    if (!roomId || !partidas[roomId]) {
      return;
    }

    const partida = partidas[roomId];
    const oponente =partida.players.find(p => p.id !== userId);

    if(oponente){
        const turno = partida.chess.turn();

        io.to(roomId).emit('estadoPartida', {
            fen: partida.chess.fen(),
            turno,
            estado: 'El oponente ha abandonado. Has ganado',
            capturadas: partida.captured,
            cronometro: partida.clocks
        });
    }

    clearInterval(partida.interval);
    delete partidas[roomId];

  });

  function estadoPartidaSocket(roomId) {
    const partida = partidas[roomId];
    const estado = obtenerEstado(partida.chess);

    io.to(roomId).emit('estadoPartida', {
      fen: partida.chess.fen(),
      turno: partida.chess.turn(),
      estado,
      capturadas: partida.captured,
      cronometro: partida.clocks
    });
  }

  function obtenerEstado(chess) {
    if (chess.isCheckmate()) {
      return `¡Jaque mate! Ganan las piezas ${chess.turn() === 'w' ? 'negras' : 'blancas'}`;
    }
    if (chess.isStalemate()) {
        return '¡Empate por falta de movimientos!';
    }
    if (chess.isDraw()) {
        return 'La partida ha quedado en tablas!';
    }
    if (chess.isCheck()) {
        return  `Jaque a las piezas ${chess.turn() === 'w' ? 'blancas' : 'negras'}`;
    }
    return '';
  }

  function iniciarCronometro(roomId){
    partidas[roomId].interval = setInterval(() => {
        const partida = partidas[roomId];
        const turno = partida.chess.turn();

        partida.clocks[turno]--;

        if(partida.clocks[turno] <=0){
            clearInterval(partida.interval);
            const ganador = turno === 'w' ? 'negras' : 'blancas';
            io.to(roomId).emit('estadoPartida', {
                fen: partida.chess.fen(),
                turno,
                estado: `Se ha acabado el tiempo. Han ganado las piezas ${ganador}`,
                capturadas: partida.captured,
                cronometro: partida.clocks
            });
        }
        else{
            estadoPartidaSocket(roomId);
        }
    }, 1000);
  }
});

server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
