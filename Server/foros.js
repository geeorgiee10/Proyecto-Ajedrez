
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

                for(const doc of mensajesBaseDatos.docs){
                    const mensaje = doc.data();
                    const autorID = mensaje.autorID;

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