import { useEffect, useState } from "react"

function ProductFilters({
  categorias,
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

  function obtenerNumero(valor) {
    return valor.replace(/\D/g, "")
  }

  function formatearPeso(valor) {
    if (!valor) {
      return ""
    }

    const numero = obtenerNumero(valor)

    return `$${new Intl.NumberFormat("es-CL").format(
      Number(numero)
    )}`
  }

  function aplicarPrecios() {
    const minimo = Number(precioMinimo || 0)
    const maximo = Number(precioMaximo || 0)

    if (minimo < 0 || maximo < 0) {
      setErrorPrecio("Los precios no pueden ser negativos.")
      return
    }

    if (precioMinimo && precioMaximo && minimo > maximo) {
      setErrorPrecio(
        "El precio máximo debe ser mayor o igual al precio mínimo."
      )
      return
    }

    setErrorPrecio("")

    onCambiarFiltro("precioMinimo", precioMinimo)
    onCambiarFiltro("precioMaximo", precioMaximo)
  }

  function manejarEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault()
      aplicarPrecios()
    }
  }

  function limpiarTodo() {
    setPrecioMinimo("")
    setPrecioMaximo("")
    setErrorPrecio("")
    onLimpiarFiltros()
  }

  return (
    <section className="product-filters">
      <label>
        Categoría

        <select
          value={filtros.categoria}
          onChange={(event) =>
            onCambiarFiltro("categoria", event.target.value)
          }
        >
          <option value="">Todas las categorías</option>

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
        Precio mínimo

        <input
          type="text"
          inputMode="numeric"
          placeholder="$0"
          value={formatearPeso(precioMinimo)}
          onChange={(event) => {
            setPrecioMinimo(
              obtenerNumero(event.target.value)
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
          placeholder="Sin límite"
          value={formatearPeso(precioMaximo)}
          onChange={(event) => {
            setPrecioMaximo(
              obtenerNumero(event.target.value)
            )
            setErrorPrecio("")
          }}
          onKeyDown={manejarEnter}
        />
      </label>

      <button
        type="button"
        className="product-filters__apply"
        onClick={aplicarPrecios}
      >
        Aplicar precio
      </button>

      <label>
        Ordenar por

        <select
          value={filtros.orden}
          onChange={(event) =>
            onCambiarFiltro("orden", event.target.value)
          }
        >
          <option value="recientes">
            Más recientes
          </option>

          <option value="antiguos">
            Más antiguos
          </option>

          <option value="precio-menor">
            Precio: menor a mayor
          </option>

          <option value="precio-mayor">
            Precio: mayor a menor
          </option>

          <option value="nombre-az">
            Nombre: A-Z
          </option>

          <option value="nombre-za">
            Nombre: Z-A
          </option>
        </select>
      </label>

      <button
        type="button"
        className="product-filters__clear"
        onClick={limpiarTodo}
      >
        Limpiar filtros
      </button>

      {errorPrecio && (
        <p className="product-filters__error">
          {errorPrecio}
        </p>
      )}
    </section>
  )
}

export default ProductFilters