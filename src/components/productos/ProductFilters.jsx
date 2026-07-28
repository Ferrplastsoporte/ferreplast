import { useEffect, useMemo, useState } from "react";

function ProductFilters({
  familias,
  subcategorias,
  marcas,
  colores,
  unidadesMedida,
  pesos,
  filtros,
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

  const subcategoriasFiltradas = useMemo(() => {
    if (!filtros.familia) {
      return [];
    }

    return subcategorias.filter(
      (subcategoria) =>
        String(subcategoria.id_familia) === String(filtros.familia),
    );
  }, [subcategorias, filtros.familia]);

  const familiaSeleccionada = Boolean(filtros.familia);

  const subcategoriaSeleccionada = Boolean(filtros.subcategoria);

  const unidadSeleccionada = Boolean(filtros.unidadMedida);

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

  function cambiarFamilia(valor) {
    setErrorPrecio("");

    onCambiarFiltro("familia", valor);
  }

  function cambiarSubcategoria(valor) {
    setErrorPrecio("");

    onCambiarFiltro("subcategoria", valor);
  }

  return (
    <aside className="product-filters" aria-label="Filtros del catálogo">
      <div className="product-filters__header">
        <h2>Filtrar productos</h2>

        <p>
          Selecciona una familia y una subcategoría para habilitar los filtros
          de características.
        </p>
      </div>

      <div className="product-filters__fields">
        <label className="product-filters__field">
          <span>Familia</span>

          <select
            value={filtros.familia}
            onChange={(evento) => cambiarFamilia(evento.target.value)}
          >
            <option value="">Todas las familias</option>

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
            onChange={(evento) => cambiarSubcategoria(evento.target.value)}
            disabled={!familiaSeleccionada}
          >
            <option value="">
              {familiaSeleccionada
                ? "Todas las subcategorías"
                : "Selecciona una familia"}
            </option>

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

        <label className="product-filters__field">
          <span>Marca</span>

          <select
            value={filtros.marca}
            onChange={(evento) => onCambiarFiltro("marca", evento.target.value)}
            disabled={!subcategoriaSeleccionada || marcas.length === 0}
          >
            <option value="">
              {!subcategoriaSeleccionada
                ? "Selecciona una subcategoría"
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
            onChange={(evento) => onCambiarFiltro("color", evento.target.value)}
            disabled={!subcategoriaSeleccionada || colores.length === 0}
          >
            <option value="">
              {!subcategoriaSeleccionada
                ? "Selecciona una subcategoría"
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
              onCambiarFiltro("unidadMedida", evento.target.value)
            }
            disabled={!subcategoriaSeleccionada || unidadesMedida.length === 0}
          >
            <option value="">
              {!subcategoriaSeleccionada
                ? "Selecciona una subcategoría"
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
            onChange={(evento) => onCambiarFiltro("peso", evento.target.value)}
            disabled={
              !subcategoriaSeleccionada ||
              !unidadSeleccionada ||
              pesos.length === 0
            }
          >
            <option value="">
              {!subcategoriaSeleccionada
                ? "Selecciona una subcategoría"
                : !unidadSeleccionada
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
            onChange={(evento) => onCambiarFiltro("orden", evento.target.value)}
            disabled={!subcategoriaSeleccionada}
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

export default ProductFilters;
