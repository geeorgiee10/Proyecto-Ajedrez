import { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import io from 'socket.io-client';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';

var socket;

/**Componente para jugar contra otros jugadores online con chat en tiempo real */
export function ModoOnline() {
    const navigate = useNavigate();

    const [fen, setFen] = useState('start');
    const [turno, setTurno] = useState('w');
    const [estado, setEstado] = useState('');
    const [jugadorColor, setJugadorColor] = useState(null);
    const [userId, setUserId] = useState(null);
    const [esperandoJugador, setEsperandoJugador] = useState(true);
    const [capturadas, setCapturadas] = useState([]);
    const [cronometro, setCronometro] = useState({ w: 300, b: 300});
    const [jugadores, setJugadores] = useState([]);

    const [mensajes, setMensajes] = useState([]);
    const [mensajeInput, setMensajeInput] = useState('');
    const mensajesRef = useRef(null);

    const jugadoresRef = useRef(jugadores);

     useEffect(() => {
        jugadoresRef.current = jugadores;
    }, [jugadores]);


    const SERVER_URL = 'https://proyecto-ajedrez.onrender.com';

    const recompensasLogros = {
        ganar10Partidas: 'nombreConEstrella',
        Mandar100Mensajes: 'nombreEnColores',
        Crear10Foros: 'nombreConSombra'
    }

    useEffect(() => {
        const noAuntenticado = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
            }
        });

        return () => noAuntenticado();
    }, []);

    useEffect(() => {
        if (!userId) return;
        socket = io(/*"http://localhost:2908"*/);
        socket.connect();

        socket.emit('unirsePartida', { userId });

        socket.on('jugadoresActualizados', (players) => {
            const jugadoresConEstilosVisuales = players.map(jugador => {
            const clasesVisuales = jugador.estilos
                ?.map(logro => recompensasLogros[logro])
                .filter(Boolean);

                const estiloCirculoImagen = jugador.estilos?.includes('Mandar500Mensajes');
                const claseAvatar = estiloCirculoImagen ? 'fotoConCirculo' : '';
                return {
                    ...jugador,
                    estilosOriginales: jugador.estilos,
                    estilos: clasesVisuales,
                    claseAvatar,
                };
            });
            setJugadores(jugadoresConEstilosVisuales);
        });

        socket.on('colorAsignado', (color) => setJugadorColor(color));

        socket.on('partidaIniciada', () => {
            setEsperandoJugador(false); 
        });

        socket.on('estadoPartida', ({ fen, turno, estado, capturadas, cronometro }) => {
            setFen(fen);
            setTurno(turno);
            setEstado(estado);
            setCapturadas(capturadas);
            setCronometro(cronometro);
        });

        socket.on('nuevoMensaje', (mensaje) => {
            const jugadorRelacionado = jugadoresRef.current.find(j => j.id === mensaje.id || j.nombre_email === mensaje.jugador);

            const clasesVisuales = jugadorRelacionado?.estilos || [];
            const estilosOriginales = jugadorRelacionado?.estilosOriginales || [];


            const claseAvatar = estilosOriginales.includes('Mandar500Mensajes') ? 'fotoConCirculo' : '';

            const mensajeConEstilos = {
                ...mensaje,
                clasesVisuales,
                claseAvatar
            };
           
            setMensajes(prev => [...prev, mensajeConEstilos]);

            

            setTimeout(() => {
                if (mensajesRef.current) {
                    mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
                }
            }, 100);
        })

        return () => {
            socket.disconnect();
        };
    }, [userId]);

    const moverPieza = (origen, destino) => {
        socket.emit('mover', { from: origen, to: destino });
        return true;
    };

    const piezasCapturadas = (color) => {
        return capturadas.filter((pieza) => pieza.color === color).map((piece, i) => {
            const urlImagen = `https://www.chess.com/chess-themes/pieces/neo/150/${piece.color}${piece.piece}.png`;
            return <img className='me-1 mb-1' key={i} src={urlImagen} alt={`${piece.color}${piece.piece}`} width="40" height="40" />;
        })
    };

    const formCronometro = (segs) =>{
        const min = Math.floor(segs / 60);
        const sec = segs % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`
    };

    const abandonarPartida = () => {
        if(socket){
            socket.emit('abandonarPartida', {userId});
        }
        navigate('/jugar');
    };

    const enviarMensaje = () => {
        if(mensajeInput.trim() === ''){
            return;
        }
        socket.emit('enviarMensaje', mensajeInput);
        setMensajeInput('');
    }

    const jugadorBlancas = jugadores.find(j => j.color === 'w');
    const jugadorNegras = jugadores.find(j => j.color === 'b');

    return (
        <div className="container py-5 text-center d-flex flex-column">
            {esperandoJugador ? (
                <>
                    <div className='d-flex flex-column gap-3 align-items-center buscandoPartida'>
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                        <h4 className="textoPrimario">Buscando jugador...</h4>
                    </div>
                </>
            ) : (
                <>
                    <div className='row'>

                        <div className='col-md-4 mb-4'>
                            <div className='card h-100 shadow-sm'>
                                <div className='card-header text-center fondoPrimario text-white'>
                                    Chat de la partida
                                </div>
                                <div className="card-body overflow-auto" ref={mensajesRef}>
                                {mensajes.map((mensaje, indice) => (
                                    <div key={indice} className="mb-3 border-bottom pb-2">
                                        
                                        <div className='d-flex align-items-center gap-2'>
                                            <img
                                                src={`${SERVER_URL}${mensaje.avatar}`}
                                                alt={`Avatar de ${mensaje.nombre_email || 'Jugador'}`}
                                                className={`rounded-circle img-thumbnail imagenModoOnline ${mensaje.claseAvatar}`}
                                            />
                                        </div>
                                        <div>
                                            <strong className={`d-block ${mensaje.clasesVisuales.join(' ')}`}>{mensaje.jugador}</strong>
                                        </div>
                                        <div className='mt-2 ms-5'>{mensaje.texto}</div>
                                    </div>
                                ))}
                                </div>
                                <div className="card-footer d-flex">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Escribe un mensaje..."
                                        value={mensajeInput}
                                        onChange={e => setMensajeInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
                                    />
                                    <button className="btn btn-outline-secondary btn-lg ms-2" onClick={enviarMensaje}>Enviar</button>
                                </div>
                            </div>
                        </div>


                        <div className='col-md-8'>

                            <div className="text-center mb-4">
                                <h2 className="textoPrimario">{estado}</h2>
                                <h3 className="textoSecundario">Turno de las piezas {turno === 'w' ? 'blancas' : 'negras'}</h3>
                                <h4 className="textoTerciario">Controlas a las piezas {jugadorColor === 'w' ? 'blancas' : 'negras'}</h4>
                            </div>

                            <div className="row justify-content-center">
                                <div className="col-lg-8 mb-4">
                                    <div className="card shadow-sm">
                                        <div className="card-body text-center">
                                            <div className="d-flex justify-content-around mb-3">
                                                <div>
                                                    {jugadorBlancas && (
                                                        <>
                                                            <img
                                                                src={`${SERVER_URL}${jugadorBlancas.avatar}`}
                                                                alt={`Avatar de ${jugadorBlancas.nombre_email || 'Jugador'}`}
                                                                className={`rounded-circle img-thumbnail imagenModoOnline ${jugadorBlancas.claseAvatar}`}
                                                            />
                                                            <h5 className={jugadorBlancas.estilos?.join(' ')}>{jugadorBlancas.nombre_email || 'Jugador'}</h5>
                                                        </>
                                                    )}
                                                    <span className="badge bg-light text-dark fs-5">
                                                        {formCronometro(cronometro.w)}
                                                    </span>
                                                </div>
                                                <div>
                                                    {jugadorNegras && (
                                                        <>
                                                            <img
                                                                src={`${SERVER_URL}${jugadorNegras.avatar}`}
                                                                alt={`Avatar de ${jugadorNegras.nombre_email}`}
                                                                className={`rounded-circle img-thumbnail imagenModoOnline ${jugadorNegras.claseAvatar}`}
                                                            />
                                                            <h5 className={jugadorNegras.estilos?.join(' ')}>{jugadorNegras.nombre_email}</h5>
                                                        </>
                                                    )}
                                                    <span className="badge bg-dark fs-5">
                                                        {formCronometro(cronometro.b)}
                                                    </span>
                                                </div>
                                            </div>

                                            <Chessboard
                                                position={fen}
                                                boardOrientation={jugadorColor === 'w' ? 'white' : 'black'}
                                                customDarkSquareStyle={{ backgroundColor: '#6789D3' }}
                                                customLightSquareStyle={{ backgroundColor: '#F0EAD6' }}
                                                onPieceDrop={(from, to) => {
                                                    if (turno !== jugadorColor || estado === 'Jaque mate' || estado === 'Tablas') {
                                                     return false;
                                                    }
                                                    return moverPieza(from, to);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mx-auto">
                                <div className="card mb-3">
                                    <h4 className="card-header text-center fw-bold">Piezas blancas capturadas:</h4>
                                    <div className="card-body d-flex flex-wrap justify-content-center">
                                        {piezasCapturadas('w')}
                                    </div>
                                </div>

                                <div className="card">
                                    <h4 className="card-header text-center fw-bold">Piezas negras capturadas:</h4>
                                    <div className="card-body d-flex flex-wrap justify-content-center">
                                        {piezasCapturadas('b')}
                                    </div>
                                </div>
                            </div>
                    
                            <div className='d-flex flex-column align-items-center gap-3 text-center mt-4'>
                                <button onClick={abandonarPartida} className='btn btn-outline-secondary btn-lg'>
                                    Abandonar Partida
                                </button>

                                {estado && estado !== '' && (
                                    <button className="btn btn-outline-secondary btn-lg" onClick={() => navigate('/jugar')}>
                                        Volver a jugar
                                    </button>
                                )}
                            </div>


                        </div>

                    </div>


                </>
            )}
        </div>
    );
}
