import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, GithubAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { collection, addDoc, where, getDocs, query } from "firebase/firestore";
import { db } from "../../firebase";

export function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [estaIniciado, setEstaIniciado] = useState(true);
  const [confirmarContraseña, setConfirmarContraseña] = useState(''); 
  
  const googleAuthProvider = new GoogleAuthProvider();
  const githubAuthProvider = new GithubAuthProvider();

  const iniciarORegistrar = async () => {
    setError('');

    if (!estaIniciado && password !== confirmarContraseña) { 
        setError('Las contraseñas no coinciden');
        return;
    }

    try {
      if (estaIniciado) {
        await signInWithEmailAndPassword(auth, email, password);
        await crearUsuario();
        navigate("/")
      } 
      else {
        await createUserWithEmailAndPassword(auth, email, password);
        await crearUsuario();
        navigate("/")
      }
    } 
    catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('La contraseña es incorrecta. Por favor, inténtalo de nuevo.');
      } else if (err.code === 'auth/user-not-found') {
        setError('El usuario no existe o no se ha encontrado.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Las credenciales proporcionadas no son válidas. Por favor, verifica tus datos.');
      } else {
        setError(err.message);
      }
    }
  };

  const iniciarConGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      await crearUsuario();
      navigate("/")
    } catch (err) {
      setError(err.message);
    }
  };

  const iniciarConGithub = async () => {
    try {
      await signInWithPopup(auth, githubAuthProvider);
      await crearUsuario();
      navigate("/")
    } catch (err) {
      setError(err.message);
    }
  };

  const crearUsuario = async () => {
  
          try {
              const consulta = query(collection(db, 'usurios'),where("usuarioID", "==", auth.currentUser.uid));
              const consultaUsuarios = await getDocs(consulta);
              if (consultaUsuarios.empty) { // Si no existe el usuario en la colección
                await addDoc(collection(db, 'usurios'), {
                  amigoID: [],
                  avatar: 'rutaImagenDefectoServidor', 
                  estadísticas: {
                    partidas_ganadas: 0, 
                    partidas_perdidas: 0, 
                    ranking: null, 
                  },
                  nombre_email: auth.currentUser.displayName || auth.currentUser.email, 
                  usuarioID: auth.currentUser.uid,
                });
              }
              
          }
          catch (error) {
              console.log("Error al crear el usuario " + error);
          }
  };

  return (
    <div className="formulario">
      <h2 className='tituloForm'>{estaIniciado ? 'Iniciar sesión' : 'Registrarse'}</h2>
      
      <button onClick={iniciarConGithub} className="btnGithub"><i className="fa-brands fa-github" id="logoGithub"></i> Inicia con Github</button>
      <button onClick={iniciarConGoogle} className="btnGoogle"><img src="https://www.google.com\favicon.ico" alt="Google" /> Inicia con Google</button>
      
      <hr className='separacion'/>
      
      <form className='{ estaIniciado } ? iniciarSesion : registrarse' onSubmit={(e) => { e.preventDefault(); iniciarORegistrar(); }}>
        <label>Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@gmail.com" required />
        
        <label>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {!estaIniciado && ( 
          <>
            <label>Confirmar Contraseña</label>
            <input type="password" value={confirmarContraseña} onChange={(e) => setConfirmarContraseña(e.target.value)} required />
          </>
        )}

        <button type="submit">{estaIniciado ? 'Iniciar sesión' : 'Registrarse'}</button>
      </form>

      {error && <p className="error">{error}</p>}
      
      <p className="cambiarForm">
        {estaIniciado ? '¿No tienes ninguna cuenta?' : '¿Ya tienes una cuenta?'}
        <span onClick={() => setEstaIniciado(!estaIniciado)}>
          {estaIniciado ? 'Registrarse' : 'Iniciar sesión'}
        </span>
      </p>
    </div>
  );
}

