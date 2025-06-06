import { useState,useEffect } from 'react';
import { Link, useNavigate } from "react-router";
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut  } from 'firebase/auth';
import { collection, doc, where, getDocs, query, updateDoc  } from "firebase/firestore";

export function Header() {
  const navigate = useNavigate();
  const [estaIniciado, setEstaIniciado] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    // Escuchamos el cambio en el estado de autenticación
    const comprobarInicioSesion = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setEstaIniciado(true);
        
        try{
          const consulta = query(collection(db, 'usurios'), where('usuarioID', '==', user.uid));

          const datos = await getDocs(consulta);

          if(!datos.empty){
            const usuario = datos.docs[0].data();
            setNombreUsuario(usuario.nombre_email);
          }
        }
        catch(error){
          console.log("Error fetching user data: ", error);
        }

      } else {
        setEstaIniciado(false); 
        setNombreUsuario('');
      }
    });

    return () => comprobarInicioSesion(); 
  }, []);

  const cerrarSesion = async () => {
    try {
      await signOut(auth); 
      console.log("Sesión cerrada");
      navigate("/")
    } 
    catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
        <Link className="navbar-brand" to="/">♟️ NextMove</Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav text-center text-lg-start me-auto mb-2 mb-lg-0">

              <Link className="LinkRouter" to="/">
                <li className="nav-item">
                  <span className="nav-link">Inicio</span>
                </li>
              </Link>

              
              <Link className="LinkRouter" to="/jugar">
                <li className="nav-item">
                  <span className="nav-link">Jugar</span>
                </li>
              </Link>
              

              {estaIniciado && (
                  <Link className="LinkRouter" to="/foros">
                    <li className="nav-item">
                      <span className="nav-link">Foros</span>
                    </li>
                  </Link>
              )}

              {estaIniciado && (
                  <Link className="LinkRouter" to="/perfil">
                    <li className="nav-item">
                      <span className="nav-link">Mi cuenta</span>
                    </li>
                  </Link>
              )}

              <Link className="LinkRouter" to="/ranking">
                <li className="nav-item">
                  <span className="nav-link">Ranking</span>
                </li>
              </Link>

              {estaIniciado && (
                <li className="nav-item">
                  <span className="nav-link nombreUsuario">{nombreUsuario}</span>
                </li>
              )}

            </ul>
            <div className="d-flex justify-content-center">

              {!estaIniciado && (
                <Link className="btn btn-outline-light" to="/login">Iniciar Sesión / Registrase</Link>
              )}


              {estaIniciado && (
                <li className="btn btn-outline-light" onClick={cerrarSesion}>
                  Cerrar Sesión
                </li>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
