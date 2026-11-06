import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { buscarProductosCatalogo, obtenerOpcionesCatalogo } from "../../services/catalogoService";
import { resolverFiltrosCatalogo, crearOpcionesFiltrosCatalogo } from "../../utils/catalogo/filtrosCatalogo";
import FiltrosProducto from "../../components/productos/FiltrosProducto";
import ListaProductos from "../../components/productos/ListaProductos";
import { normalizarTerminoBusqueda } from "../../utils/comunes/busqueda";
import "./css/Catalogo.css";
import flechaAnterior from "../../assets/iconos/catalogo_paginador/flecha_atras_catalogo.png";
import flechaSiguiente from "../../assets/iconos/catalogo_paginador/flecha_siguiente_catalogo - copia.png";

const PRODUCTOS_POR_PAGINA = 20;
const OPCIONES_INICIALES = { familias: [], subcategorias: [], marcas: [], unidadesMedida: [], productos: [] };

const FILTROS_INICIALES = {
  busqueda: "",
  familia: "",
  subcategoria: "",
  marca: "",
  color: "",
  unidadMedida: "",
  peso: "",
  precioMinimo: "",
  precioMaximo: "",
  orden: "recientes",
};

function obtenerUrlImagen(rutaImagen) {
  if (!rutaImagen) {
    return "";
  }

  if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
    return rutaImagen;
  }

  const { data } = supabase.storage
    .from("imagenes_productos")
    .getPublicUrl(rutaImagen);

  return data.publicUrl;
}

