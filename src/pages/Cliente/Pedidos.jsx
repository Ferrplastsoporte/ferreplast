import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import TarjetaPedido from "../../components/pedidos/TarjetaPedido";
import "./css/pedidos.css";

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    setCargando(true);
    setError("");

    // Usuario actualmente autenticado
    const {
      data: { user },
      error: errorUsuario,
    } = await supabase.auth.getUser();

    if (errorUsuario) {
      console.error("Error obteniendo usuario:", errorUsuario);
      setError("No fue posible obtener tu sesión.");
      setCargando(false);
      return;
    }

    if (!user) {
      setError("Debes iniciar sesión para ver tus pedidos.");
      setCargando(false);
      return;
    }

    // Obtener pedidos del usuario
const { data, error: errorPedidos } = await supabase
  .from("pedido")
.select(`
  id_pedido,
  fecha_predido,
  total_pedido,
  id_estado,
  id_user,
  es_factura,
  registrado_erp,

  estado_pedido (
    id_estado,
    nom_estado
  ),

  detalle_pedido (
    id_detalle,
    cantidad,
    precio_unitario,
    id_prod,

    producto (
      id_prod,
      nom_prod,
      imagen_url
    )
  ),

  pago (
    id_pago,
    metodo_pago,
    fecha_pago,
    estado_pago,
    referencia_pago
  )
`)
  .eq("id_user", user.id)
  .order("fecha_predido", {
    ascending: false,
  });
    if (errorPedidos) {
      console.error("Error cargando pedidos:", errorPedidos);

      setError(
        "No fue posible cargar tus pedidos."
      );

      setPedidos([]);
      setCargando(false);
      return;
    }

    setPedidos(data || []);
    setCargando(false);
  }

  function formatearFecha(fecha) {
    if (!fecha) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(fecha));
  }

  function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(Number(precio || 0));
  }

  function obtenerEstado(pedido) {
    const estado = pedido?.estado_pedido?.nom_estado;

    if (!estado) {
      return "pendiente";
    }

    return estado
      .toLowerCase()
      .trim()
      .replaceAll(" ", "_");
  }

  return (
    <main className="pedidos-page">

      {/* Encabezado */}

      <section className="pedidos-header">

        <span className="pedidos-eyebrow">
          MI CUENTA
        </span>

        <h1>
          Mis pedidos
        </h1>

        <p>
          Consulta tus compras, estados,
          productos y despachos.
        </p>

      </section>


      {/* Cargando */}

      {cargando && (
        <div className="pedidos-status">

          <span className="pedidos-spinner" />

          <p>
            Cargando tus pedidos...
          </p>

        </div>
      )}


      {/* Error */}

      {!cargando && error && (
        <div className="pedidos-status pedidos-status--error">

          <h2>
            No pudimos cargar tus pedidos
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={cargarPedidos}
          >
            Reintentar
          </button>

        </div>
      )}


      {/* Sin pedidos */}

      {!cargando &&
        !error &&
        pedidos.length === 0 && (

          <div className="pedidos-status pedidos-status--empty">

            <div className="pedidos-empty-icon">
              🛒
            </div>

            <h2>
              Aún no tienes pedidos
            </h2>

            <p>
              Cuando realices una compra,
              aquí podrás consultar su estado.
            </p>

          </div>
        )}


      {/* Lista de pedidos */}

      {!cargando &&
        !error &&
        pedidos.length > 0 && (

          <section className="pedidos-content">

            <div className="pedidos-summary">

              <div>
                <strong>
                  {pedidos.length}
                </strong>

                <span>
                  {pedidos.length === 1
                    ? "pedido"
                    : "pedidos"}
                </span>
              </div>

              <span>
                Más recientes primero
              </span>

            </div>


            <div className="pedidos-list">

              {pedidos.map((pedido) => (

                <TarjetaPedido
                  key={pedido.id_pedido}
                  pedido={pedido}
                  formatearFecha={formatearFecha}
                  formatearPrecio={formatearPrecio}
                  obtenerEstado={obtenerEstado}
                  onVerDetalle={() =>
                    console.log(
                      "Pedido seleccionado:",
                      pedido
                    )
                  }
                />

              ))}

            </div>

          </section>
        )}

    </main>
  );
}

export default Pedidos;
