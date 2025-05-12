import { useState,useEffect } from 'react';
import { Navigate, Outlet } from "react-router-dom"
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function RutasProtegidas() {
    const [estaIniciado, setEstaIniciado] = useState(true);
    
      useEffect(() => {
        const comprobarInicioSesion = onAuthStateChanged(auth, (user) => {
          if (user) {
            setEstaIniciado(true);
          } 
          else {
            setEstaIniciado(false); 

          }
        });
    
        return () => comprobarInicioSesion(); 
      }, []);

      let iniciado = estaIniciado;

    return (
        
      iniciado ? <Outlet /> : <Navigate to='/'/>
        
    )
}

