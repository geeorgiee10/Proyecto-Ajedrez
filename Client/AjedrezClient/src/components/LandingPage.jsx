import { BrowserRouter, Routes, Route, Link } from "react-router";

export function LandingPage() {

  return (
    <div className="container py-5">

      {/* Hero */}
      <div className="row align-items-center mb-5">
        <div className="col-md-6 text-center mb-4 mb-md-0">
          <div className="bg-light border rounded p-4">
            <div className="contenedorImgTablero">
              <img src="public/tableroAjedrez.png" alt="tableroAjedrez" className="imgTablero"/>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <h1 className="fw-bold">Juega donde, de la forma y con quien quieras al ajedrez</h1>
          <p className="text-muted">
            Desafía a la IA, juega con amigos tanto online como ofline o únete a los distintos foros para disfrutar del ajedrez mundial.
          </p>
          <div className="d-flex flex-column flex-md-row align-items-center justiy-content-center gap-3">
            <Link className="btn btn-secondary me-3" to="/login">Registrarse</Link>
            <Link className="btn btn-secondary me-3" to="/jugar">Jugar</Link>
            <Link className="btn btn-outline-secondary" to="/informacion">Ver cómo funciona</Link>
          </div>
        </div>
      </div>

      <hr className="separador"/>

      {/* Modos de juego */}
      <h2 className="fw-bold mb-5 text-center">Modos de juego</h2>
      <div className="row text-center mb-5">
        {[
          { title: "Modo IA", description: "Juega contra la máquina, elige tu nivel", icon: "robot" },
          { title: "Modo local", description: "Dos jugadores en un solo dispositivo", icon: "people" },
          { title: "Modo online", description: "Desafía a jugadores de todo el mundo", icon: "globe" },
          { title: "Chat en partidas", description: "Comunicación en tiempo real", icon: "chat-left-text" },
        ].map((mode, i) => (
          <div className="col-md-3 mb-3" key={i}>
            <div className="p-3 rounded modos">
              <i className={`bi bi-${mode.icon} fs-1`}></i>
              <h5 className="mt-2">{mode.title}</h5>
              <p className="text-muted">{mode.description}</p>
            </div>
          </div>
        ))}
      </div>

      <hr className="separador"/>

      {/* Foros */}
      <h2 className="fw-bold mb-5 text-center">Nuestros foros</h2>
      <div className="row align-items-center mb-5">
        <div className="col-md-6 mb-4 mb-md-0 d-flex flex-column justify-content-center">
          <h3>
            <strong>Únete a la comunidad</strong>
          </h3>
          <p>
            Comparte estrategias, participa en foros y gana recompensas.
          </p>
          <button className="btn btn-outline-secondary w-100">Ver foros</button>
        </div>
        <div className="col-md-5 ms-auto contenedorImgForos">
          <img src="public/foros.jpg" alt="foros" className="imgForos"/>
        </div>
      </div>
    </div>
  )
}

