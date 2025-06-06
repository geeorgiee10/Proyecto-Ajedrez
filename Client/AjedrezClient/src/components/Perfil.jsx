import { auth } from '../../firebase';
import { useEffect, useState, useRef } from 'react';
import { collection, doc, where, getDocs, query, updateDoc  } from "firebase/firestore";
import { db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";


/**Componente para ver tus estadisticas, logros y datos del usuario */
export function Perfil() {

    const [datosUsuario, setDatosUsuario] = useState(null);
    const [cargar, setCargar] = useState(true);
    const [usuarioLogueado, setUsuarioLogueado] = useState(null);
    const [logros, setLogros] = useState([]);
    const [logrosCompletados, setLogrosCompletados] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevaRutaAvatar, setNuevaRutaAvatar] = useState('');
    

    const SERVER_URL = 'https://proyecto-ajedrez.onrender.com'; 

    const recompensasLogros = {
        ganar10Partidas: 'nombreConEstrella',
        Mandar100Mensajes: 'nombreEnColores',
        Crear10Foros: 'nombreConSombra'
    }

    const avatarOptions = [
        `/images/imagenPerfil2.jpg`,
        `/images/imagenPerfil3.jpg`,
        `/images/imagenPerfil4.jpg`,
        `/images/imagenPerfil5.jpg`,
        `/images/imagenPerfil6.jpg`,
    ];

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
        if(datosUsuario){
            setNuevoNombre(datosUsuario.nombre_email);
            setNuevaRutaAvatar(datosUsuario.avatar);
        }
    }, [datosUsuario]);



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

    const guardarCambios = async () => {
        if(!usuarioLogueado){
            return;
        }

        try{
            const consulta = query(collection(db, "usurios"), where("usuarioID", "==", usuarioLogueado.uid));
            const datos = await getDocs(consulta);
            if(!datos.empty){
                const userDocRef = doc(db, "usurios", datos.docs[0].id);
                await updateDoc(userDocRef, {
                    nombre_email: nuevoNombre,
                    avatar: nuevaRutaAvatar
                });
                setDatosUsuario(prev => ({
                    ...prev,
                    nombre_email: nuevoNombre,
                    avatar: nuevaRutaAvatar
                }));
                setMostrarModal(false);
            }
        }
        catch (error) {
            console.error("Error actualizando perfil:", error);
        }
    }


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

    const clasesNombre = logrosCompletados.map(id => recompensasLogros[id]).filter(Boolean).join(' ');

    const claseAvatar = logrosCompletados.includes('Mandar500Mensajes') ? 'fotoConCirculo' : '';


    return (
      <div className="container mt-5 mb-3">
      <div className="card text-center p-3">
        <img
          src={`${SERVER_URL}${avatar}`}
          alt="avatar"
          className={`rounded-circle mx-auto mb-3 imagenPerfil ${claseAvatar}`}
        />
        <h4 className={clasesNombre}>{datosUsuario.nombre_email}</h4>
        <p className="text-muted">{usuarioLogueado.email}</p>
        <button className="btn btn-outline-primary mb-4" onClick={() => setMostrarModal(true)}>Editar Perfil</button>

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
                                <div className="text-success small ms-4 mt-1">
                                    🎁 Recompensa: <em>{logro.recompensas}</em>
                                </div>
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

      {mostrarModal && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">Editar Perfil</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="nombreInput" className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nombreInput"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Selecciona un avatar</label>
                  <div className="d-flex gap-2 flex-wrap justify-content-center">
                    {avatarOptions
                        .filter((ruta) => {
                            if (ruta.includes("imagenPerfil2.jpg") && !logrosCompletados.includes("ganar50Partidas")) {
                                return false;
                            }
                            return true;
                        })
                        .map((ruta) => (
                            <img
                                key={ruta}
                                src={`${SERVER_URL}${ruta}`}
                                alt="avatar option"
                                className={`rounded-circle imagenModal avatar-option ${nuevaRutaAvatar === ruta ? 'border border-primary border-3' : ''}`}
                                onClick={() => setNuevaRutaAvatar(ruta)}
                            />
                        ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary mx-3"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={guardarCambios}
                >
                  Actualizar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>

    
    );
  }
  
  