import { auth } from '../../firebase';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { data, useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';

var socket;

export function ForosConversacion() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [informacionForo, setInformacionForo] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [mensajeForoNoEncontrado, setMensajeForoNoEncontrado] = useState(false);
    const [datosUsuario, setDatosUsuario] = useState(null);
    const [logrosTodosUsuarios, setLogrosTodosUsuarios] = useState({});

    const usuarioActual = auth.currentUser;

    const SERVER_URL = 'http://localhost:2908';

    const recompensasLogros = {
        ganar10Partidas: 'nombreConEstrella',
        Mandar100Mensajes: 'nombreEnColores',
        Mandar500Mensajes: 'fotoConCirculo',
        Crear10Foros: 'nombreConSombra',
    };

    useEffect(() => {
        if(!usuarioActual){
            return;
        }

        const fetchUserData = async () => {
            if(!usuarioActual){
                return;
            }

            try{
                const consulta = query(collection(db, "usurios"), where("usuarioID", "==", usuarioActual.uid));

                const datos = await getDocs(consulta);

                if(!datos.empty){
                    const userDoc = datos.docs[0].data();
                    setDatosUsuario(userDoc);
                }
            }
            catch(error){
                console.log("Error fetching user data: ", error);
            }
        };

        fetchUserData();

        socket = io("http://localhost:2908");

      

        socket.emit('unirseForo', {foro: id, usuarioID: usuarioActual.uid});

        socket.on('cargarMensajesBaseDatos', (mensajesCargados) => {
            setMensajes(mensajesCargados);
        });

        socket.on('mensajeNuevo', (mensaje) => {
            setMensajes((msgs) => [...msgs, mensaje]);
        });

        socket.on('logrosTodosUsuarios', (logros) => {
            setLogrosTodosUsuarios(logros);
        });

        return () => {
            socket.disconnect();
            setMensajes([]);
        };
    }, [id, usuarioActual])


    useEffect(() => {
        if(!id){
            return;
        }

        const fetchForo = async () =>  {
            try{
                const foroDocumento = doc(db, 'foros', id);
                const foroDatos = await getDoc(foroDocumento);
                if(foroDatos.exists()){
                    setInformacionForo(foroDatos.data());
                    setMensajeForoNoEncontrado(false);
                }
                else{
                    setMensajeForoNoEncontrado(true);
                }
            }
            catch(error){
                console.log("Error al obtener los datos del foro: ", error);
                setMensajeForoNoEncontrado(true);
            }
        };

        fetchForo();

    }, [id]);

    const enviarMensaje = async () => {
        if(!nuevoMensaje.trim()){
            return;
        }

        const mensajeEnviar = {
            contenido: nuevoMensaje,
            autor: datosUsuario?.nombre_email || 'Anónimo',
            autorID: usuarioActual.uid,
            fecha: new Date(),
            foroID: id,
        };

        socket.emit('enviarMensaje', mensajeEnviar);
        setNuevoMensaje('');
    };


    const obtenerClasesEstilos = (usuarioID) => {
        const logros = logrosTodosUsuarios[usuarioID] || [];
        return logros.map(logro => recompensasLogros[logro]).filter(Boolean);
    };

  return (
    <div className="container py-4">

        <div className='mb-3'>
            <button className='btn btn-secondary' onClick={() => navigate('/foros')}>
                ← Volver
            </button>
        </div>

        {mensajeForoNoEncontrado ? (
            <div className='alert alert-danger'>
                <h5>Foro no encontrado</h5>
                <p>El foro con el ID especificado no existe</p>
            </div>
        ) : informacionForo && (
            <>
            
                <div className="mb-4">
                    <h2>{informacionForo.tema}</h2>
                    <p className="text-muted">{informacionForo.descripcion}</p>
                </div>

                <hr />

                <div className="mb-4">

                    {mensajes.map((mensaje, idx) => {
                        const mensajePropio = mensaje.autorID === usuarioActual?.uid;
                        const clasesUsuario = obtenerClasesEstilos(mensaje.autorID);
                        const clasesNombre = clasesUsuario.filter(clase => clase.startsWith('nombre'));
                        const clasesFoto = clasesUsuario.filter(clase => clase.startsWith('foto'));

                        return (
                            <div key={idx} className={`d-flex mb-3 ${mensajePropio ? "justify-content-end" : "justify-content-start"}`}>

                                {!mensajePropio && (
                                    <img
                                        src={`${SERVER_URL}${mensaje.fotoURL}`}
                                        alt={mensaje.autor}
                                        className={`rounded-circle me-2 fotoMensajes ${clasesFoto.join(' ')}`}
                                    />    
                                )}
                                <div className={`p-2 rounded ${mensajePropio ? "bg-primary text-white" : "bg-light text-dark"}`}>
                                    <small className={`d-block fw-bold ${clasesNombre.join(' ')}`}>{mensaje.autor}</small>
                                    <span>{mensaje.contenido}</span>
                                </div>
                                {mensajePropio && (
                                    <img
                                        src={`${SERVER_URL}${mensaje.fotoURL}`}
                                        alt={mensaje.autor}
                                        className={`rounded-circle ms-2 fotoMensajes ${clasesFoto.join(' ')}`}
                                    />    
                                )}
                            </div>
                        );
                    })}

                </div>

                <div className="mt-4 d-flex gap-3">

                    <input 
                        type="text" 
                        className="form-control"
                        placeholder="Escribe el mensaje"
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                enviarMensaje();
                            }
                        }}
                    />
                    <button className="btn btn-primary" onClick={enviarMensaje}>Enviar</button>

                </div>
            
            </>
        )}

    </div>
  );


}