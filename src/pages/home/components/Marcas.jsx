import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../lib/supabase";

import FadeIn from "../../../animations/FadeIn";

import "../css/marcas.css";

function Marcas() {
  const [marcas, setMarcas] = useState([]);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    cargarMarcas();
  }, []);

  function obtenerUrlLogo(rutaLogo) {
    if (!rutaLogo) {
      return "";
    }

    if (
      rutaLogo.startsWith("http://") ||
      rutaLogo.startsWith("https://")
    ) {
      return rutaLogo;
    }

    const { data } = supabase.storage
      .from("imagenes_productos")
      .getPublicUrl(rutaLogo);

    return data.publicUrl;
  }

  async function cargarMarcas() {
    setLoading(true);

    const { data, error } = await supabase
      .from("marca_producto")
      .select(`
        id_marca,
        nom_marca,
        logo_url,
        marca_destacar,
        est_marca
      `)
      .eq("est_marca", true)
      .eq("marca_destacar", true)
      .order("nom_marca", {
        ascending: true,
      });

    if (error) {
      console.error("Error al cargar marcas:", error);

      setMarcas([]);
      setLoading(false);

      return;
    }

    const marcasAdaptadas = (data || []).map((marca) => ({
      ...marca,
      logo_url: obtenerUrlLogo(marca.logo_url),
    }));

    setMarcas(marcasAdaptadas);

    setLoading(false);
  }

  function abrirMarca(idMarca) {
    navigate(`/catalogo?marca=${idMarca}`);
  }

  // Repite los nombres para que la cinta siempre cubra el ancho de pantalla.
  function nombresCinta() {
    if (marcas.length === 0) return [];

    let lista = marcas.map((marca) => marca.nom_marca);
    while (lista.length < 10) {
      lista = [...lista, ...marcas.map((marca) => marca.nom_marca)];
    }

    return lista;
  }

  const cinta = nombresCinta();

  return (
    <FadeIn>
      <section className="marcas" aria-labelledby="marcas-titulo">
        <div className="marcas__contenedor">

          <header className="marcas__cabecera">
            <div>
              <h2 id="marcas-titulo">
                Marcas que{" "}
                <span className="marcas__marca">respaldan</span>{" "}
                cada proyecto
              </h2>
            </div>

            <div className="marcas__resumen">
              <p>
                Somos representantes de estas marcas en la región, acercando
                sus productos originales a cada obra, taller e industria con
                stock local y asesoría directa.
              </p>

              {!loading && marcas.length > 0 && (
                <div className="marcas__pills">
                  <b>{marcas.length} marcas representadas</b>
                  <b>Distribución regional</b>
                </div>
              )}
            </div>
          </header>

          {loading ? (
            <div className="marcas__grilla" aria-label="Cargando marcas">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="tarjeta-marca--skeleton" />
              ))}
            </div>
          ) : marcas.length === 0 ? (
            <p className="marcas__vacio">
              No hay marcas destacadas disponibles.
            </p>
          ) : (
            <ul className="marcas__grilla">
              {marcas.map((marca) => (
                <li key={marca.id_marca}>
                  <button
                    type="button"
                    className="tarjeta-marca"
                    onClick={() => abrirMarca(marca.id_marca)}
                    aria-label={`Ver productos de ${marca.nom_marca}`}
                  >
                    {marca.logo_url ? (
                      <img
                        src={marca.logo_url}
                        alt={marca.nom_marca}
                        className="logo-marca"
                        loading="lazy"
                      />
                    ) : (
                      <span className="tarjeta-marca__nombre">
                        {marca.nom_marca}
                      </span>
                    )}

                    <span className="tarjeta-marca__cta" aria-hidden="true">
                      Ver productos
                      <span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3.5"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cinta.length > 0 && (
          <div className="marcas__cinta" aria-hidden="true">
            <div
              className="marcas__cinta-pista"
              style={{ "--marcas-duracion": `${cinta.length * 3}s` }}
            >
              <ul>
                {cinta.map((nombre, i) => <li key={`a-${i}`}>{nombre}</li>)}
              </ul>
              <ul>
                {cinta.map((nombre, i) => <li key={`b-${i}`}>{nombre}</li>)}
              </ul>
            </div>
          </div>
        )}
      </section>
    </FadeIn>
  );
}

export default Marcas;