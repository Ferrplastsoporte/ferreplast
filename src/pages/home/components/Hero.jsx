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
        a.nom_familia.localeCompare(
          b.nom_familia,
          "es"
        )
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
      familia.nom_familia
        .toLowerCase()
        .includes("resina")
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
          familia.id_familia !==
          familiaPrincipal.id_familia
      )
      .slice(0, 4);
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

        {/* Brillos ambientales */}

        <div className="hero__glow hero__glow--blue" />

        <div className="hero__glow hero__glow--red" />

        <div className="hero__content">

          {/* =========================
              INFORMACIÓN
          ========================= */}

          <div className="hero__info">

            <span className="hero__eyebrow">
              FERREPLAST · SOLUCIONES PROFESIONALES
            </span>

            <h1>
              Todo lo que necesitas
              <strong>para tus proyectos.</strong>
            </h1>

            <p>
              Descubre productos profesionales, materiales y
              soluciones de calidad para construcción,
              reparación y proyectos especializados.
            </p>

            <div className="hero__actions">

              <button
                type="button"
                className="hero__button hero__button--primary"
                onClick={abrirCatalogo}
              >
                Ver catálogo
                <span>→</span>
              </button>

              {familiaPrincipal && (
                <button
                  type="button"
                  className="hero__button hero__button--secondary"
                  onClick={() =>
                    abrirCategoria(
                      familiaPrincipal.id_familia
                    )
                  }
                >
                  Explorar categorías
                </button>
              )}

            </div>

            <div className="hero__stats">

              <div>
                <strong>
                  {loading
                    ? "..."
                    : familias.length}
                </strong>

                <span>
                  Categorías
                </span>
              </div>

              <div>
                <strong>100%</strong>

                <span>
                  Productos del catálogo
                </span>
              </div>

              <div>
                <strong>PRO</strong>

                <span>
                  Calidad profesional
                </span>
              </div>

            </div>

          </div>

          {/* =========================
              CATEGORÍA PRINCIPAL
          ========================= */}

          <div className="hero__featured">

            <div className="hero__featured-glow" />

            {loading ? (
              <div className="hero__loading">
                <div className="hero__loading-spinner" />
                <span>
                  Cargando categorías...
                </span>
              </div>
            ) : errorCarga ? (
              <div className="hero__empty">
                <span>⚠</span>

                <p>
                  {errorCarga}
                </p>

                <button
                  type="button"
                  onClick={cargarFamilias}
                >
                  Reintentar
                </button>
              </div>
            ) : familiaPrincipal ? (
              <>
                <img
                  src={
                    familiaPrincipal
                      .producto_destacado
                      .imagen_url
                  }
                  alt={
                    familiaPrincipal
                      .nom_familia
                  }
                  className="hero__featured-image"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      heroFallback;
                  }}
                />

                <div className="hero__featured-overlay" />

                <div className="hero__featured-content">

                  <span>
                    CATEGORÍA DESTACADA
                  </span>

                  <h2>
                    {familiaPrincipal.nom_familia}
                  </h2>

                  <p>
                    Explora productos disponibles
                    y encuentra la solución ideal
                    para tu proyecto.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      abrirCategoria(
                        familiaPrincipal.id_familia
                      )
                    }
                  >
                    Ver productos
                    <span>→</span>
                  </button>

                </div>

                <div className="hero__featured-badge">
                  <span>★</span>
                  Disponible en catálogo
                </div>
              </>
            ) : (
              <div className="hero__empty">
                <span>📦</span>

                <p>
                  Actualmente no hay categorías
                  disponibles.
                </p>

                <button
                  type="button"
                  onClick={abrirCatalogo}
                >
                  Ir al catálogo
                </button>
              </div>
            )}

          </div>

        </div>

        {/* =========================
            CATEGORÍAS DESDE BDD
        ========================= */}

        {!loading &&
          !errorCarga &&
          familiasSecundarias.length > 0 && (

            <div className="hero__categories">

              <div className="hero__categories-header">

                <div>
                  <span>
                    EXPLORA NUESTRO CATÁLOGO
                  </span>

                  <h2>
                    Encuentra lo que necesitas
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={abrirCatalogo}
                >
                  Ver todo →
                </button>

              </div>

              <div className="hero__category-list">

                {familiasSecundarias.map(
                  (familia, index) => (

                    <button
                      type="button"
                      key={familia.id_familia}
                      className="hero__category"
                      style={{
                        "--delay":
                          `${index * 0.08}s`,
                      }}
                      onClick={() =>
                        abrirCategoria(
                          familia.id_familia
                        )
                      }
                    >

                      <img
                        src={
                          familia
                            .producto_destacado
                            .imagen_url
                        }
                        alt={
                          familia.nom_familia
                        }
                        onError={(event) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            heroFallback;
                        }}
                      />

                      <span className="hero__category-overlay" />

                      <span className="hero__category-name">
                        {familia.nom_familia}
                      </span>

                      <span className="hero__category-arrow">
                        →
                      </span>

                    </button>

                  )
                )}

              </div>

            </div>
          )}

      </section>
    </FadeIn>
  );
}

export default Hero;