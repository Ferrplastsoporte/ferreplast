import "../css/home.css";
import FadeIn from "../../../animations/FadeIn";
import logocompleto from "../../../assets/logocompleto.jpg";

function Mission() {
  return (
    <FadeIn>
      <section className="mission">

        <div className="mission-header">

          <div className="mission-logo">
            <img src={logocompleto} alt="Ferreplast" />
          </div>

          <div className="mission-info">

            <span className="mission-subtitle">
              NUESTRA EMPRESA
            </span>

            <h2>
              Ferreplast
            </h2>

            <p>
              En <strong>Ferreplast</strong> somos especialistas en la
              comercialización de resinas epóxicas, herramientas,
              adhesivos y productos para la construcción e industria.
              Nuestro objetivo es entregar soluciones de calidad para
              profesionales, empresas y personas que buscan materiales
              confiables para cada proyecto.
            </p>

            <div className="mission-stats">

              <div>
                <h3>500+</h3>
                <span>Productos</span>
              </div>

              <div>
                <h3>100%</h3>
                <span>Calidad</span>
              </div>

              <div>
                <h3>Consultas</h3>
                <span>Atención</span>
              </div>

            </div>

          </div>

        </div>

        <div className="mission-cards">

          <div className="mission-card">
            <div className="mission-icon"></div>

            <h3>Misión</h3>

            <p>
              Ofrecer productos de alta calidad junto a una atención
              personalizada que permita a nuestros clientes desarrollar
              sus proyectos con seguridad y confianza.
            </p>

          </div>

          <div className="mission-card">
            <div className="mission-icon">👁️</div>

            <h3>Visión</h3>

            <p>
              Ser una empresa referente en Chile por su innovación,
              compromiso y liderazgo en la distribución de resinas y
              productos para la construcción.
            </p>

          </div>

          <div className="mission-card">
            <div className="mission-icon">🤝</div>

            <h3>Valores</h3>

            <p>
              Honestidad, compromiso, innovación, calidad, trabajo en
              equipo y orientación al cliente son la base de nuestro
              crecimiento.
            </p>

          </div>

        </div>

      </section>
    </FadeIn>
  );
}

export default Mission;