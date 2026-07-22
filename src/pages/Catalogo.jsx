import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import ProductFilters from "../components/productos/ProductFilters"
import ProductList from "../components/productos/ProductList"
import "./css/Catalogo.css"

const PRODUCTOS_POR_PAGINA = 20

const FILTROS_INICIALES = {
  busqueda: "",
  categoria: "",
  subcategoria: "",
  color: "",
  peso: "",
  precioMinimo: "",
  precioMaximo: "",
  orden: "recientes",
}

function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams()

  const busquedaUrl = searchParams.get("buscar") || ""
  const categoriaUrl = searchParams.get("categoria") || ""

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [subcategorias, setSubcategorias] = useState([])
  const [colores, setColores] = useState([])
  const [pesos, setPesos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")

  const [paginaActual, setPaginaActual] = useState(1)
  const [totalProductos, setTotalProductos] = useState(0)

  const [filtros, setFiltros] = useState({
    ...FILTROS_INICIALES,
    busqueda: busquedaUrl,
    categoria: categoriaUrl,
  })

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA)
  )

  /*
   * Carga las opciones de los filtros.
   */
  useEffect(() => {
    cargarOpcionesFiltros()
  }, [])

  /*
   * Sincroniza el buscador y la categoría del Navbar
   * con los filtros internos del catálogo.
   */
  useEffect(() => {
    setFiltros((filtrosActuales) => {
      const cambioCategoria =
        filtrosActuales.categoria !== categoriaUrl

      return {
        ...filtrosActuales,
        busqueda: busquedaUrl,
        categoria: categoriaUrl,
        subcategoria: cambioCategoria
          ? ""
          : filtrosActuales.subcategoria,
      }
    })

    setPaginaActual(1)
  }, [busquedaUrl, categoriaUrl])

  /*
   * Recarga los productos cuando cambia un filtro
   * o la página actual.
   */
  useEffect(() => {
    cargarProductos()
  }, [
    filtros.busqueda,
    filtros.categoria,
    filtros.subcategoria,
    filtros.color,
    filtros.peso,
    filtros.precioMinimo,
    filtros.precioMaximo,
    filtros.orden,
    paginaActual,
  ])

  async function cargarOpcionesFiltros() {
    const [
      respuestaCategorias,
      respuestaSubcategorias,
      respuestaCaracteristicas,
    ] = await Promise.all([
      supabase
        .from("categoria")
        .select("id_cat, nom_cat")
        .order("nom_cat", { ascending: true }),

      supabase
        .from("subcategoria")
        .select(
          "id_subcategoria, nom_subcategoria, id_cat"
        )
        .order("nom_subcategoria", { ascending: true }),

      supabase
        .from("producto")
        .select("color_prod, peso_prod, unidad_de_medida")
        .eq("est_prod", 1),
    ])

    if (respuestaCategorias.error) {
      console.error(
        "Error al cargar categorías:",
        respuestaCategorias.error
      )
      setCategorias([])
    } else {
      setCategorias(respuestaCategorias.data || [])
    }

    if (respuestaSubcategorias.error) {
      console.error(
        "Error al cargar subcategorías:",
        respuestaSubcategorias.error
      )
      setSubcategorias([])
    } else {
      setSubcategorias(respuestaSubcategorias.data || [])
    }

    if (respuestaCaracteristicas.error) {
      console.error(
        "Error al cargar características:",
        respuestaCaracteristicas.error
      )
      setColores([])
      setPesos([])
      return
    }

    const productosCaracteristicas =
      respuestaCaracteristicas.data || []

    const coloresUnicos = [
      ...new Set(
        productosCaracteristicas
          .map((producto) => producto.color_prod?.trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b, "es"))

    const pesosUnicos = productosCaracteristicas
      .filter(
        (producto) =>
          producto.peso_prod !== null &&
          producto.peso_prod !== undefined &&
          producto.unidad_de_medida
      )
      .map((producto) => ({
        valor: `${producto.peso_prod}|${producto.unidad_de_medida}`,
        etiqueta: `${producto.peso_prod} ${producto.unidad_de_medida}`,
        peso: Number(producto.peso_prod),
        unidad: producto.unidad_de_medida,
      }))
      .filter(
        (peso, indice, arreglo) =>
          arreglo.findIndex(
            (elemento) => elemento.valor === peso.valor
          ) === indice
      )
      .sort((a, b) => {
        const comparacionUnidad = a.unidad.localeCompare(
          b.unidad,
          "es"
        )

        return comparacionUnidad || a.peso - b.peso
      })

    setColores(coloresUnicos)
    setPesos(pesosUnicos)
  }

  async function cargarProductos() {
    setCargando(true)
    setErrorCarga("")

    const desde =
      (paginaActual - 1) * PRODUCTOS_POR_PAGINA

    const hasta =
      desde + PRODUCTOS_POR_PAGINA - 1

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
          unidad_de_medida,
          id_subcategoria,
          subcategoria!inner (
            id_subcategoria,
            nom_subcategoria,
            id_cat,
            categoria (
              id_cat,
              nom_cat
            )
          )
        `,
        { count: "exact" }
      )
      .eq("est_prod", 1)

    /*
     * Búsqueda por nombre.
     */
    if (filtros.busqueda.trim()) {
      consulta = consulta.ilike(
        "nom_prod",
        `%${filtros.busqueda.trim()}%`
      )
    }

    /*
     * Categoría mediante la relación con subcategoria.
     */
    if (filtros.categoria) {
      consulta = consulta.eq(
        "subcategoria.id_cat",
        Number(filtros.categoria)
      )
    }

    /*
     * Subcategoría directa del producto.
     */
    if (filtros.subcategoria) {
      consulta = consulta.eq(
        "id_subcategoria",
        Number(filtros.subcategoria)
      )
    }

    if (filtros.color) {
      consulta = consulta.eq(
        "color_prod",
        filtros.color
      )
    }

    /*
     * El valor del filtro tiene formato:
     * peso|unidad, por ejemplo 1|kg.
     */
    if (filtros.peso) {
      const [peso, unidad] = filtros.peso.split("|")

      if (peso && unidad) {
        consulta = consulta
          .eq("peso_prod", Number(peso))
          .eq("unidad_de_medida", unidad)
      }
    }

    /*
     * Los rangos y el orden utilizan el precio actual,
     * ya que es el valor que pagará el cliente.
     */
    if (filtros.precioMinimo !== "") {
      consulta = consulta.gte(
        "precio_act",
        Number(filtros.precioMinimo)
      )
    }

    if (filtros.precioMaximo !== "") {
      consulta = consulta.lte(
        "precio_act",
        Number(filtros.precioMaximo)
      )
    }

    switch (filtros.orden) {
      case "precio-menor":
        consulta = consulta.order("precio_act", {
          ascending: true,
        })
        break

      case "precio-mayor":
        consulta = consulta.order("precio_act", {
          ascending: false,
        })
        break

      case "nombre-az":
        consulta = consulta.order("nom_prod", {
          ascending: true,
        })
        break

      case "nombre-za":
        consulta = consulta.order("nom_prod", {
          ascending: false,
        })
        break

      case "antiguos":
        consulta = consulta.order("created_prod", {
          ascending: true,
        })
        break

      case "recientes":
      default:
        consulta = consulta.order("created_prod", {
          ascending: false,
        })
        break
    }

    consulta = consulta.range(desde, hasta)

    const { data, error, count } = await consulta

    if (error) {
      console.error("Error al cargar productos:", error)

      setProductos([])
      setTotalProductos(0)
      setErrorCarga(
        "No fue posible cargar los productos del catálogo."
      )
      setCargando(false)
      return
    }

    setProductos(data || [])
    setTotalProductos(count || 0)
    setCargando(false)
  }

  function cambiarFiltro(nombre, valor) {
    setPaginaActual(1)

    /*
     * La categoría se guarda en la URL para mantenerla
     * sincronizada con el menú del Navbar.
     */
    if (nombre === "categoria") {
      const nuevosParametros = new URLSearchParams(
        searchParams
      )

      if (valor) {
        nuevosParametros.set("categoria", valor)
      } else {
        nuevosParametros.delete("categoria")
      }

      setSearchParams(nuevosParametros)

      setFiltros((filtrosActuales) => ({
        ...filtrosActuales,
        categoria: valor,
        subcategoria: "",
      }))

      return
    }

    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [nombre]: valor,
    }))
  }

  function limpiarFiltros() {
    setSearchParams({})

    setFiltros({
      ...FILTROS_INICIALES,
    })

    setPaginaActual(1)
  }

  function cambiarPagina(nuevaPagina) {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > totalPaginas ||
      nuevaPagina === paginaActual
    ) {
      return
    }

    setPaginaActual(nuevaPagina)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <main className="catalogo">
      <header className="catalogo__header">
        <div>
          <h1>Catálogo de productos</h1>

          <p>
            Encuentra materiales, herramientas y productos
            disponibles.
          </p>
        </div>
      </header>

      {busquedaUrl && (
        <div className="catalogo__busqueda">
          Resultados para: <strong>{busquedaUrl}</strong>
        </div>
      )}

      <ProductFilters
        categorias={categorias}
        subcategorias={subcategorias}
        colores={colores}
        pesos={pesos}
        filtros={filtros}
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
          <p className="catalogo__estado">
            Cargando productos...
          </p>
        )}

        {!cargando && errorCarga && (
          <div className="catalogo__error">
            <p>{errorCarga}</p>

            <button
              type="button"
              onClick={cargarProductos}
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando &&
          !errorCarga &&
          productos.length === 0 && (
            <div className="catalogo__vacio">
              <h2>No se encontraron productos</h2>

              <p>
                Prueba cambiando la categoría, subcategoría,
                color, peso, precio o búsqueda.
              </p>

              <button
                type="button"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            </div>
          )}

        {!cargando &&
          !errorCarga &&
          productos.length > 0 && (
            <>
              <ProductList productos={productos} />

              {totalPaginas > 1 && (
                <nav
                  className="catalogo__paginacion"
                  aria-label="Paginación del catálogo"
                >
                  <button
                    type="button"
                    onClick={() =>
                      cambiarPagina(paginaActual - 1)
                    }
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </button>

                  <span>
                    Página {paginaActual} de {totalPaginas}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarPagina(paginaActual + 1)
                    }
                    disabled={
                      paginaActual === totalPaginas
                    }
                  >
                    Siguiente
                  </button>
                </nav>
              )}
            </>
          )}
      </section>
    </main>
  )
}

export default Catalogo