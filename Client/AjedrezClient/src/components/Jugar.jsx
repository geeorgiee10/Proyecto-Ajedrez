import { BrowserRouter, Routes, Route, Link } from "react-router";

export function Jugar() {

    return (
      <>
        
        <div className="container text-center py-5">

          <h2 className="fw-bold mb-5 text-center">Modos de juego</h2>
          <div className="row text-center mb-5 d-flex align-items-center justify-content-center">
          {[
            { title: "Modo IA", description: "Juega contra la máquina, elige tu nivel", icon: "robot", path: "/modo-ia" },
            { title: "Modo local", description: "Dos jugadores en un solo dispositivo", icon: "people", path: "/modo-local" },
            { title: "Modo online", description: "Desafía a jugadores de todo el mundo", icon: "globe", path: "/modo-online" },
          ].map((mode, i) => (
            <div className="col-md-4 mb-4" key={i}>
              <Link to={mode.path} className="text-decoration-none">
              <div className="p-3 rounded shadow-lg opcionesJugar">
                <i className={`bi bi-${mode.icon} fs-1 mb-3`} ></i>
                <h5 className="mt-2 fs-3">{mode.title}</h5>
                <p className="text-muted fs-5">{mode.description}</p>
              </div>
            </Link>
            </div>
          ))}
          </div>

          <Link className="btn btn-outline-secondary" to="/">Volver</Link>


        </div>
  
  
      </>
    )
  }
  
  