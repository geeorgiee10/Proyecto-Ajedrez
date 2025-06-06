import { BrowserRouter, Routes, Route, Link } from "react-router";
import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';

/**Componente para jugar contra otro jugador en el mismo dispositivo*/
export function ModoLocal() {
    const navigate = useNavigate();


    const [chess, setChess] = useState(new Chess());
    const [fen,setFen] = useState(chess.fen());
    const [capturadas, setCapturadas] = useState([]);
    const [cronometroBlancas, setCronometroBlancas] = useState(300);
    const [cronometroNegras, setCronometroNegras] = useState(300);
    const [turno, setTurno] = useState('w');
    const [estado, setEstado] = useState('');
    const [terminada, setTerminada] = useState(false);


    const hacerMovimiento = (cuadradoOrigen, cuadradoDestino) => {

        if(terminada){
            return false;
        }

        const movimiento = chess.move({
            from: cuadradoOrigen,
            to: cuadradoDestino,
            promotion: 'q'
        });

        if(movimiento){
            if(movimiento.captured){
                setCapturadas([...capturadas, { color: movimiento.color === 'w' ? 'b' : 'w', piece: movimiento.captured}]);
            }

            setFen(chess.fen());

            setTurno(movimiento.color === 'w' ? 'b' : 'w');

            if(chess.isCheckmate()){
                setTerminada(true);
                setEstado('¡Jaque Mate! Han ganado las ' + (movimiento.color === 'w' ? 'blancas' : 'negras') + '.');
            }
            else if(chess.isStalemate()){
                setTerminada(true);
                setEstado('¡Empate por falta de movimientos!');
            }
            else if(chess.isDraw()){
                setTerminada(true);
                setEstado('La partida ha quedado en tablas!');
            }
            else if(chess.isCheck()){
                setEstado('¡Jaque a las piezas ' + (movimiento.color === 'w' ? 'negras' : 'blancas') + '.');
            }
            else{
                setEstado('');
            }


            return true;
        }
        return false;

    }

    useEffect(() =>{
        if(terminada){
            return;
        }

        const temporizador = setInterval(()=> {
            if(turno === 'w'){
                setCronometroBlancas(prev => {
                    if(prev <= 1){
                        setTerminada(true);
                        setEstado('Se ha acabado el tiempo, ganan las piezas negras');
                        return 0;
                    }
                    return prev -1;
                });
            }
            else{
                setCronometroNegras(prev => {
                    if(prev <= 1){
                        setTerminada(true);
                        setEstado('Se ha acabado el tiempo, ganan las piezas blancas');
                        return 0;
                    }
                    return prev -1;
                });
            }
        }, 1000)

        return () => clearInterval(temporizador);
    },[turno, terminada])

    const formCronometro = (segs) =>{
        const min = Math.floor(segs / 60);
        const sec = segs % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`
    }

    const piezasCapturadas = (color) =>{
        return capturadas.filter((pieza) => pieza.color === color).map((piece, i) => {
            const urlImagen = `https://www.chess.com/chess-themes/pieces/neo/150/${piece.color}${piece.piece}.png`;
            return <img className='me-1 mb-1' key={i} src={urlImagen} alt={`${piece.color}${piece.piece}`} width="40" height="40" />;
        })
    }

    const volverAEmpezar = () => {
        const empezarDeNuevo = new Chess();
        setChess(empezarDeNuevo);
        setFen(empezarDeNuevo.fen());
        setCapturadas([]);
        setCronometroBlancas(300);
        setCronometroNegras(300);
        setTurno('w');
        setTerminada(false);
        setEstado('');
    }

    useEffect(() =>{
        const partidaGuardada = localStorage.getItem('partidaAjedrezLocal');

        if(partidaGuardada){
            const datos = JSON.parse(partidaGuardada);
            const ahora = Date.now();
            const hora = 60 * 60 * 1000;

            if (ahora - datos.timestamp > hora) {
                localStorage.removeItem('partidaAjedrezLocal');
                return;
            }

            const partida = new Chess(datos.fen);
            setChess(partida);
            setFen(datos.fen);
            setCapturadas(datos.capturadas || []);
            setCronometroBlancas(datos.cronometroBlancas);
            setCronometroNegras(datos.cronometroNegras);
            setTurno(datos.turno);
            setTerminada(false);
            setEstado('');
        }
    }, []);

    useEffect(() => {
        if (terminada) {
            localStorage.removeItem("partidaAjedrezLocal");
        }
    }, [terminada]);

    useEffect(() => {
        if(!terminada){
            const datosPartida = {
                fen,
                capturadas,
                cronometroBlancas,
                cronometroNegras,
                turno,
                timestamp: Date.now()
            };
            localStorage.setItem('partidaAjedrezLocal', JSON.stringify(datosPartida));
        }
    }, [fen, capturadas, cronometroBlancas, cronometroNegras, turno, terminada])

     
    return (
      <>
        
       <div className="container py-5 d-flex flex-column">

            <div className="text-center mb-4">
                <h2 className="text-primary">{estado}</h2>

                <h3 className="text-secondary">Turno de las piezas {turno === 'w' ? 'blancas' : 'negras'}</h3>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-6 mb-4">
                    <div className="card shadow-sm">

                        <div className="card-body text-center">

                            <div className="d-flex justify-content-around mb-3">
                                <div>
                                    <h5>Piezas blancas</h5>
                                    <span className="badge bg-light text-dark fs-5">{formCronometro(cronometroBlancas)}</span>
                                </div>

                                <div>
                                    <h5>Piezas negras</h5>
                                    <span className="badge bg-dark fs-5">{formCronometro(cronometroNegras)}</span>
                                </div>
                            </div>

                            <Chessboard className='w-100'
                                position={fen} 
                                
                                customDarkSquareStyle={{ backgroundColor: '#6789D3' }}
                                customLightSquareStyle={{ backgroundColor: '#F0EAD6' }}
                                onPieceDrop={(origen, destino) => hacerMovimiento(origen, destino)}
                            />


                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto ">
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

            
            <div className="d-flex flex-column align-items-center gap-3 text-center mt-4">
                <button className='btn btn-outline-secondary btn-lg' onClick={volverAEmpezar}>Reiniciar partida</button>

                 {terminada  && (
                        <button className="btn btn-outline-secondary btn-lg" onClick={() => navigate('/jugar')}>
                            Volver a jugar
                        </button>
                    )}
            </div>
            

       </div>
  
  
      </>
    )
  }
  
  