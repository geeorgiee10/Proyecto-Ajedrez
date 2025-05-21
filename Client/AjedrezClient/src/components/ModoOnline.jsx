import { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import io from 'socket.io-client';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';

var socket;

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
        // Cuando un usuario se conecta lo une a la sala
        socket = io("http://localhost:2908");
        socket.connect();

        socket.emit('unirsePartida', { userId });

        socket.on('colorAsignado', (color) => setJugadorColor(color));

        socket.on('partidaIniciada', () => {
            setEsperandoJugador(false); // ✅ Ahora sí iniciamos
        });

        socket.on('estadoPartida', ({ fen, turno, estado, capturadas, cronometro }) => {
            setFen(fen);
            setTurno(turno);
            setEstado(estado);
            setCapturadas(capturadas);
            setCronometro(cronometro);
        });

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
                     <div className="text-center mb-4">
                        <h2 className="textoPrimario">{estado}</h2>
                        <h3 className="textoSecundario">Turno de las piezas {turno === 'w' ? 'blancas' : 'negras'}</h3>
                        <h4 className="textoTerciario">Controlas a las piezas {jugadorColor === 'w' ? 'blancas' : 'negras'}</h4>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-lg-6 mb-4">
                            <div className="card shadow-sm">
                                <div className="card-body text-center">
                                    <div className="d-flex justify-content-around mb-3">
                                        <div>
                                            <h5>Piezas blancas</h5>
                                            <span className="badge bg-light text-dark fs-5">
                                                {formCronometro(cronometro.w)}
                                            </span>
                                        </div>
                                        <div>
                                            <h5>Piezas negras</h5>
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
                                            if (turno !== jugadorColor || estado !== '') {
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

                    
                </>
            )}
        </div>
    );
}
