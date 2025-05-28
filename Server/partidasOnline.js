const { Chess } = require('chess.js');

const partidas = {}; // { roomId: { chess, players } }

module.exports = function(io, dbAdmin) {

    io.on('connection', (socket) => {
  let roomId;
  let color;
  let userId = null;

  console.log(`Nuevo usuario conectado: ${socket.id}`);
  
  socket.on('unirsePartida', async  ({ userId: id }) => {
    userId = id || socket.id;

    let nombre_email;
    let avatar;

    try {
      const consulta = await dbAdmin.collection('usurios').where('usuarioID', '==', userId).get();
              

      if (!consulta.empty) {
        const userDoc = consulta.docs[0]; 
        const userData = userDoc.data();
        nombre_email = userData.nombre_email || 'Jugador';
        avatar = userData.avatar || 'https://via.placeholder.com/100';

        const logrosSnap = await dbAdmin.collection('logrosCompletados').where('usuarioID', '==', userId).get();

        estilos = logrosSnap.docs.map(doc => doc.data().logroID);

      }
    } catch (error) {
      console.error('Error al obtener datos de usuario:', error);
    }

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
    partida.players.push({ id: userId || socket.id, color, nombre_email, avatar, estilos });

    socket.join(roomId);
    socket.emit('colorAsignado', color);

    io.to(roomId).emit('jugadoresActualizados', partida.players);


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

  socket.on('abandonarPartida', async ({userId}) => {

    
        if (!roomId || !partidas[roomId]) {
            return;
        }

        const partida = partidas[roomId];

        if (partida.actualizado) {
          return;
        }

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

            const jugadores = {
              blanco: partida.players.find(p => p.color === 'w')?.id,
              negro: partida.players.find(p => p.color === 'b')?.id
            }

            const ganadorUserId = oponente.id;
            const movimientos = partida.chess.history();

            const duracion = 600 - (partida.clocks.w + partida.clocks.b);
            partida.actualizado = true;

            console.log('Antes de guardar: movimientos:', partida.chess.history());
console.log('Movimientos', movimientos);
console.log('roomId:', roomId);

            await guardarPartida({ jugadores, duracion, ganador: ganadorUserId, movimientos });

            await actualizarUsuarios(ganadorUserId, jugadores);

            
            
        }

        

        clearInterval(partida.interval);
        delete partidas[roomId];
        socket.disconnect(true);

  });

  socket.on('enviarMensaje', (mensaje) => {
    if(!roomId) {
        return;
    }

    const partida = partidas[roomId];
    const jugador = partida.players.find(player => player.id === userId);

    const mensajeUsuario = {
        texto: mensaje,
        jugador: jugador ? jugador.nombre_email : 'Anónimo',
        avatar: jugador ? jugador.avatar : 'https://via.placeholder.com/30',
    };

    io.to(roomId).emit('nuevoMensaje', mensajeUsuario);
  })

  socket.on('disconnect', async () => {
    if (!roomId || !partidas[roomId]) {
      return;
    }

    const partida = partidas[roomId];

    if(partida.actualizado){
      clearInterval(partida.interval);
      delete partidas[roomId];
      return;
    }

    socket.userId = userId;

    const oponente =partida.players.find(p => p.id !== socket.userId);

    if(oponente){
        const turno = partida.chess.turn();

        io.to(roomId).emit('estadoPartida', {
            fen: partida.chess.fen(),
            turno,
            estado: 'El oponente ha abandonado. Has ganado',
            capturadas: partida.captured,
            cronometro: partida.clocks
        });

        const jugadores = {
            blanco: partida.players.find(p => p.color === 'w')?.id,
            negro: partida.players.find(p => p.color === 'b')?.id
        }

        const ganadorUserId = oponente.id;
        const movimientos = partida.chess.history();
        const duracion = 600 - (partida.clocks.w + partida.clocks.b);

        await guardarPartida({ jugadores, duracion, ganador: ganadorUserId, movimientos });

        await actualizarUsuarios(ganadorUserId, jugadores);

        partida.actualizado = true;
    }

    clearInterval(partida.interval);
    delete partidas[roomId];

  });

  async function estadoPartidaSocket(roomId) {
    const partida = partidas[roomId];
    const estado = obtenerEstado(partida.chess);

    io.to(roomId).emit('estadoPartida', {
      fen: partida.chess.fen(),
      turno: partida.chess.turn(),
      estado,
      capturadas: partida.captured,
      cronometro: partida.clocks
    });

    if(partida.chess.isGameOver()){
      clearInterval(partida.interval);

      if (!partida.actualizado) {

        const ganadorColor = partida.chess.turn() === 'w' ? 'b' : 'w';
        const ganadorUserId = partida.players.find(p => p.color === ganadorColor)?.id || null;

        const jugadores = {
            blanco: partida.players.find(p => p.color === 'w')?.id,
            negro: partida.players.find(p => p.color === 'b')?.id
        }

        const movimientos = partida.chess.history();
              console.log('Movimientos para guardar en estadoPartidaSocket:', movimientos);


        const duracion = 600 - (partida.clocks.w + partida.clocks.b);

        await guardarPartida({jugadores, duracion, ganador: ganadorUserId, movimientos});

        await actualizarUsuarios(ganadorUserId, jugadores);

        partida.actualizado = true;
      }
    }
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
    partidas[roomId].interval = setInterval(async () => {
        const partida = partidas[roomId];
        const turno = partida.chess.turn();

        partida.clocks[turno]--;

        if(partida.clocks[turno] <=0){
            clearInterval(partida.interval);
            const ganador = turno === 'w' ? 'negras' : 'blancas';
            const ganadorColor = turno === 'w' ? 'b' : 'w';
            const ganadorUserId = partida.players.find(p => p.color === ganadorColor)?.id || null;

            io.to(roomId).emit('estadoPartida', {
                fen: partida.chess.fen(),
                turno,
                estado: `Se ha acabado el tiempo. Han ganado las piezas ${ganador}`,
                capturadas: partida.captured,
                cronometro: partida.clocks
            });

            const jugadores = {
              blanco: partida.players.find(p => p.color === 'w')?.id,
              negro: partida.players.find(p => p.color === 'b')?.id
            }

            const movimientos = partida.chess.history();
            const duracion = 600 - (partida.clocks.w + partida.clocks.b);

            await guardarPartida({ jugadores, duracion, ganador: ganadorUserId, movimientos });

            await actualizarUsuarios(ganadorUserId, jugadores);
        }
        else{
            estadoPartidaSocket(roomId);
        }
    }, 1000);
  }

  
  async function actualizarUsuarios(ganador, jugadores) {
    for( const color in jugadores){
      const userID = jugadores[color];

      const consulta = await dbAdmin.collection('usurios').where('usuarioID', '==', userID).get();

      if(consulta.empty){
        continue;
      }

      const docRef = consulta.docs[0].ref;
      const data = consulta.docs[0].data();

      const stats = data.estadísticas || {};

      let partidas_ganadas = stats.partidas_ganadas || 0;
      let partidas_perdidas = stats.partidas_perdidas || 0;
      let partidas_empatadas = stats.partidas_empatadas || 0;

      if(ganador === userID){
        partidas_ganadas++;
      }
      else if(ganador === null){
        partidas_empatadas++;
      }
      else{
        partidas_perdidas++;
      }

      await docRef.update({
        estadísticas: {
          partidas_ganadas,
          partidas_perdidas,
          partidas_empatadas
        }
      });

      if (ganador === userID) {
        await completarLogros(userID, partidas_ganadas);
      }
    }
  }

  async function completarLogros(usuarioID, partidasGanadas){
    const LOGRO_10_VICTORIAS_ID = 'ganar10Partidas';
    const LOGRO_50_VICTORIAS_ID = 'ganar50Partidas';

    const logrosCompletados = await dbAdmin.collection('logrosCompletados')
    .where('usuarioID', '==', usuarioID)
    .get();

    const logrosCompletadosID = logrosCompletados.docs.map(doc => doc.data().logroID);

    async function agregarLogro(logroID) {
      if (!logrosCompletadosID.includes(logroID)) {
        await dbAdmin.collection('logrosCompletados').add({
          usuarioID,
          logroID,
          fecha: new Date()
        });
      //console.log(`Logro ${logroID} completado para usuario ${usuarioID}`);
      }
    }

    if(partidasGanadas >= 50){
      await agregarLogro(LOGRO_50_VICTORIAS_ID);
    }
    else if (partidasGanadas >= 10) {
      await agregarLogro(LOGRO_10_VICTORIAS_ID);
    }
  }

  async function guardarPartida({jugadores, duracion, ganador, movimientos}) {
    try {
      console.log('Movimientos en guardar', movimientos)
      await dbAdmin.collection('partidas').doc(roomId).set({
        jugadores,
        duracion,
        ganador,
        movimientos,
        fecha: new Date()
      });
    } catch (error) {
      console.error('Error al guardar partida:', error);
    }
  }


  

});
}