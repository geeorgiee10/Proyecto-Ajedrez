
module.exports = function(io,dbAdmin){
    io.on('connection', (socket) => {
        let foroID;

        console.log(`Nuevo usuario conectado al foro: ${socket.id}`);

        socket.on('unirseForo', async ({ foro: id, usuarioID }) => {
            foroID = id;

            socket.join(foroID);

            try {
                const mensajesBaseDatos = await dbAdmin.collection('foros').doc(foroID).collection('mensajes').orderBy('fecha', 'asc').get();

                const mensajes = [];
                const usuariosEnForo = new Set();

                for(const doc of mensajesBaseDatos.docs){
                    const mensaje = doc.data();
                    const autorID = mensaje.autorID;
                    usuariosEnForo.add(autorID);

                    const datosUsuarios = await dbAdmin.collection('usurios').where('usuarioID', '==', autorID).get();

                    let fotoURL = '';

                    if(!datosUsuarios.empty){
                        const userData = datosUsuarios.docs[0].data();
                        fotoURL = userData.avatar;
                    }
                    else {
                        console.log('No existe usuario con usuarioID:', autorID);
                    }
            
                    mensajes.push({
                        id: doc.id,
                        ...mensaje,
                        fotoURL,
                    })
                }
            
                socket.emit('cargarMensajesBaseDatos', mensajes);

                const logrosDatosUsuario  = await dbAdmin.collection('logrosCompletados')
                .where('usuarioID', '==', usuarioID)
                .get();

                const logrosCompletadosUsuario  = logrosDatosUsuario.docs.map(doc => doc.data().logroID);

                socket.emit('logrosCompletadosUsuario', logrosCompletadosUsuario);

                const logrosTodosUsuarios = {};

                for (const idUsuario of usuariosEnForo) {
                    const logrosDatos = await dbAdmin.collection('logrosCompletados')
                    .where('usuarioID', '==', idUsuario)
                    .get();

                    logrosTodosUsuarios[idUsuario] = logrosDatos.docs.map(doc => doc.data().logroID);
                }

                socket.emit('logrosTodosUsuarios', logrosTodosUsuarios);

            }
            catch(error){
                console.log('Error obteniendo los mensajes de la base de datos: ', error);
            }
        });

        socket.on('enviarMensaje', async (mensaje) => {
            if(!foroID) {
                return;
            }

            try {
                const datosBase = await dbAdmin.collection('foros').doc(foroID).collection('mensajes').add({
                    contenido: mensaje.contenido,
                    autor: mensaje.autor,
                    autorID: mensaje.autorID,
                    fecha: new Date(),
                });

                const datosUsuarios = await dbAdmin.collection('usurios').where('usuarioID', '==', mensaje.autorID).get();

                    let fotoURL = '';

                    if(!datosUsuarios.empty){
                        const userData = datosUsuarios.docs[0].data();
                        fotoURL = userData.avatar;
                    }
                    else {
                        console.log('No existe usuario con usuarioID:', autorID);
                    }


                const mensajeGuardado = {
                    id: datosBase.id,
                    ...mensaje,
                    fotoURL,
                    fecha: new Date(),
                };

                io.to(foroID).emit('mensajeNuevo', mensajeGuardado);

                const forosDatos = await dbAdmin.collection('foros').get();

                let mensajesUsuarioTotales = 0;

                for(const foroDocumento of forosDatos.docs){
                    const mensajesDatos = await dbAdmin
                    .collection('foros')
                    .doc(foroDocumento.id)
                    .collection('mensajes')
                    .where('autorID', '==', mensaje.autorID)
                    .get();

                    mensajesUsuarioTotales += mensajesDatos.size;
                }

                if(mensajesUsuarioTotales >= 100){
                    const LOGRO_100_MENSAJES_ID = 'Mandar100Mensajes';

                    const tieneLogro = await dbAdmin
                    .collection('logrosCompletados')
                    .where('usuarioID', '==', mensaje.autorID)
                    .where('logroID', '==', LOGRO_100_MENSAJES_ID)
                    .get();

                    if(tieneLogro.empty){
                        await dbAdmin.collection('logrosCompletados').add({
                           usuarioID: mensaje.autorID,
                           logroID: LOGRO_100_MENSAJES_ID,
                           fecha: new Date(),
                        });
                    }
                }

                if(mensajesUsuarioTotales >= 500){
                    const LOGRO_50_VICTORIAS_ID = 'Mandar500Mensajes';

                    const tieneLogro = await dbAdmin
                    .collection('logrosCompletados')
                    .where('usuarioID', '==', mensaje.autorID)
                    .where('logroID', '==', LOGRO_50_VICTORIAS_ID)
                    .get();

                    if(tieneLogro.empty){
                        await dbAdmin.collection('logrosCompletados').add({
                           usuarioID: mensaje.autorID,
                           logroID: LOGRO_50_VICTORIAS_ID,
                           fecha: new Date(),
                        });
                    }
                }


            }
            catch(error){
                console.log('Error enviando el mensaje: ', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Usuario desconectado: ${socket.id}`);
        });



        

    });
};