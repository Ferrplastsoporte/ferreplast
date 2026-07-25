import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import ProductFilters from "../components/productos/ProductFilters"
import ProductList from "../components/productos/ProductList"
import "./css/Catalogo.css"

const PRODUCTOS_POR_PAGINA = 20

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
}

function Catalogo() {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const busquedaUrl =
    searchParams.get("buscar") || ""

  /*
   * El Navbar todavía utiliza:
   *
   * /catalogo?categoria=id
   *
   * Se mantiene ese parámetro en la URL para no
   * modificar todavía el Navbar, pero internamente
   * representa una familia.
   */
  const familiaUrl =
    searchParams.get("categoria") || ""

  const [productos, setProductos] = useState([])

  const [familias, setFamilias] = useState([])
  const [subcategorias, setSubcategorias] =
    useState([])

  const [marcas, setMarcas] = useState([])
  const [colores, setColores] = useState([])
  const [unidadesMedida, setUnidadesMedida] =
    useState([])
  const [pesos, setPesos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")

  const [paginaActual, setPaginaActual] =
    useState(1)

  const [totalProductos, setTotalProductos] =
    useState(0)

  const [filtros, setFiltros] = useState({
    ...FILTROS_INICIALES,
    busqueda: busquedaUrl,
    familia: familiaUrl,
  })

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      totalProductos / PRODUCTOS_POR_PAGINA
    )
  )

  /*
   * Al abrir el catálogo solo se cargan las familias
   * y las subcategorías.
   */
  useEffect(() => {
    cargarOpcionesIniciales()
  }, [])

  /*
   * Sincroniza la búsqueda y la familia recibidas
   * desde la URL.
   */
  useEffect(() => {
    setFiltros((filtrosActuales) => {
      const cambioFamilia =
        filtrosActuales.familia !== familiaUrl

      if (!cambioFamilia) {
        return {
          ...filtrosActuales,
          busqueda: busquedaUrl,
        }
      }

      return {
        ...filtrosActuales,
        busqueda: busquedaUrl,
        familia: familiaUrl,
        subcategoria: "",
        marca: "",
        color: "",
        unidadMedida: "",
        peso: "",
      }
    })

    setMarcas([])
    setColores([])
    setUnidadesMedida([])
    setPesos([])

    setPaginaActual(1)
  }, [busquedaUrl, familiaUrl])

  /*
   * Las características del producto solamente se
   * cargan cuando el cliente selecciona una
   * subcategoría.
   */
  useEffect(() => {
    if (!filtros.subcategoria) {
      setMarcas([])
      setColores([])
      setUnidadesMedida([])
      setPesos([])
      return
    }

    cargarCaracteristicasSubcategoria(
      filtros.subcategoria
    )
  }, [filtros.subcategoria])

  /*
   * Recarga los productos cuando cambia un filtro
   * o la página actual.
   */
  useEffect(() => {
    cargarProductos()
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
  ])

  async function cargarOpcionesIniciales() {
    const [
      respuestaFamilias,
      respuestaSubcategorias,
    ] = await Promise.all([
      supabase
        .from("familia")
        .select(`
          id_familia,
          nom_familia
        `)
        .order("nom_familia", {
          ascending: true,
        }),

      supabase
        .from("subcategoria")
        .select(`
          id_subcategoria,
          nom_subcategoria,
          id_familia
        `)
        .order("nom_subcategoria", {
          ascending: true,
        }),
    ])

    if (respuestaFamilias.error) {
      console.error(
        "Error al cargar familias:",
        respuestaFamilias.error
      )

      setFamilias([])
    } else {
      setFamilias(
        respuestaFamilias.data || []
      )
    }

    if (respuestaSubcategorias.error) {
      console.error(
        "Error al cargar subcategorías:",
        respuestaSubcategorias.error
      )

      setSubcategorias([])
    } else {
      setSubcategorias(
        respuestaSubcategorias.data || []
      )
    }
  }

  async function cargarCaracteristicasSubcategoria(
    idSubcategoria
  ) {
    setMarcas([])
    setColores([])
    setUnidadesMedida([])
    setPesos([])

    const { data, error } = await supabase
      .from("producto")
      .select(`
        id_marca,
        color_prod,
        peso_prod,
        id_und_medida,

        marca_producto (
          id_marca,
          nom_marca
        ),

        unidad_medida (
          id_und_medida,
          nom_und_medida
        )
      `)
      .eq(
        "id_subcategoria",
        Number(idSubcategoria)
      )
      .eq("est_prod", 1)

    if (error) {
      console.error(
        "Error al cargar las características de la subcategoría:",
        error
      )

      return
    }

    const productosSubcategoria = data || []

    const marcasUnicas = productosSubcategoria
      .filter(
        (producto) =>
          producto.marca_producto?.id_marca !==
            null &&
          producto.marca_producto?.id_marca !==
            undefined &&
          producto.marca_producto?.nom_marca
      )
      .map((producto) => ({
        id_marca:
          producto.marca_producto.id_marca,

        nom_marca:
          producto.marca_producto.nom_marca,
      }))
      .filter(
        (marca, indice, arreglo) =>
          arreglo.findIndex(
            (elemento) =>
              elemento.id_marca ===
              marca.id_marca
          ) === indice
      )
      .sort((a, b) =>
        a.nom_marca.localeCompare(
          b.nom_marca,
          "es"
        )
      )

    const coloresUnicos = [
      ...new Set(
        productosSubcategoria
          .map((producto) =>
            producto.color_prod?.trim()
          )
          .filter(Boolean)
      ),
    ].sort((a, b) =>
      a.localeCompare(b, "es")
    )

    const unidadesUnicas =
      productosSubcategoria
        .filter(
          (producto) =>
            producto.unidad_medida
              ?.id_und_medida !== null &&
            producto.unidad_medida
              ?.id_und_medida !== undefined &&
            producto.unidad_medida
              ?.nom_und_medida
        )
        .map((producto) => ({
          id_und_medida:
            producto.unidad_medida
              .id_und_medida,

          nom_und_medida:
            producto.unidad_medida
              .nom_und_medida,
        }))
        .filter(
          (unidad, indice, arreglo) =>
            arreglo.findIndex(
              (elemento) =>
                elemento.id_und_medida ===
                unidad.id_und_medida
            ) === indice
        )
        .sort((a, b) =>
          a.nom_und_medida.localeCompare(
            b.nom_und_medida,
            "es"
          )
        )

    const pesosUnicos = productosSubcategoria
      .filter(
        (producto) =>
          producto.peso_prod !== null &&
          producto.peso_prod !== undefined &&
          producto.id_und_medida !== null &&
          producto.id_und_medida !== undefined
      )
      .map((producto) => ({
        valor: Number(producto.peso_prod),

        id_und_medida:
          producto.id_und_medida,
      }))
      .filter(
        (peso, indice, arreglo) =>
          arreglo.findIndex(
            (elemento) =>
              elemento.valor === peso.valor &&
              elemento.id_und_medida ===
                peso.id_und_medida
          ) === indice
      )
      .sort(
        (a, b) => a.valor - b.valor
      )

    setMarcas(marcasUnicas)
    setColores(coloresUnicos)
    setUnidadesMedida(unidadesUnicas)
    setPesos(pesosUnicos)
  }

  function obtenerUrlImagen(rutaImagen) {
    if (!rutaImagen) {
      return ""
    }

    if (
      rutaImagen.startsWith("http://") ||
      rutaImagen.startsWith("https://")
    ) {
      return rutaImagen
    }

    const { data } = supabase.storage
      .from("imagenes_productos")
      .getPublicUrl(rutaImagen)

    return data.publicUrl
  }

  async function cargarProductos() {
    setCargando(true)
    setErrorCarga("")

    const desde =
      (paginaActual - 1) *
      PRODUCTOS_POR_PAGINA

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
          id_und_medida,
          id_subcategoria,
          id_marca,

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
        { count: "exact" }
      )
      .eq("est_prod", 1)

    if (filtros.busqueda.trim()) {
      consulta = consulta.ilike(
        "nom_prod",
        `%${filtros.busqueda.trim()}%`
      )
    }

    if (filtros.familia) {
      consulta = consulta.eq(
        "subcategoria.id_familia",
        Number(filtros.familia)
      )
    }

    if (filtros.subcategoria) {
      consulta = consulta.eq(
        "id_subcategoria",
        Number(filtros.subcategoria)
      )
    }

    if (filtros.marca) {
      consulta = consulta.eq(
        "id_marca",
        Number(filtros.marca)
      )
    }

    if (filtros.color) {
      consulta = consulta.eq(
        "color_prod",
        filtros.color
      )
    }

    if (filtros.unidadMedida) {
      consulta = consulta.eq(
        "id_und_medida",
        Number(filtros.unidadMedida)
      )
    }

    if (filtros.peso !== "") {
      consulta = consulta.eq(
        "peso_prod",
        Number(filtros.peso)
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
        consulta = consulta.order(
          "precio_act",
          { ascending: true }
        )
        break

      case "precio-mayor":
        consulta = consulta.order(
          "precio_act",
          { ascending: false }
        )
        break

      case "nombre-az":
        consulta = consulta.order(
          "nom_prod",
          { ascending: true }
        )
        break

      case "nombre-za":
        consulta = consulta.order(
          "nom_prod",
          { ascending: false }
        )
        break

      case "antiguos":
        consulta = consulta.order(
          "created_prod",
          { ascending: true }
        )
        break

      case "recientes":
      default:
        consulta = consulta.order(
          "created_prod",
          { ascending: false }
        )
        break
    }

    consulta = consulta.range(desde, hasta)

    const { data, error, count } =
      await consulta

    if (error) {
      console.error(
        "Error al cargar productos:",
        error
      )

      setProductos([])
      setTotalProductos(0)

      setErrorCarga(
        "No fue posible cargar los productos del catálogo."
      )

      setCargando(false)
      return
    }

    const productosAdaptados = (data || []).map(
      (producto) => ({
        ...producto,

        imagen_url: obtenerUrlImagen(
          producto.imagen_url
        ),
      })
    )

    setProductos(productosAdaptados)
    setTotalProductos(count || 0)
    setCargando(false)
  }

  function cambiarFiltro(nombre, valor) {
    setPaginaActual(1)

    /*
     * Al cambiar de familia, se limpian todos los
     * filtros que dependen de ella.
     */
    if (nombre === "familia") {
      const nuevosParametros =
        new URLSearchParams(searchParams)

      if (valor) {
        nuevosParametros.set(
          "categoria",
          valor
        )
      } else {
        nuevosParametros.delete("categoria")
      }

      setSearchParams(nuevosParametros)

      setFiltros((filtrosActuales) => ({
        ...filtrosActuales,
        familia: valor,
        subcategoria: "",
        marca: "",
        color: "",
        unidadMedida: "",
        peso: "",
      }))

      setMarcas([])
      setColores([])
      setUnidadesMedida([])
      setPesos([])

      return
    }

    /*
     * Al cambiar la subcategoría se limpian las
     * características anteriores.
     */
    if (nombre === "subcategoria") {
      setFiltros((filtrosActuales) => ({
        ...filtrosActuales,
        subcategoria: valor,
        marca: "",
        color: "",
        unidadMedida: "",
        peso: "",
      }))

      setMarcas([])
      setColores([])
      setUnidadesMedida([])
      setPesos([])

      return
    }

    /*
     * El peso depende de la unidad de medida.
     */
    if (nombre === "unidadMedida") {
      setFiltros((filtrosActuales) => ({
        ...filtrosActuales,
        unidadMedida: valor,
        peso: "",
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

    setMarcas([])
    setColores([])
    setUnidadesMedida([])
    setPesos([])

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

  /*
   * El filtro de peso solamente muestra valores
   * correspondientes a la unidad seleccionada.
   */
  const pesosFiltrados = filtros.unidadMedida
    ? pesos.filter(
        (peso) =>
          String(peso.id_und_medida) ===
          String(filtros.unidadMedida)
      )
    : []

  return (
    <main className="catalogo">
      <header className="catalogo__header">
        <div>
          <h1>Catálogo de productos</h1>

          <p>
            Encuentra materiales, herramientas y
            productos disponibles.
          </p>
        </div>
      </header>

      {busquedaUrl && (
        <div className="catalogo__busqueda">
          Resultados para:{" "}
          <strong>{busquedaUrl}</strong>
        </div>
      )}

      <div className="catalogo__contenido">
        <ProductFilters
          familias={familias}
          subcategorias={subcategorias}
          marcas={marcas}
          colores={colores}
          unidadesMedida={unidadesMedida}
          pesos={pesosFiltrados}
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
                <h2>
                  No se encontraron productos
                </h2>

                <p>
                  Prueba cambiando la familia,
                  subcategoría, marca, color, unidad
                  de medida, peso, precio o búsqueda.
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
                <ProductList
                  productos={productos}
                />

                {totalPaginas > 1 && (
                  <nav
                    className="catalogo__paginacion"
                    aria-label="Paginación del catálogo"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        cambiarPagina(
                          paginaActual - 1
                        )
                      }
                      disabled={paginaActual === 1}
                    >
                      Anterior
                    </button>

                    <span>
                      Página {paginaActual} de{" "}
                      {totalPaginas}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        cambiarPagina(
                          paginaActual + 1
                        )
                      }
                      disabled={
                        paginaActual ===
                        totalPaginas
                      }
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
  )
}

export default Catalogo