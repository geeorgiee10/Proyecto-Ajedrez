import { Link } from "react-router";


export function Informacion() {

    return (
      <>
        
        <div className="container text-center py-5">
            <h2 className="fw-bold mb-3">¿Cómo funciona?</h2>
            <p className="text-muted mb-5 fs-5">Juega al ajedrez en línea, desafía a la máquina o compite con otros jugadores.
                 Sube posiciones en el ranking, gana increíbles recompensas y conéctate con otros jugadores en nuestros foros.
            </p>
            
            <div className="row justify-content-center mb-5">
                {[
                    { title: "Resgístrate", description: "Crea tu cuenta, personaliza tu perfil y comienza a ganar recompensas.", icon: "person-plus" },
                    { title: "Juega", description: "Disfruta de partidas contra la máquina, online o desafía a tus amigos en el mismo dispositivo.", icon: "grid-3x3-gap" },
                    { title: "Ranking", description: "Gana partidas y asciende en el ranking hasta alcanzar el primer lugar.", icon: "globe" },
                    { title: "Foros", description: "Únete a las conversaciones en tiempo real sobre estrategias, tácticas y mucho más.", icon: "chat-left-text" },
                ].map((mode, i) => (
                    <div className="col-10 col-sm-6 col-md-4 col-lg-3 mb-4 d-flex justify-content-center" key={i}>
                        <div className="p-3 rounded informacion_card">
                            <i className={`bi bi-${mode.icon} fs-1`}></i>
                            <h5 className="mt-2 fs-3">{mode.title}</h5>
                            <p className="text-muted fs-5 ">{mode.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Link className="btn btn-outline-secondary" to="/">Volver</Link>

        </div>
      </>
    )
  }
  
  