import { supabase } from "../../lib/supabase";
import { formatPrice } from "../../utils/formatters";

const BUCKET_IMAGENES = "imagenes_productos";

function ProductTable({
  productos = [],
  onEditar,
  onDesactivar,
  onAprobar,
  onEliminar,
  modo = "bodeguero",
}) {
  function obtenerUrlImagen(rutaImagen) {
    if (!rutaImagen) {
      return "";
    }

    if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
      return rutaImagen;
    }

    const { data } = supabase.storage
      .from(BUCKET_IMAGENES)
      .getPublicUrl(rutaImagen);

    return data.publicUrl;
  }

  function obtenerNombreEstado(producto) {
    return producto.estado_producto?.nom_est_prod || "Sin estado";
  }

  function obtenerClaseEstado(producto) {
    const nombreEstado = obtenerNombreEstado(producto)
      .trim()
      .toLocaleLowerCase("es-CL");

    if (nombreEstado === "activo") {
      return "estado-activo";
    }

    if (nombreEstado === "pendiente") {
      return "estado-pendiente";
    }

    if (nombreEstado === "no disponible" || nombreEstado === "inactivo") {
      return "estado-inactivo";
    }

    return "estado-desconocido";
  }

  function obtenerNombreMarca(producto) {
    return producto.marca_producto?.nom_marca || "Sin marca";
  }

  function obtenerPrecioProducto(producto) {
    const precioNormal = Number(producto.precio_prod ?? 0);

    const precioOferta = Number(producto.precio_act ?? 0);

    const tieneOferta = precioOferta > 0 && precioOferta < precioNormal;

    return {
      tieneOferta,
      precioNormal,
      precioVigente: tieneOferta ? precioOferta : precioNormal,
    };
  }

  function puedeEditar() {
    return (
      (modo === "bodeguero" || modo === "admin") &&
      typeof onEditar === "function"
    );
  }

  function puedeDesactivar(producto) {
    return (
      modo === "bodeguero" &&
      Number(producto.est_prod) === 2 &&
      typeof onDesactivar === "function"
    );
  }

  function puedeAprobar(producto) {
    return (
      modo === "admin" &&
      Number(producto.est_prod) === 1 &&
      typeof onAprobar === "function"
    );
  }

  function puedeEliminar() {
    return modo === "admin" && typeof onEliminar === "function";
  }

  if (productos.length === 0) {
    return (
      <div className="product-table-wrapper">
        <div className="product-table-empty">No hay productos registrados.</div>
      </div>
    );
  }

  return (
    <div className="product-table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Producto</th>
            <th>Marca</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {productos.map((producto) => {
            const imagenUrl = obtenerUrlImagen(producto.imagen_url);

            const precio = obtenerPrecioProducto(producto);

            const stock = Number(producto.stock_prod ?? 0);

            return (
              <tr key={producto.id_prod}>
                <td>
                  {imagenUrl ? (
                    <img
                      src={imagenUrl}
                      alt={`Imagen de ${producto.nom_prod}`}
                      className="product-table__image"
                    />
                  ) : (
                    <div className="product-table__image-placeholder">
                      Sin imagen
                    </div>
                  )}
                </td>

                <td>
                  <div className="product-table__product">
                    <strong>{producto.nom_prod}</strong>

                    <span>
                      {producto.subcategoria?.nom_subcategoria ||
                        "Sin subcategoría"}
                    </span>
                  </div>
                </td>

                <td>{obtenerNombreMarca(producto)}</td>

                <td>
                  <span
                    className={`stock-badge ${stock <= 5 ? "stock-bajo" : ""}`}
                  >
                    {stock} {stock === 1 ? "unidad" : "unidades"}
                  </span>
                </td>

                <td>
                  <div className="product-table__prices">
                    {precio.tieneOferta && (
                      <span className="product-table__old-price">
                        {formatPrice(precio.precioNormal)}
                      </span>
                    )}

                    <strong>{formatPrice(precio.precioVigente)}</strong>
                  </div>
                </td>

                <td>
                  <span className={obtenerClaseEstado(producto)}>
                    {obtenerNombreEstado(producto)}
                  </span>
                </td>

                <td>
                  <div className="table-actions">
                    {puedeEditar() && (
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => onEditar(producto)}
                        title="Editar producto"
                        aria-label={`Editar ${producto.nom_prod}`}
                      >
                        ✏️
                      </button>
                    )}

                    {puedeDesactivar(producto) && (
                      <button
                        type="button"
                        className="btn-deactivate"
                        onClick={() => onDesactivar(producto.id_prod)}
                        title="Deshabilitar producto"
                        aria-label={`Deshabilitar ${producto.nom_prod}`}
                      >
                        ⛔
                      </button>
                    )}

                    {puedeAprobar(producto) && (
                      <button
                        type="button"
                        className="btn-approve"
                        onClick={() => onAprobar(producto.id_prod)}
                        title="Aprobar producto"
                        aria-label={`Aprobar ${producto.nom_prod}`}
                      >
                        ✅
                      </button>
                    )}

                    {puedeEliminar() && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => onEliminar(producto.id_prod)}
                        title="Eliminar producto"
                        aria-label={`Eliminar ${producto.nom_prod}`}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
