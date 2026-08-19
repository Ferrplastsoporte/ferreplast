import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import ProductFilters from "../../components/productos/ProductFilters";
import ProductList from "../../components/productos/ProductList";
import "../css/Catalogo.css";

const PRODUCTOS_POR_PAGINA = 20;
const TAMANO_LOTE_FILTROS = 1000;

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

function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const busquedaUrl = searchParams.get("buscar") || "";
  const familiaUrl = searchParams.get("categoria") || "";
  const marcaUrl = searchParams.get("marca") || "";

  const [productos, setProductos] = useState([]);

  const [productosParaFiltros, setProductosParaFiltros] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoFiltros, setCargandoFiltros] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);

  const [filtros, setFiltros] = useState({
    ...FILTROS_INICIALES,
    busqueda: busquedaUrl,
    familia: familiaUrl,
    marca: marcaUrl,
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA),
  );

  useEffect(() => {
    cargarBaseFiltros();
  }, []);

  useEffect(() => {
    setFiltros((actuales) => ({
      ...actuales,
      busqueda: busquedaUrl,
      familia: familiaUrl,
      marca: marcaUrl,
    }));

    setPaginaActual(1);
  }, [busquedaUrl, familiaUrl, marcaUrl]);

  useEffect(() => {
    cargarProductos();
  }, [
    filtros.busqueda,
    filtros.familia,
    filtros.subcategoria,
    filtros.marca,
    filtros.color,
    filtros.unidadMedida,
    filtros.peso,
    filtros.precioMinimo,
    filtros.precioMaximo,
    filtros.orden,
    paginaActual,
  ]);

  async function cargarBaseFiltros() {
    setCargandoFiltros(true);

    try {
      let desde = 0;
      let continuar = true;

      const productosAcumulados = [];

      while (continuar) {
        const hasta = desde + TAMANO_LOTE_FILTROS - 1;

        const { data, error } = await supabase
          .from("producto")
          .select(
            `
            id_prod,
            nom_prod,
            precio_act,
            color_prod,
            peso_prod,
            id_und_medida,
            id_subcategoria,
            id_marca,

            unidad_medida (
              id_und_medida,
              nom_und_medida
            ),

            marca_producto (
              id_marca,
              nom_marca
            ),

            subcategoria (
              id_subcategoria,
              nom_subcategoria,
              id_familia,

              familia (
                id_familia,
                nom_familia
              )
            )
          `,
          )
          .eq("est_prod", 2)
          .range(desde, hasta);

        if (error) {
          throw error;
        }

        const lote = data || [];

        productosAcumulados.push(...lote);

        continuar = lote.length === TAMANO_LOTE_FILTROS;
        desde += TAMANO_LOTE_FILTROS;
      }

      setProductosParaFiltros(productosAcumulados);
    } catch (error) {
      console.error("Error al cargar la información para los filtros:", error);

      setProductosParaFiltros([]);
    } finally {
      setCargandoFiltros(false);
    }
  }

  function productoCumpleFiltros(producto, ignorar = "") {
    const textoBusqueda = filtros.busqueda.trim().toLowerCase();

    if (
      ignorar !== "busqueda" &&
      textoBusqueda &&
      !producto.nom_prod?.toLowerCase().includes(textoBusqueda)
    ) {
      return false;
    }

    if (
      ignorar !== "familia" &&
      filtros.familia &&
      String(producto.subcategoria?.id_familia) !== String(filtros.familia)
    ) {
      return false;
    }

    if (
      ignorar !== "subcategoria" &&
      filtros.subcategoria &&
      String(producto.id_subcategoria) !== String(filtros.subcategoria)
    ) {
      return false;
    }

    if (
      ignorar !== "marca" &&
      filtros.marca &&
      String(producto.id_marca) !== String(filtros.marca)
    ) {
      return false;
    }

    if (
      ignorar !== "color" &&
      filtros.color &&
      producto.color_prod !== filtros.color
    ) {
      return false;
    }

    if (
      ignorar !== "unidadMedida" &&
      filtros.unidadMedida &&
      String(producto.id_und_medida) !== String(filtros.unidadMedida)
    ) {
      return false;
    }

    if (
      ignorar !== "peso" &&
      filtros.peso !== "" &&
      Number(producto.peso_prod) !== Number(filtros.peso)
    ) {
      return false;
    }

    if (
      ignorar !== "precioMinimo" &&
      filtros.precioMinimo !== "" &&
      Number(producto.precio_act) < Number(filtros.precioMinimo)
    ) {
      return false;
    }

    if (
      ignorar !== "precioMaximo" &&
      filtros.precioMaximo !== "" &&
      Number(producto.precio_act) > Number(filtros.precioMaximo)
    ) {
      return false;
    }

    return true;
  }

  const familias = useMemo(() => {
    const mapa = new Map();

    productosParaFiltros
      .filter((producto) => productoCumpleFiltros(producto, "familia"))
      .forEach((producto) => {
        const familia = producto.subcategoria?.familia;

        if (
          familia?.id_familia !== null &&
          familia?.id_familia !== undefined &&
          familia?.nom_familia
        ) {
          mapa.set(String(familia.id_familia), {
            id_familia: familia.id_familia,
            nom_familia: familia.nom_familia,
          });
        }
      });

    return [...mapa.values()].sort((a, b) =>
      a.nom_familia.localeCompare(b.nom_familia, "es"),
    );
  }, [productosParaFiltros, filtros]);

  const subcategorias = useMemo(() => {
    const mapa = new Map();

    productosParaFiltros
      .filter((producto) => productoCumpleFiltros(producto, "subcategoria"))
      .forEach((producto) => {
        const subcategoria = producto.subcategoria;

        if (
          subcategoria?.id_subcategoria !== null &&
          subcategoria?.id_subcategoria !== undefined &&
          subcategoria?.nom_subcategoria
        ) {
          mapa.set(String(subcategoria.id_subcategoria), {
            id_subcategoria: subcategoria.id_subcategoria,
            nom_subcategoria: subcategoria.nom_subcategoria,
            id_familia: subcategoria.id_familia,
          });
        }
      });

    return [...mapa.values()].sort((a, b) =>
      a.nom_subcategoria.localeCompare(b.nom_subcategoria, "es"),
    );
  }, [productosParaFiltros, filtros]);

  const marcas = useMemo(() => {
    const mapa = new Map();

    productosParaFiltros
      .filter((producto) => productoCumpleFiltros(producto, "marca"))
      .forEach((producto) => {
        const marca = producto.marca_producto;

        if (
          marca?.id_marca !== null &&
          marca?.id_marca !== undefined &&
          marca?.nom_marca
        ) {
          mapa.set(String(marca.id_marca), {
            id_marca: marca.id_marca,
            nom_marca: marca.nom_marca,
          });
        }
      });

    return [...mapa.values()].sort((a, b) =>
      a.nom_marca.localeCompare(b.nom_marca, "es"),
    );
  }, [productosParaFiltros, filtros]);

  const colores = useMemo(() => {
    const valores = productosParaFiltros
      .filter((producto) => productoCumpleFiltros(producto, "color"))
      .map((producto) => producto.color_prod?.trim())
      .filter(Boolean);

    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, "es"));
  }, [productosParaFiltros, filtros]);

  const unidadesMedida = useMemo(() => {
    const mapa = new Map();

    productosParaFiltros
      .filter((producto) => productoCumpleFiltros(producto, "unidadMedida"))
      .forEach((producto) => {
        const unidad = producto.unidad_medida;

        if (
          unidad?.id_und_medida !== null &&
          unidad?.id_und_medida !== undefined &&
          unidad?.nom_und_medida
        ) {
          mapa.set(String(unidad.id_und_medida), {
            id_und_medida: unidad.id_und_medida,
            nom_und_medida: unidad.nom_und_medida,
          });
        }
      });

    return [...mapa.values()].sort((a, b) =>
      a.nom_und_medida.localeCompare(b.nom_und_medida, "es"),
    );
  }, [productosParaFiltros, filtros]);

  const pesos = useMemo(() => {
    const mapa = new Map();

    productosParaFiltros
      .filter((producto) => productoCumpleFiltros(producto, "peso"))
      .filter((producto) => {
        if (!filtros.unidadMedida) {
          return true;
        }

        return String(producto.id_und_medida) === String(filtros.unidadMedida);
      })
      .forEach((producto) => {
        if (
          producto.peso_prod === null ||
          producto.peso_prod === undefined ||
          producto.id_und_medida === null ||
          producto.id_und_medida === undefined
        ) {
          return;
        }

        const valor = Number(producto.peso_prod);

        const clave = `${producto.id_und_medida}-${valor}`;

        mapa.set(clave, {
          valor,
          id_und_medida: producto.id_und_medida,
        });
      });

    return [...mapa.values()].sort((a, b) => a.valor - b.valor);
  }, [productosParaFiltros, filtros]);

  useEffect(() => {
    if (cargandoFiltros) {
      return;
    }

    setFiltros((actuales) => {
      const nuevos = {
        ...actuales,
      };

      let huboCambio = false;

      if (
        actuales.familia &&
        !familias.some(
          (familia) => String(familia.id_familia) === String(actuales.familia),
        )
      ) {
        nuevos.familia = "";
        huboCambio = true;
      }

      if (
        actuales.subcategoria &&
        !subcategorias.some(
          (subcategoria) =>
            String(subcategoria.id_subcategoria) ===
            String(actuales.subcategoria),
        )
      ) {
        nuevos.subcategoria = "";
        huboCambio = true;
      }

      if (
        actuales.marca &&
        !marcas.some(
          (marca) => String(marca.id_marca) === String(actuales.marca),
        )
      ) {
        nuevos.marca = "";
        huboCambio = true;
      }

      if (actuales.color && !colores.includes(actuales.color)) {
        nuevos.color = "";
        huboCambio = true;
      }

      if (
        actuales.unidadMedida &&
        !unidadesMedida.some(
          (unidad) =>
            String(unidad.id_und_medida) === String(actuales.unidadMedida),
        )
      ) {
        nuevos.unidadMedida = "";
        nuevos.peso = "";
        huboCambio = true;
      }

      if (
        actuales.peso !== "" &&
        !pesos.some((peso) => Number(peso.valor) === Number(actuales.peso))
      ) {
        nuevos.peso = "";
        huboCambio = true;
      }

      return huboCambio ? nuevos : actuales;
    });
  }, [
    cargandoFiltros,
    familias,
    subcategorias,
    marcas,
    colores,
    unidadesMedida,
    pesos,
  ]);

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

  async function cargarProductos() {
    setCargando(true);
    setErrorCarga("");

    const desde = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
    const hasta = desde + PRODUCTOS_POR_PAGINA - 1;

    let consulta = supabase
      .from("producto")
      .select(
        `
          id_prod,
          nom_prod,
          desc_prod,
          detalle_prod,
          precio_prod,
          precio_act,
          imagen_url,
          created_prod,
          est_prod,
          color_prod,
          peso_prod,
          id_und_medida,
          id_subcategoria,
          id_marca,
          stock_prod,

          unidad_medida (
            id_und_medida,
            nom_und_medida
          ),

          marca_producto (
            id_marca,
            nom_marca,
            marca_destacar,
            logo_url
          ),

          estado_producto (
            id_est_prod,
            nom_est_prod
          ),

          subcategoria!inner (
            id_subcategoria,
            nom_subcategoria,
            id_familia,

            familia (
              id_familia,
              nom_familia
            )
          )
        `,
        {
          count: "exact",
        },
      )
      .eq("est_prod", 2);

    if (filtros.busqueda.trim()) {
      consulta = consulta.ilike("nom_prod", `%${filtros.busqueda.trim()}%`);
    }

    if (filtros.familia) {
      consulta = consulta.eq(
        "subcategoria.id_familia",
        Number(filtros.familia),
      );
    }

    if (filtros.subcategoria) {
      consulta = consulta.eq("id_subcategoria", Number(filtros.subcategoria));
    }

    if (filtros.marca) {
      consulta = consulta.eq("id_marca", Number(filtros.marca));
    }

    if (filtros.color) {
      consulta = consulta.eq("color_prod", filtros.color);
    }

    if (filtros.unidadMedida) {
      consulta = consulta.eq("id_und_medida", Number(filtros.unidadMedida));
    }

    if (filtros.peso !== "") {
      consulta = consulta.eq("peso_prod", Number(filtros.peso));
    }

    if (filtros.precioMinimo !== "") {
      consulta = consulta.gte("precio_act", Number(filtros.precioMinimo));
    }

    if (filtros.precioMaximo !== "") {
      consulta = consulta.lte("precio_act", Number(filtros.precioMaximo));
    }

    switch (filtros.orden) {
      case "precio-menor":
        consulta = consulta.order("precio_act", {
          ascending: true,
        });
        break;

      case "precio-mayor":
        consulta = consulta.order("precio_act", {
          ascending: false,
        });
        break;

      case "nombre-az":
        consulta = consulta.order("nom_prod", {
          ascending: true,
        });
        break;

      case "nombre-za":
        consulta = consulta.order("nom_prod", {
          ascending: false,
        });
        break;

      case "antiguos":
        consulta = consulta.order("created_prod", {
          ascending: true,
        });
        break;

      case "recientes":
      default:
        consulta = consulta.order("created_prod", {
          ascending: false,
        });
        break;
    }

    consulta = consulta.range(desde, hasta);

    const { data, error, count } = await consulta;

    if (error) {
      console.error("Error al cargar productos:", error);

      setProductos([]);
      setTotalProductos(0);

      setErrorCarga("No fue posible cargar los productos del catálogo.");

      setCargando(false);
      return;
    }

    const productosAdaptados = (data || []).map((producto) => ({
      ...producto,

      imagen_url: obtenerUrlImagen(producto.imagen_url),
    }));

    setProductos(productosAdaptados);
    setTotalProductos(count || 0);

    setCargando(false);
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
      actualizarParametroUrl(nombre, valor);
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
        <ProductFilters
          familias={familias}
          subcategorias={subcategorias}
          marcas={marcas}
          colores={colores}
          unidadesMedida={unidadesMedida}
          pesos={pesos}
          filtros={filtros}
          cargandoOpciones={cargandoFiltros}
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

              <button type="button" onClick={cargarProductos}>
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
              <ProductList productos={productos} />

              {totalPaginas > 1 && (
                <nav
                  className="catalogo__paginacion"
                  aria-label="Paginación del catálogo"
                >
                  <button
                    type="button"
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </button>

                  <span>
                    Página {paginaActual} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
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
