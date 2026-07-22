import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import ProductFilters from "../components/productos/ProductFilters"
import ProductList from "../components/productos/ProductList"
import "./css/Catalogo.css"

function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams()

  const busquedaUrl = searchParams.get("buscar") || ""
  const categoriaUrl = searchParams.get("categoria") || ""

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")

  const [paginaActual, setPaginaActual] = useState(1)
  const [totalProductos, setTotalProductos] = useState(0)

  const productosPorPagina = 20

  const [filtros, setFiltros] = useState({
    busqueda: busquedaUrl,
    categoria: categoriaUrl,
    precioMinimo: "",
    precioMaximo: "",
    orden: "recientes",
  })

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalProductos / productosPorPagina)
  )

  /*
   * Carga las categorías una sola vez.
   */
  useEffect(() => {
    cargarCategorias()
  }, [])

  /*
   * Sincroniza la búsqueda y categoría de la URL
   * con los filtros internos del catálogo.
   */
  useEffect(() => {
    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      busqueda: busquedaUrl,
      categoria: categoriaUrl,
    }))

    setPaginaActual(1)
  }, [busquedaUrl, categoriaUrl])

  /*
   * Vuelve a cargar los productos cuando cambian
   * los filtros o la página.
   */
  useEffect(() => {
    cargarProductos()
  }, [
    filtros.busqueda,
    filtros.categoria,
    filtros.precioMinimo,
    filtros.precioMaximo,
    filtros.orden,
    paginaActual,
  ])

  async function cargarCategorias() {
    const { data, error } = await supabase
      .from("categoria")
      .select("id_cat, nom_cat")
      .order("nom_cat", { ascending: true })

    if (error) {
      console.error("Error al cargar categorías:", error)
      setCategorias([])
      return
    }

    setCategorias(data || [])
  }

  async function cargarProductos() {
    setCargando(true)
    setErrorCarga("")

    const desde = (paginaActual - 1) * productosPorPagina
    const hasta = desde + productosPorPagina - 1

    let consulta = supabase
      .from("producto")
      .select(
        `
          id_prod,
          nom_prod,
          desc_prod,
          precio_prod,
          precio_act,
          imagen_url,
          created_prod,
          id_cat,
          est_prod,
          categoria (
            id_cat,
            nom_cat
          )
        `,
        { count: "exact" }
      )
      .eq("est_prod", 1)

    if (filtros.busqueda.trim()) {
      consulta = consulta.ilike(
        "nom_prod",
        `%${filtros.busqueda.trim()}%`
      )
    }

    if (filtros.categoria) {
      consulta = consulta.eq(
        "id_cat",
        Number(filtros.categoria)
      )
    }

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

    if (nombre === "categoria") {
      const nuevosParametros = new URLSearchParams(searchParams)

      if (valor) {
        nuevosParametros.set("categoria", valor)
      } else {
        nuevosParametros.delete("categoria")
      }

      setSearchParams(nuevosParametros)
    }

    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [nombre]: valor,
    }))
  }

  function limpiarFiltros() {
    setSearchParams({})

    setFiltros({
      busqueda: "",
      categoria: "",
      precioMinimo: "",
      precioMaximo: "",
      orden: "recientes",
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

            <button type="button" onClick={cargarProductos}>
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
                Prueba cambiando la categoría, el precio o la
                búsqueda.
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