function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const busquedaUrl = normalizarTerminoBusqueda(
    searchParams.get("buscar") || "",
  );
  const familiaUrl = searchParams.get("categoria") || "";
  const marcaUrl = searchParams.get("marca") || "";

  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);

  const [baseFiltros, setBaseFiltros] = useState(OPCIONES_INICIALES);

  const [cargandoFiltros, setCargandoFiltros] = useState(true);
  const [errorFiltros, setErrorFiltros] = useState("");
  const [reintentoFiltros, setReintentoFiltros] = useState(0);

  const [paginacion, setPaginacion] = useState({ clave: "", pagina: 1 });
  const [reintentoBusqueda, setReintentoBusqueda] = useState(0);

  const [filtrosLocales, setFiltros] = useState(FILTROS_INICIALES);
  const filtros = useMemo(() => resolverFiltrosCatalogo(
    filtrosLocales,
    { busqueda: busquedaUrl, familia: familiaUrl, marca: marcaUrl },
    baseFiltros.subcategorias,
  ), [filtrosLocales, busquedaUrl, familiaUrl, marcaUrl, baseFiltros.subcategorias]);
  const claveFiltros = JSON.stringify(filtros);
  const paginaActual = paginacion.clave === claveFiltros ? paginacion.pagina : 1;
  function setPaginaActual(pagina) {
    setPaginacion({ clave: claveFiltros, pagina });
  }

  const claveBusqueda = JSON.stringify({ filtros, pagina: paginaActual, reintentoBusqueda });
  const cargando = resultadoBusqueda?.clave !== claveBusqueda;
  const productos = resultadoBusqueda?.productos ?? [];
  const totalProductos = resultadoBusqueda?.total ?? 0;
  const errorCarga = cargando ? "" : resultadoBusqueda?.error ?? "";

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA),
  );

  useEffect(() => {
    const controller = new AbortController();
    obtenerOpcionesCatalogo(controller.signal).then((opciones) => {
      if (!controller.signal.aborted) setBaseFiltros(opciones);
    }).catch((error) => {
      if (controller.signal.aborted) return;
      console.error("Error al cargar las opciones del catálogo:", { codigo: error?.code, estado: error?.status });
      setErrorFiltros("No se pudieron cargar los filtros. Puedes volver a intentarlo.");
    }).finally(() => {
      if (!controller.signal.aborted) setCargandoFiltros(false);
    });
    return () => controller.abort();
  }, [reintentoFiltros]);

  useEffect(() => {
    const controller = new AbortController();
    const { filtros: filtrosConsulta, pagina } = JSON.parse(claveBusqueda);

    buscarProductosCatalogo({
      filtros: filtrosConsulta,
      pagina,
      tamanoPagina: PRODUCTOS_POR_PAGINA,
      signal: controller.signal,
    }).then(({ productos: encontrados, total }) => {
      if (controller.signal.aborted) return;
      setResultadoBusqueda({
        clave: claveBusqueda,
        productos: encontrados.map((producto) => ({
          ...producto,
          imagen_url: obtenerUrlImagen(producto.imagen_url),
        })),
        total,
        error: "",
      });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      console.error("Error al buscar productos:", { codigo: error?.code, estado: error?.status });
      setResultadoBusqueda({
        clave: claveBusqueda,
        productos: [],
        total: 0,
        error: "No fue posible cargar los productos del catálogo.",
      });
    });

    return () => controller.abort();
  }, [claveBusqueda]);

  const { familias, subcategorias, marcas, colores, unidadesMedida, pesos } = useMemo(
    () => crearOpcionesFiltrosCatalogo(baseFiltros, filtros),
    [baseFiltros, filtros],
  );

  function reintentarCargaFiltros() {
    if (cargandoFiltros) return;
    setCargandoFiltros(true);
    setErrorFiltros("");
    setReintentoFiltros((intento) => intento + 1);
  }

  function actualizarParametroUrl(nombre, valor) {
    const nuevosParametros = new URLSearchParams(searchParams);

    if (nombre === "familia") {
      if (valor) {
        nuevosParametros.set("categoria", valor);
      } else {
        nuevosParametros.delete("categoria");
      }
    }

    if (nombre === "marca") {
      if (valor) {
        nuevosParametros.set("marca", valor);
      } else {
        nuevosParametros.delete("marca");
      }
    }

    setSearchParams(nuevosParametros);
  }

  function cambiarFiltro(nombre, valor) {
    setPaginaActual(1);

    if (nombre === "familia" || nombre === "marca") {
      if (nombre === "familia") {
        setFiltros((actuales) => ({ ...actuales, subcategoria: "" }));
      }
      actualizarParametroUrl(nombre, valor);
      return;
    }

    if (nombre === "unidadMedida") {
      setFiltros((actuales) => ({
        ...actuales,
        unidadMedida: valor,
        peso: "",
      }));

      return;
    }

    setFiltros((actuales) => ({
      ...actuales,
      [nombre]: valor,
    }));
  }

  function limpiarFiltros() {
    setSearchParams({});

    setFiltros({
      ...FILTROS_INICIALES,
    });

    setPaginaActual(1);
  }

  function cambiarPagina(nuevaPagina) {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > totalPaginas ||
      nuevaPagina === paginaActual
    ) {
      return;
    }

    setPaginaActual(nuevaPagina);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="catalogo">
      <header className="catalogo__header">
        <div>
          <h1>Catálogo de productos</h1>

          <p>Encuentra materiales, herramientas y productos disponibles.</p>
        </div>
      </header>

      {busquedaUrl && (
        <div className="catalogo__busqueda">
          Resultados para: <strong>{busquedaUrl}</strong>
        </div>
      )}

      <div className="catalogo__contenido">
        <FiltrosProducto
          familias={familias}
          subcategorias={subcategorias}
          marcas={marcas}
          colores={colores}
          unidadesMedida={unidadesMedida}
          pesos={pesos}
          filtros={filtros}
          cargandoOpciones={cargandoFiltros}
          errorOpciones={errorFiltros}
          onReintentarOpciones={reintentarCargaFiltros}
          onCambiarFiltro={cambiarFiltro}
          onLimpiarFiltros={limpiarFiltros}
        />

        <section className="catalogo__resultados">
          {!cargando && !errorCarga && (
            <p className="catalogo__cantidad">
              {totalProductos === 1
                ? "1 producto encontrado"
                : `${totalProductos} productos encontrados`}
            </p>
          )}

          {cargando && (
            <p className="catalogo__estado">Cargando productos...</p>
          )}

          {!cargando && errorCarga && (
            <div className="catalogo__error">
              <p>{errorCarga}</p>

              <button type="button" onClick={() => setReintentoBusqueda((intento) => intento + 1)}>
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !errorCarga && productos.length === 0 && (
            <div className="catalogo__vacio">
              <h2>No se encontraron productos</h2>

              <p>Prueba modificando alguno de los filtros seleccionados.</p>

              <button type="button" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          )}

          {!cargando && !errorCarga && productos.length > 0 && (
            <>
              <ListaProductos productos={productos} />

              {totalPaginas > 1 && (
                <nav
                  className="catalogo__paginacion"
                  aria-label="Paginación del catálogo"
                >
                  <button
                    type="button"
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="catalogo__boton-pagina"
                    aria-label="Página anterior"
                  >
                    <img src={flechaAnterior} alt="" />
                  </button>

                  <span>
                    Página {paginaActual} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="catalogo__boton-pagina"
                    aria-label="Página siguiente"
                  >
                    <img src={flechaSiguiente} alt="" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Catalogo;
