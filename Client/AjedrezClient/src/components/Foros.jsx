import { auth } from '../../firebase';
import { useEffect, useState, useRef } from 'react';
import { collection, addDoc, where, getDocs, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { data,useNavigate } from 'react-router-dom';

/**Componente para la páginas de los foros */
export function Foros() {
    const [mostrarModal, setMostrarModal] = useState(false);
    const [buscador, setBuscador] = useState("");
    const [foros, setForos] = useState([]);
    const [tema, setTema] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [datosUsuario, setDatosUsuario] = useState(null);

    const navigate = useNavigate();
    const usuarioLogueado = auth.currentUser;

    useEffect(() => {
            const unsubscribe = onSnapshot(collection(db, "foros"), (datos) => {
                const  forosBaseDatos = datos.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setForos(forosBaseDatos)
            });
    
            return () => unsubscribe();
        }, []);

    const handleShow = () => setMostrarModal(true);
    const handleClose = () => {
      setMostrarModal(false);
      setTema('');
      setDescripcion('');
    }

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
        };

        fetchUserData();
    }, [usuarioLogueado]);

    const crearForo = async () => {

      try{
        await addDoc(collection(db, 'foros'), {
          tema,
          descripcion,
          autor: datosUsuario.nombre_email,
          autorID: usuarioLogueado.uid,
          fecha: new Date()
        });
        handleClose()

        const forosUsuarioConsulta = query(collection(db, 'foros'), where('autorID', '==', usuarioLogueado.uid));
        const forosUsuarioDatos = await getDocs(forosUsuarioConsulta);
        const totalForosUsuario = forosUsuarioDatos.size;

        if(totalForosUsuario >= 10){
            const LOGRO_10_FOROS_ID = 'Crear10Foros';

            const logroConsulta = query(
              collection(db, 'logrosCompletados'),
              where('usuarioID', '==', usuarioLogueado.uid),
              where('logroID', '==', LOGRO_10_FOROS_ID),
            );

            const logrosDatos= await getDocs(logroConsulta);

            if(logrosDatos.empty){
              await addDoc(collection(db, 'logrosCompletados'), {
                usuarioID: usuarioLogueado.uid,
                logroID: LOGRO_10_FOROS_ID,
                fecha: new Date(),
              });
            }
        }
      }
      catch(error){
        console.log("Error al crear el foro: ", error);
      }
    };

    return (
      <>

       <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="m-0">Foros</h2>
            <button className="btn btn-primary" onClick={handleShow}>Crear Foro</button>
          </div>

          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar foros..."
              value={buscador}
              onChange={(e) => setBuscador(e.target.value)}
            />
          </div>

          <div className="list-group">
            {foros
              .filter(f => typeof f.tema === 'string' && f.tema.toLowerCase().includes(buscador.toLowerCase()))
              .map(foro => (
                <button
                  key={foro.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate(`/foros/${foro.id}`)}
                >
                  <h5 className="mb-1">{foro.tema}</h5>
                  <p className="mb-1">{foro.descripcion}</p>
                  <small>Creado por {foro.autor}</small>
                </button>
            ))}
          </div>

          {mostrarModal && (
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Crear Nuevo Foro</h5>
                    <button type="button" className="btn-close" onClick={handleClose}></button>
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label htmlFor="tituloForo" className="form-label">Título del foro</label>
                        <input 
                          type="text" 
                          className="form-control"
                          id="tituloForo" 
                          placeholder="Titulo del foro"  
                          required
                          value={tema}
                          onChange={(e) => setTema(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="descripcionForo" className="form-label">Descripción</label>
                        <textarea 
                          className="form-control" 
                          id="descripcionForo" 
                          rows="3" 
                          placeholder="Describe brevemente el foro..."
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                        > 
                        </textarea>
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-primary mx-3" onClick={handleClose}>Cancelar</button>
                    <button type="button" className="btn btn-primary" onClick={crearForo}>Crear</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


      </>
    );
  }
  
  