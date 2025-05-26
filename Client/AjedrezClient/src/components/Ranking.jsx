import { auth } from '../../firebase';
import { useEffect, useState, useRef } from 'react';
import { collection, addDoc, where, getDocs, query } from "firebase/firestore";
import { db } from "../../firebase";
import { data } from 'react-router-dom';


export function Ranking() {
    const [ranking, setRanking] = useState([]); 
    const [buscador, setBuscador] = useState("");

    useEffect(() => {
        const obtenerPuntos = async () => {
            try{
                const coleccion = collection(db, 'usurios');
                const datos = await getDocs(coleccion);

                if(!datos.empty){
                    const rankingData = [];

                    datos.forEach((doc) => {
                        const data = doc.data();
                        const stats = data.estadísticas || {};

                        const partidas_ganadas = stats.partidas_ganadas || 0;
                        const partidas_empatadas = stats.partidas_empatadas || 0;
                        const partidas_perdidas = stats.partidas_perdidas || 0;
                        const puntos = partidas_ganadas * 3 + partidas_empatadas; 

                        rankingData.push({
                            id: doc.id,
                            NombreUsuario: data.nombre_email  || 'Sin nombre',
                            Puntuacion: puntos,
                            Ganadas: partidas_ganadas,
                            Empatadas: partidas_empatadas,
                            Perdidas: partidas_perdidas,
                            UsuarioID: data.usuarioID || null,
                        });
                    });

                    rankingData.sort((a,b) => b.Puntuacion - a.Puntuacion);

                    setRanking(rankingData);
                }
            }
            catch(error){
                console.log("Error al obtener el ranking: " + error);
            }
        };

        obtenerPuntos();
    }, []);

    const usuarioLogueado = auth.currentUser;
    const usuarioLogueadoID = usuarioLogueado?.uid || null;
    const usuarioCorreoLogueado = usuarioLogueado?.email || null;

    const filtrar = ranking.filter((i) => {
        return i.NombreUsuario.toLowerCase().includes(buscador.toLowerCase());
    });

  

    return (
      <div className='container-fluid mt-4 px-3'>
            <h2 className='mb-4 text-center'>Mejores Jugadores</h2>

            <input 
                type="text" 
                className="form-control mb-4" 
                placeholder="Buscar por nombre" 
                value={buscador} 
                onChange={(e) => setBuscador(e.target.value)} 
            />

            <div className='table-responsive'>


                <table className='table table-bordered text-center align-middle'>
                    <thead>
                        <tr className='table-primary'>
                            <th>#</th>
                            <th>Usuario</th>
                            <th>Partidas Ganadas</th>
                            <th>Partidas Empatadas</th>
                            <th>Partidas Perdidas</th>
                            <th>Puntuación</th>
                        </tr> 
                    </thead>
                 
                    <tbody>

                        {filtrar.map((rango, indice) => {
                            const usuarioActual = 
                                rango.UsuarioID === usuarioLogueadoID || rango.NombreUsuario === usuarioCorreoLogueado;

                            return (
                                <tr 
                                    key={indice} 
                                    className={usuarioActual ? "table-success fw-bold" : ""}
                                > 
                                    <td>{indice + 1}</td>
                                    <td>{rango.NombreUsuario}</td>
                                    <td>{rango.Ganadas}</td>
                                    <td>{rango.Empatadas}</td>
                                    <td>{rango.Perdidas}</td>
                                    <td>{rango.Puntuacion}</td>
                                </tr>
                            );
                        })}

                    </tbody>
                </table>
            </div>
        </div>
    );
  }
  
  