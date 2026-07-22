import { useEffect, useMemo, useState } from "react"

function ProductFilters({
  categorias,
  subcategorias,
  colores,
  pesos,
  filtros,
  onCambiarFiltro,
  onLimpiarFiltros,
}) {
  const [precioMinimo, setPrecioMinimo] = useState(
    filtros.precioMinimo
  )

  const [precioMaximo, setPrecioMaximo] = useState(
    filtros.precioMaximo
  )

  const [errorPrecio, setErrorPrecio] = useState("")

  useEffect(() => {
    setPrecioMinimo(filtros.precioMinimo)
    setPrecioMaximo(filtros.precioMaximo)
    setErrorPrecio("")
  }, [filtros.precioMinimo, filtros.precioMaximo])

  const subcategoriasFiltradas = useMemo(() => {
    if (!filtros.categoria) {
      return subcategorias
    }

    return subcategorias.filter(
      (subcategoria) =>
        String(subcategoria.id_cat) ===
        String(filtros.categoria)
    )
  }, [subcategorias, filtros.categoria])

  function obtenerNumero(valor) {
    return String(valor).replace(/\D/g, "")
  }

  function formatearPrecio(valor) {
    if (!valor) {
      return ""
    }

    const numero = Number(obtenerNumero(valor))

    if (Number.isNaN(numero)) {
      return ""
    }

    return `$${new Intl.NumberFormat("es-CL").format(numero)}`
  }

  function aplicarPrecios() {
    const minimo = precioMinimo
      ? Number(precioMinimo)
      : null

    const maximo = precioMaximo
      ? Number(precioMaximo)
      : null

    if (
      minimo !== null &&
      maximo !== null &&
      minimo > maximo
    ) {
      setErrorPrecio(
        "El precio máximo debe ser mayor o igual al precio mínimo."
      )
      return
    }

    setErrorPrecio("")

    onCambiarFiltro("precioMinimo", precioMinimo)
    onCambiarFiltro("precioMaximo", precioMaximo)
  }

  function limpiarTodo() {
    setPrecioMinimo("")
    setPrecioMaximo("")
    setErrorPrecio("")
    onLimpiarFiltros()
  }

  function manejarEnter(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault()
      aplicarPrecios()
    }
  }

  function cambiarCategoria(valor) {
    onCambiarFiltro("categoria", valor)
  }

  return (
    <section
      className="product-filters"
      aria-label="Filtros del catálogo"
    >
      <label>
        Categoría

        <select
          value={filtros.categoria}
          onChange={(evento) =>
            cambiarCategoria(evento.target.value)
          }
        >
          <option value="">Todas</option>

          {categorias.map((categoria) => (
            <option
              key={categoria.id_cat}
              value={categoria.id_cat}
            >
              {categoria.nom_cat}
            </option>
          ))}
        </select>
      </label>

      <label>
        Subcategoría

        <select
          value={filtros.subcategoria}
          onChange={(evento) =>
            onCambiarFiltro(
              "subcategoria",
              evento.target.value
            )
          }
          disabled={subcategoriasFiltradas.length === 0}
        >
          <option value="">Todas</option>

          {subcategoriasFiltradas.map((subcategoria) => (
            <option
              key={subcategoria.id_subcategoria}
              value={subcategoria.id_subcategoria}
            >
              {subcategoria.nom_subcategoria}
            </option>
          ))}
        </select>
      </label>

      <label>
        Color

        <select
          value={filtros.color}
          onChange={(evento) =>
            onCambiarFiltro(
              "color",
              evento.target.value
            )
          }
        >
          <option value="">Todos</option>

          {colores.map((color) => (
            <option
              key={color}
              value={color}
            >
              {color}
            </option>
          ))}
        </select>
      </label>

      <label>
        Peso

        <select
          value={filtros.peso}
          onChange={(evento) =>
            onCambiarFiltro(
              "peso",
              evento.target.value
            )
          }
        >
          <option value="">Todos</option>

          {pesos.map((peso) => (
            <option
              key={peso.valor}
              value={peso.valor}
            >
              {peso.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <label>
        Precio mínimo

        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={formatearPrecio(precioMinimo)}
          placeholder="$0"
          onChange={(evento) => {
            setPrecioMinimo(
              obtenerNumero(evento.target.value)
            )
            setErrorPrecio("")
          }}
          onKeyDown={manejarEnter}
        />
      </label>

      <label>
        Precio máximo

        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={formatearPrecio(precioMaximo)}
          placeholder="Sin límite"
          onChange={(evento) => {
            setPrecioMaximo(
              obtenerNumero(evento.target.value)
            )
            setErrorPrecio("")
          }}
          onKeyDown={manejarEnter}
        />
      </label>

      <label>
        Ordenar

        <select
          value={filtros.orden}
          onChange={(evento) =>
            onCambiarFiltro(
              "orden",
              evento.target.value
            )
          }
        >
          <option value="recientes">
            Más recientes
          </option>

          <option value="antiguos">
            Más antiguos
          </option>

          <option value="precio-menor">
            Menor precio
          </option>

          <option value="precio-mayor">
            Mayor precio
          </option>

          <option value="nombre-az">
            Nombre A-Z
          </option>

          <option value="nombre-za">
            Nombre Z-A
          </option>
        </select>
      </label>

      <div className="product-filters__actions">
        <button
          type="button"
          className="product-filters__apply"
          onClick={aplicarPrecios}
        >
          Aplicar precios
        </button>

        <button
          type="button"
          className="product-filters__clear"
          onClick={limpiarTodo}
        >
          Limpiar
        </button>
      </div>

      {errorPrecio && (
        <p
          className="product-filters__error"
          role="alert"
        >
          {errorPrecio}
        </p>
      )}
    </section>
  )
}

export default ProductFilters