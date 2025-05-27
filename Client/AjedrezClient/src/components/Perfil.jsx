import { auth } from '../../firebase';
import { useEffect, useState, useRef } from 'react';
import { collection, addDoc, where, getDocs, query } from "firebase/firestore";
import { db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";



export function Perfil() {

    const [datosUsuario, setDatosUsuario] = useState(null);
    const [cargar, setCargar] = useState(true);
    const [usuarioLogueado, setUsuarioLogueado] = useState(null);
    const [logros, setLogros] = useState([]);
    const [logrosCompletados, setLogrosCompletados] = useState([]);

    const SERVER_URL = 'http://localhost:2908'; 

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUsuarioLogueado(user);
            } 
            else {
                setUsuarioLogueado(null);
                setCargar(false); 
            }
        });

        return () => unsubscribe();
    }, []);



    useEffect(() => {
        const fetchUserData = async () => {
            if(!usuarioLogueado){
                return;
            }

            try{
                const consulta = query(collection(db, "usurios"), where("usuarioID", "==", usuarioLogueado.uid));

                const datos = await getDocs(consulta);

                if(!datos.empty){
                    const userDoc = datos.docs[0].data();
                    setDatosUsuario(userDoc);
                }
            }
            catch(error){
                console.log("Error fetching user data: ", error);
            }
            finally{
                setCargar(false);
            }
        };

        fetchUserData();
    }, [usuarioLogueado]);


    useEffect(() => {
        const fetchLogros = async () => {
            try{
                const logrosDatos = await getDocs(collection(db, "logros"));
                const logrosLista = logrosDatos.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setLogros(logrosLista);
            }
            catch(error){
                console.log("Error al obtener los logros: " + error);
            }
        }

        fetchLogros();
    }, []);


    useEffect(() => {
        const fectchLogrosCompletados = async () => {
            if(!usuarioLogueado){
                return;
            }
            try{
                const consulta =  query(collection(db, "logrosCompletados"),where("usuarioID", "==", usuarioLogueado.uid));

                const documentos = await getDocs(consulta);
                const completados = documentos.docs.map(doc => doc.data().logroID)
                setLogrosCompletados(completados);
            }
            catch(error){
                console.log("Error al obtener logros completados:", error);
            }
        };

        fectchLogrosCompletados();
    }, [usuarioLogueado]);


    if (cargar){
        return <div className="text-center mt-5">Loading profile...</div>;
    }
    if(!datosUsuario){
        return <div className="text-center mt-5">User data not found.</div>;
    }
  
    const { avatar, nombre_email, estadísticas } = datosUsuario;
    const { partidas_ganadas, partidas_perdidas, partidas_empatadas } = estadísticas;
    const porcentajeVictoria = partidas_ganadas + partidas_perdidas > 0
    ? Math.round((partidas_ganadas / (partidas_ganadas + partidas_perdidas)) * 100)
    : 0;
    const partidasJugadas = partidas_ganadas + partidas_perdidas + partidas_empatadas;

    return (
      <div className="container mt-5">
      <div className="card text-center p-3">
        <img
          src={`${SERVER_URL}${avatar}`}
          alt="avatar"
          className="rounded-circle mx-auto mb-3 imagenPerfil"
        />
        <h4>{nombre_email}</h4>
        <p className="text-muted">{usuarioLogueado.email}</p>
        <button className="btn btn-outline-primary mb-4">Editar Perfil</button>

        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title mb-3">Estadísticas</h5>
            <div className="row text-center">
              <div className="col">
                <div>Partidas Jugadas</div>
                <strong>{partidasJugadas}</strong>
              </div>
              <div className="col">
                <div>Partidas Ganadas</div>
                <strong>{partidas_ganadas}</strong>
              </div>
              <div className="col">
                <div>Partidas Perdidas</div>
                <strong>{partidas_perdidas}</strong>
              </div>
              <div className="col">
                <div>Partidas Empatadas</div>
                <strong>{partidas_empatadas}</strong>
              </div>
              <div className="col">
                <div>Porcentaje de vistorias</div>
                <strong>{porcentajeVictoria}%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">Logros</h5>
            <div className='list-group'>
                {logros.map(logro => {
                    const completado = logrosCompletados.includes(logro.id);
                    return (
                        <div
                            key={logro.id}
                            className={`list-group-item d-flex justify-content-between align-items-center ${completado ? 'list-group-item-success' : ''}`}
                        > 
                            <div className='text-start'>
                                <h6 className='mb-1'>{logro.nombre}</h6>
                                <small>{logro.descripcion}</small>
                                {completado && <span className="badge bg-success ms-2">Completado</span>}
                            </div>
                             {completado && (
                                <i className="bi bi-check-circle-fill text-success fs-4"></i>
                            )}
                        </div>
                    );
                })}
                {logros.length === 0 && <p>No hay logros definidos.</p>}
            </div>  
          </div>
        </div>
      </div>
    </div>
    );
  }
  
  