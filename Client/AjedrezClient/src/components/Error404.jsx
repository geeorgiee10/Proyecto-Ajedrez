import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

/* Componente que salta cuando hay un error con las rutas */ 
export function Error404() {

  return (
    <>
      
      <div className="contenedorError text-center d-flex flex-column justify-content-center align-items-center vh-100">
        <div className="contenedorImgPieza">
          <img src="piezaAjedrez.png" alt="Pieza Ajedrez" className="imgPieza mb-4"/>
        </div>
      <h1 className="display-3">404</h1>  
      <h2 className="display-4">La página no ha podido ser encontrada</h2>
      <p className="lead">Parece que esta jugada no esta disponible en el tablero...</p>
      <Link className="btn btn-primary mt-3" to="/">Volver al inicio</Link>
    </div>
      
    </>
  )
}

