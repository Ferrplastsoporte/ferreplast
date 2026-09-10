import "../css/home.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../../lib/supabase";
import FadeIn from "../../../animations/FadeIn";

import heroFallback from "../../../assets/hero.png";

const MAX_CATEGORIAS = 5;

function Hero() {
  const navigate = useNavigate();

  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    cargarFamilias();
  }, []);

  function obtenerUrlImagen(rutaImagen) {
    if (!rutaImagen) {
      return heroFallback;
    }

    if (
      rutaImagen.startsWith("http://") ||
      rutaImagen.startsWith("https://")
    ) {
      return rutaImagen;
    }

    const { data } = supabase.storage
      .from("imagenes_productos")
      .getPublicUrl(rutaImagen);

    return data?.publicUrl || heroFallback;
  }

  async function cargarFamilias() {
    setLoading(true);
    setErrorCarga("");

    const { data, error } = await supabase
      .from("producto")
      .select(`
        id_prod,
        nom_prod,
        imagen_url,
        created_prod,

        subcategoria (
          id_subcategoria,
          id_familia,

          familia (
            id_familia,
            nom_familia
          )
        )
      `)
      .eq("est_prod", 2)
      .order("created_prod", {
        ascending: false,
      })
      .limit(100);

    if (error) {
      console.error("Error al cargar categorías del Hero:", error);
      setFamilias([]);
      setErrorCarga("No fue posible cargar las categorías.");
      setLoading(false);
      return;
    }

    const mapaFamilias = new Map();

    (data || []).forEach((producto) => {
      const familia = producto.subcategoria?.familia;

      if (!familia?.id_familia || !familia?.nom_familia) {
        return;
      }

      const idFamilia = String(familia.id_familia);

      if (!mapaFamilias.has(idFamilia)) {
        mapaFamilias.set(idFamilia, {
          id_familia: familia.id_familia,
          nom_familia: familia.nom_familia,
          producto_destacado: {
            id_prod: producto.id_prod,
            nom_prod: producto.nom_prod,
            imagen_url: obtenerUrlImagen(producto.imagen_url),
          },
        });
      }
    });

    const familiasOrdenadas = [...mapaFamilias.values()]
      .sort((a, b) =>
        a.nom_familia.localeCompare(b.nom_familia, "es")
      )
      .slice(0, MAX_CATEGORIAS);

    setFamilias(familiasOrdenadas);
    setLoading(false);
  }

  const familiaPrincipal = useMemo(() => {
    if (familias.length === 0) {
      return null;
    }

    const resinas = familias.find((familia) =>
      familia.nom_familia.toLowerCase().includes("resina")
    );

    return resinas || familias[0];
  }, [familias]);

  const familiasSecundarias = useMemo(() => {
    if (!familiaPrincipal) {
      return [];
    }

    return familias
      .filter(
        (familia) =>
          familia.id_familia !== familiaPrincipal.id_familia
      )
      .slice(0, 3);
  }, [familias, familiaPrincipal]);

  function abrirCategoria(idFamilia) {
    navigate(`/catalogo?categoria=${idFamilia}`);
  }

  function abrirCatalogo() {
    navigate("/catalogo");
  }

  return (
    <FadeIn>
      <section className="hero">
        <div className="hero__glow hero__glow--blue" />

        <div className="hero__content">
          <div className="hero__info">
            <span className="hero__eyebrow">
              FERREPLAST · SOLUCIONES PROFESIONALES
            </span>

            <h1>
              Materiales para
              <strong> proyectos que duran.</strong>
            </h1>

            <p>
              Resinas, herramientas y productos profesionales para
              construcción, reparación y proyectos especializados.
            </p>

            <div className="hero__actions">
              <button
                type="button"
                className="hero__button hero__button--primary"
                onClick={abrirCatalogo}
              >
                Ver productos
                <span>→</span>
              </button>

              {familiaPrincipal && (
                <button
                  type="button"
                  className="hero__button hero__button--secondary"
                  onClick={() =>
                    abrirCategoria(familiaPrincipal.id_familia)
                  }
                >
                  {familiaPrincipal.nom_familia}
                </button>
              )}
            </div>

            <div className="hero__stats">
              <div>
                <strong>{loading ? "..." : familias.length}</strong>
                <span>Categorías disponibles</span>
              </div>

              <div>
                <strong>PRO</strong>
                <span>Calidad profesional</span>
              </div>

              <div>
                <strong>PM</strong>
                <span>Desde Puerto Montt</span>
              </div>
            </div>
          </div>

          <div className="hero__featured">
            {loading ? (
              <div className="hero__loading">
                <div className="hero__loading-spinner" />
                <span>Preparando productos...</span>
              </div>
            ) : errorCarga ? (
              <div className="hero__empty">
                <span>⚠</span>
                <p>{errorCarga}</p>
                <button type="button" onClick={cargarFamilias}>
                  Reintentar
                </button>
              </div>
            ) : familiaPrincipal ? (
              <>
                <img
                  src={familiaPrincipal.producto_destacado.imagen_url}
                  alt={familiaPrincipal.nom_familia}
                  className="hero__featured-image"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = heroFallback;
                  }}
                />

                <div className="hero__featured-overlay" />

                <div className="hero__featured-content">
                  <span>DESTACADO</span>

                  <h2>{familiaPrincipal.nom_familia}</h2>

                  <p>
                    Encuentra productos seleccionados para tus
                    proyectos en un solo lugar.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      abrirCategoria(familiaPrincipal.id_familia)
                    }
                  >
                    Explorar categoría
                    <span>→</span>
                  </button>
                </div>

                <div className="hero__featured-badge">
                  <span>✓</span>
                  Productos disponibles
                </div>

                {familiasSecundarias.length > 0 && (
                  <div className="hero__quick-categories">
                    <span>También puedes buscar</span>

                    <div>
                      {familiasSecundarias.map((familia) => (
                        <button
                          key={familia.id_familia}
                          type="button"
                          onClick={() =>
                            abrirCategoria(familia.id_familia)
                          }
                        >
                          {familia.nom_familia}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="hero__empty">
                <span>📦</span>
                <p>No hay categorías disponibles actualmente.</p>
                <button type="button" onClick={abrirCatalogo}>
                  Ir al catálogo
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

export default Hero;
