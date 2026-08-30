import { useEffect, useState } from "react";

function FiltrosProducto({
  familias,
  subcategorias,
  marcas,
  colores,
  unidadesMedida,
  pesos,
  filtros,
  cargandoOpciones = false,
  onCambiarFiltro,
  onLimpiarFiltros,
}) {
  const [precioMinimo, setPrecioMinimo] = useState(filtros.precioMinimo);
  const [precioMaximo, setPrecioMaximo] = useState(filtros.precioMaximo);
  const [errorPrecio, setErrorPrecio] = useState("");

  useEffect(() => {
    setPrecioMinimo(filtros.precioMinimo);
    setPrecioMaximo(filtros.precioMaximo);
    setErrorPrecio("");
  }, [filtros.precioMinimo, filtros.precioMaximo]);

  function obtenerNumero(valor) {
    return String(valor).replace(/\D/g, "");
  }

  function formatearPrecio(valor) {
    if (!valor) {
      return "";
    }

    const numero = Number(obtenerNumero(valor));

    if (Number.isNaN(numero)) {
      return "";
    }

    return `$${new Intl.NumberFormat("es-CL").format(numero)}`;
  }

  function formatearPeso(valor) {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return valor;
    }

    return new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 3,
    }).format(numero);
  }

  function aplicarPrecios() {
    const minimo = precioMinimo !== "" ? Number(precioMinimo) : null;

    const maximo = precioMaximo !== "" ? Number(precioMaximo) : null;

    if (minimo !== null && maximo !== null && minimo > maximo) {
      setErrorPrecio(
        "El precio máximo debe ser mayor o igual al precio mínimo.",
      );

      return;
    }

    setErrorPrecio("");

    onCambiarFiltro("precioMinimo", precioMinimo);

    onCambiarFiltro("precioMaximo", precioMaximo);
  }

  function limpiarTodo() {
    setPrecioMinimo("");
    setPrecioMaximo("");
    setErrorPrecio("");

    onLimpiarFiltros();
  }

  function manejarEnter(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      aplicarPrecios();
    }
  }

  function cambiarFiltro(nombre, valor) {
    setErrorPrecio("");

    onCambiarFiltro(nombre, valor);
  }

  const hayUnidadSeleccionada = Boolean(filtros.unidadMedida);

  return (
    <aside className="product-filters" aria-label="Filtros del catálogo">
      <div className="product-filters__header">
        <h2>Filtrar productos</h2>

        <p>
          Selecciona cualquier filtro para comenzar. Las demás opciones se
          actualizarán según los productos disponibles.
        </p>
      </div>

      <div className="product-filters__fields">
        <label className="product-filters__field">
          <span>Familia</span>

          <select
            value={filtros.familia}
            onChange={(evento) => cambiarFiltro("familia", evento.target.value)}
            disabled={cargandoOpciones || familias.length === 0}
          >
            <option value="">
              {cargandoOpciones
                ? "Cargando familias..."
                : familias.length === 0
                  ? "Sin familias disponibles"
                  : "Todas las familias"}
            </option>

            {familias.map((familia) => (
              <option key={familia.id_familia} value={familia.id_familia}>
                {familia.nom_familia}
              </option>
            ))}
          </select>
        </label>
        <label className="product-filters__field">
          <span>Subcategoría</span>

          <select
            value={filtros.subcategoria}
            onChange={(evento) =>
              cambiarFiltro("subcategoria", evento.target.value)
            }
            disabled={cargandoOpciones || subcategorias.length === 0}
          >
            <option value="">
              {cargandoOpciones
                ? "Cargando subcategorías..."
                : subcategorias.length === 0
                  ? "Sin subcategorías disponibles"
                  : "Todas las subcategorías"}
            </option>

            {subcategorias.map((subcategoria) => (
              <option
                key={subcategoria.id_subcategoria}
                value={subcategoria.id_subcategoria}
              >
                {subcategoria.nom_subcategoria}
              </option>
            ))}
          </select>
        </label>
        <label className="product-filters__field">
          <span>Marca</span>

          <select
            value={filtros.marca}
            onChange={(evento) => cambiarFiltro("marca", evento.target.value)}
            disabled={cargandoOpciones || marcas.length === 0}
          >
            <option value="">
              {cargandoOpciones
                ? "Cargando marcas..."
                : marcas.length === 0
                  ? "Sin marcas disponibles"
                  : "Todas las marcas"}
            </option>

            {marcas.map((marca) => (
              <option key={marca.id_marca} value={marca.id_marca}>
                {marca.nom_marca}
              </option>
            ))}
          </select>
        </label>
        <label className="product-filters__field">
          <span>Color</span>

          <select
            value={filtros.color}
            onChange={(evento) => cambiarFiltro("color", evento.target.value)}
            disabled={cargandoOpciones || colores.length === 0}
          >
            <option value="">
              {cargandoOpciones
                ? "Cargando colores..."
                : colores.length === 0
                  ? "Sin colores disponibles"
                  : "Todos los colores"}
            </option>

            {colores.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
        <label className="product-filters__field">
          <span>Unidad de medida</span>

          <select
            value={filtros.unidadMedida}
            onChange={(evento) =>
              cambiarFiltro("unidadMedida", evento.target.value)
            }
            disabled={cargandoOpciones || unidadesMedida.length === 0}
          >
            <option value="">
              {cargandoOpciones
                ? "Cargando unidades..."
                : unidadesMedida.length === 0
                  ? "Sin unidades disponibles"
                  : "Todas las unidades"}
            </option>

            {unidadesMedida.map((unidad) => (
              <option key={unidad.id_und_medida} value={unidad.id_und_medida}>
                {unidad.nom_und_medida}
              </option>
            ))}
          </select>
        </label>
        <label className="product-filters__field">
          <span>Peso</span>

          <select
            value={filtros.peso}
            onChange={(evento) => cambiarFiltro("peso", evento.target.value)}
            disabled={
              cargandoOpciones || !hayUnidadSeleccionada || pesos.length === 0
            }
          >
            <option value="">
              {cargandoOpciones
                ? "Cargando pesos..."
                : !hayUnidadSeleccionada
                  ? "Selecciona una unidad"
                  : pesos.length === 0
                    ? "Sin pesos disponibles"
                    : "Todos los pesos"}
            </option>

            {pesos.map((peso) => (
              <option
                key={`${peso.id_und_medida}-${peso.valor}`}
                value={peso.valor}
              >
                {formatearPeso(peso.valor)}
              </option>
            ))}
          </select>
        </label>
        <div className="product-filters__price-group">
          <label className="product-filters__field">
            <span>Precio mínimo</span>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatearPrecio(precioMinimo)}
              placeholder="$0"
              onChange={(evento) => {
                setPrecioMinimo(obtenerNumero(evento.target.value));

                setErrorPrecio("");
              }}
              onKeyDown={manejarEnter}
            />
          </label>

          <label className="product-filters__field">
            <span>Precio máximo</span>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatearPrecio(precioMaximo)}
              placeholder="Sin límite"
              onChange={(evento) => {
                setPrecioMaximo(obtenerNumero(evento.target.value));

                setErrorPrecio("");
              }}
              onKeyDown={manejarEnter}
            />
          </label>
        </div>

        {errorPrecio && (
          <p className="product-filters__error" role="alert">
            {errorPrecio}
          </p>
        )}
        <label className="product-filters__field">
          <span>Ordenar por</span>

          <select
            value={filtros.orden}
            onChange={(evento) => cambiarFiltro("orden", evento.target.value)}
          >
            <option value="recientes">Más recientes</option>

            <option value="antiguos">Más antiguos</option>

            <option value="precio-menor">Menor precio</option>

            <option value="precio-mayor">Mayor precio</option>

            <option value="nombre-az">Nombre A-Z</option>

            <option value="nombre-za">Nombre Z-A</option>
          </select>
        </label>
      </div>

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
          Limpiar filtros
        </button>
      </div>
    </aside>
  );
}

export default FiltrosProducto;
