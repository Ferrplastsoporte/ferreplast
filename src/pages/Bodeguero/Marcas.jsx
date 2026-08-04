import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";
import "./css/bodeguero.css";
import "./css/marcas.css";

const BUCKET_IMAGENES = "imagenes_productos";

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const TAMANO_MAXIMO_LOGO = 2 * 1024 * 1024;

const LONGITUD_MINIMA_NOMBRE = 2;
const LONGITUD_MAXIMA_NOMBRE = 80;

function limpiarNombreMarca(valor = "") {
  return String(valor)
    .replace(/[^\p{L}\p{N}\s&.'’\-]/gu, "")
    .replace(/\s{2,}/g, " ");
}

function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [marcaEditando, setMarcaEditando] = useState(null);

  const [nombre, setNombre] = useState("");

  const [marcaDestacar, setMarcaDestacar] = useState("");

  const [archivoLogo, setArchivoLogo] = useState(null);

  const [vistaPrevia, setVistaPrevia] = useState("");

  const [mensajeError, setMensajeError] = useState("");

  const [mensajeExito, setMensajeExito] = useState("");

  const [versionImagenes, setVersionImagenes] = useState(Date.now());

  useEffect(() => {
    cargarMarcas();
  }, []);

  useEffect(() => {
    return () => {
      if (vistaPrevia && vistaPrevia.startsWith("blob:")) {
        URL.revokeObjectURL(vistaPrevia);
      }
    };
  }, [vistaPrevia]);

  function obtenerUrlPublica(rutaLogo) {
    if (!rutaLogo) {
      return "";
    }

    const separador = rutaLogo.includes("?") ? "&" : "?";

    if (rutaLogo.startsWith("http://") || rutaLogo.startsWith("https://")) {
      return `${rutaLogo}${separador}v=${versionImagenes}`;
    }

    const { data } = supabase.storage
      .from(BUCKET_IMAGENES)
      .getPublicUrl(rutaLogo);

    return `${data.publicUrl}?v=${versionImagenes}`;
  }

  async function cargarMarcas() {
    setCargando(true);
    setMensajeError("");

    const { data, error } = await supabase
      .from("marca_producto")
      .select(
        `
        id_marca,
        nom_marca,
        logo_url,
        marca_destacar,
        est_marca
      `,
      )
      .order("nom_marca", {
        ascending: true,
      });

    if (error) {
      console.error("Error al cargar las marcas:", error);

      setMensajeError("No fue posible cargar las marcas.");

      setMarcas([]);
    } else {
      setMarcas(data ?? []);
    }

    setCargando(false);
  }

  function limpiarVistaPrevia() {
    if (vistaPrevia && vistaPrevia.startsWith("blob:")) {
      URL.revokeObjectURL(vistaPrevia);
    }

    setVistaPrevia("");
  }

  function reiniciarFormulario() {
    limpiarVistaPrevia();

    setMarcaEditando(null);
    setNombre("");
    setMarcaDestacar("");
    setArchivoLogo(null);
    setMostrarFormulario(false);
  }

  function abrirFormularioNuevaMarca() {
    reiniciarFormulario();

    setMensajeError("");
    setMensajeExito("");
    setMostrarFormulario(true);
  }

  function abrirFormularioEdicion(marca) {
    limpiarVistaPrevia();

    setMarcaEditando(marca);
    setNombre(marca.nom_marca ?? "");

    setMarcaDestacar(marca.marca_destacar === true ? "true" : "false");

    setArchivoLogo(null);

    setVistaPrevia(obtenerUrlPublica(marca.logo_url));

    setMensajeError("");
    setMensajeExito("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    reiniciarFormulario();
    setMensajeError("");
  }

  function seleccionarLogo(evento) {
    const archivo = evento.target.files?.[0] ?? null;

    setMensajeError("");

    if (!archivo) {
      setArchivoLogo(null);

      setVistaPrevia(
        marcaEditando ? obtenerUrlPublica(marcaEditando.logo_url) : "",
      );

      return;
    }

    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      evento.target.value = "";

      setArchivoLogo(null);

      setMensajeError("El logo debe estar en formato JPG, PNG o WEBP.");

      return;
    }

    if (archivo.size > TAMANO_MAXIMO_LOGO) {
      evento.target.value = "";

      setArchivoLogo(null);

      setMensajeError("El logo no puede superar los 2 MB.");

      return;
    }

    limpiarVistaPrevia();

    const nuevaVistaPrevia = URL.createObjectURL(archivo);

    setArchivoLogo(archivo);
    setVistaPrevia(nuevaVistaPrevia);
  }

  function validarFormulario() {
    const nombreLimpio = limpiarNombreMarca(nombre).trim();

    if (!nombreLimpio) {
      setMensajeError("Debes ingresar el nombre de la marca.");

      return null;
    }

    if (nombreLimpio.length < LONGITUD_MINIMA_NOMBRE) {
      setMensajeError(
        `El nombre debe tener al menos ${LONGITUD_MINIMA_NOMBRE} caracteres.`,
      );

      return null;
    }

    if (nombreLimpio.length > LONGITUD_MAXIMA_NOMBRE) {
      setMensajeError(
        `El nombre no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`,
      );

      return null;
    }

    if (!/[\p{L}\p{N}]/u.test(nombreLimpio)) {
      setMensajeError(
        "El nombre debe contener al menos una letra o un número.",
      );

      return null;
    }

    if (marcaDestacar !== "true" && marcaDestacar !== "false") {
      setMensajeError("Debes indicar si la marca será destacada o normal.");

      return null;
    }

    return {
      nombre: nombreLimpio,
      debeDestacarse: marcaDestacar === "true",
    };
  }

  function obtenerExtensionLogo(archivo) {
    const extensionOriginal = archivo.name.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "webp"].includes(extensionOriginal)) {
      return extensionOriginal === "jpeg" ? "jpg" : extensionOriginal;
    }

    switch (archivo.type) {
      case "image/png":
        return "png";

      case "image/webp":
        return "webp";

      default:
        return "jpg";
    }
  }

  async function subirLogo(idMarca, archivo, rutaAnterior = null) {
    const extension = obtenerExtensionLogo(archivo);

    const rutaNueva = `marca/${idMarca}/logo.${extension}`;

    if (rutaAnterior && rutaAnterior !== rutaNueva) {
      const { error: errorEliminar } = await supabase.storage
        .from(BUCKET_IMAGENES)
        .remove([rutaAnterior]);

      if (errorEliminar) {
        console.warn(
          "No fue posible eliminar el logo anterior:",
          errorEliminar,
        );
      }
    }

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_IMAGENES)
      .upload(rutaNueva, archivo, {
        cacheControl: "0",
        upsert: true,
        contentType: archivo.type,
      });

    if (errorSubida) {
      throw errorSubida;
    }

    return rutaNueva;
  }

  async function actualizarRutaLogo(idMarca, rutaLogo) {
    const { error } = await supabase
      .from("marca_producto")
      .update({
        logo_url: rutaLogo,

        /*
         * El nuevo logo debe ser aprobado
         * nuevamente por administración.
         */
        est_marca: false,
      })
      .eq("id_marca", idMarca);

    if (error) {
      throw error;
    }
  }

  async function crearMarca(nombreValidado, debeDestacarse) {
    /*
     * est_marca no se envía.
     * La base de datos aplicará FALSE
     * como valor predeterminado.
     */
    const { data: marcaCreada, error } = await supabase
      .from("marca_producto")
      .insert({
        nom_marca: nombreValidado,

        marca_destacar: debeDestacarse,
      })
      .select(
        `
        id_marca,
        nom_marca,
        logo_url,
        marca_destacar,
        est_marca
      `,
      )
      .single();

    if (error) {
      throw error;
    }

    if (!marcaCreada) {
      throw new Error("No fue posible obtener la marca creada.");
    }

    if (archivoLogo) {
      const rutaLogo = await subirLogo(marcaCreada.id_marca, archivoLogo);

      await actualizarRutaLogo(marcaCreada.id_marca, rutaLogo);
    }
  }

  async function actualizarMarca(nombreValidado, debeDestacarse) {
    const { error } = await supabase
      .from("marca_producto")
      .update({
        nom_marca: nombreValidado,

        marca_destacar: debeDestacarse,

        /*
         * Toda modificación realizada
         * por bodega vuelve la marca
         * al estado pendiente.
         */
        est_marca: false,
      })
      .eq("id_marca", marcaEditando.id_marca);

    if (error) {
      throw error;
    }

    if (archivoLogo) {
      const rutaLogo = await subirLogo(
        marcaEditando.id_marca,
        archivoLogo,
        marcaEditando.logo_url,
      );

      await actualizarRutaLogo(marcaEditando.id_marca, rutaLogo);
    }
  }

  async function guardarMarca(evento) {
    evento.preventDefault();

    if (guardando) {
      return;
    }

    const datosValidados = validarFormulario();

    if (!datosValidados) {
      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      if (marcaEditando) {
        await actualizarMarca(
          datosValidados.nombre,
          datosValidados.debeDestacarse,
        );

        setMensajeExito(
          "La marca fue actualizada y quedó pendiente de una nueva aprobación.",
        );
      } else {
        await crearMarca(datosValidados.nombre, datosValidados.debeDestacarse);

        setMensajeExito("La marca fue creada y quedó pendiente de aprobación.");
      }

      reiniciarFormulario();
      setVersionImagenes(Date.now());
      await cargarMarcas();
    } catch (error) {
      console.error("Error al guardar la marca:", error);

      if (error?.code === "23505") {
        setMensajeError("Ya existe una marca con ese nombre.");
      } else if (error?.message?.toLowerCase().includes("row-level security")) {
        setMensajeError("No tienes permisos para guardar esta marca.");
      } else {
        setMensajeError(error?.message || "No fue posible guardar la marca.");
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="bodeguero-page marcas-page">
      <BodegueroHeader
        titulo="Administrar marcas"
        descripcion="Crea y actualiza las marcas del catálogo. Las nuevas marcas y sus modificaciones quedarán pendientes de aprobación."
      />

      <div className="marcas-toolbar">
        <button
          type="button"
          className="btn-add"
          onClick={abrirFormularioNuevaMarca}
          disabled={guardando}
        >
          Nueva marca
        </button>
      </div>

      {mensajeExito && (
        <p
          className="bodeguero-message bodeguero-message--success"
          role="status"
        >
          {mensajeExito}
        </p>
      )}

      {mensajeError && (
        <p className="bodeguero-message bodeguero-message--error" role="alert">
          {mensajeError}
        </p>
      )}

      {mostrarFormulario && (
        <form className="marcas-form" onSubmit={guardarMarca} noValidate>
          <div className="marcas-form__content">
            <div className="marcas-form__fields">
              <div className="marcas-form__field">
                <label htmlFor="nombreMarca">Nombre de la marca</label>

                <input
                  id="nombreMarca"
                  type="text"
                  value={nombre}
                  onChange={(evento) =>
                    setNombre(limpiarNombreMarca(evento.target.value))
                  }
                  placeholder="Ej: Würth"
                  minLength={LONGITUD_MINIMA_NOMBRE}
                  maxLength={LONGITUD_MAXIMA_NOMBRE}
                  disabled={guardando}
                  autoComplete="off"
                  autoFocus
                />

                <small>
                  Se permiten letras, números, espacios, guiones, puntos,
                  apóstrofes y el signo &amp;.
                </small>
              </div>

              <div className="marcas-form__field">
                <label htmlFor="marcaDestacar">Relevancia de la marca</label>

                <select
                  id="marcaDestacar"
                  value={marcaDestacar}
                  onChange={(evento) => setMarcaDestacar(evento.target.value)}
                  disabled={guardando}
                  required
                >
                  <option value="">Selecciona una opción</option>

                  <option value="true">Marca destacada</option>

                  <option value="false">Marca normal</option>
                </select>

                <small>
                  Las marcas destacadas tendrán mayor relevancia en el catálogo
                  una vez aprobadas.
                </small>
              </div>

              <div className="marcas-form__field">
                <label htmlFor="logoMarca">Logo de la marca</label>

                <input
                  id="logoMarca"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={seleccionarLogo}
                  disabled={guardando}
                />

                <small>
                  Formatos permitidos: JPG, PNG o WEBP. Máximo 2 MB.
                </small>
              </div>
            </div>

            <div className="marcas-form__preview">
              <span>Vista previa</span>

              {vistaPrevia ? (
                <img src={vistaPrevia} alt="Vista previa del logo" />
              ) : (
                <div className="marcas-form__placeholder">Sin logo</div>
              )}
            </div>
          </div>

          <div className="marcas-form__actions">
            <button
              type="submit"
              className="marcas-form__save"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : marcaEditando
                  ? "Actualizar marca"
                  : "Crear marca"}
            </button>

            <button
              type="button"
              className="marcas-form__cancel"
              onClick={cerrarFormulario}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="bodeguero-loading">Cargando marcas...</p>
      ) : (
        <div className="marcas-table-wrapper">
          <table className="marcas-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nombre</th>
                <th>Relevancia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {marcas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="marcas-table__empty">
                    No hay marcas registradas.
                  </td>
                </tr>
              ) : (
                marcas.map((marca) => {
                  const logoPublico = obtenerUrlPublica(marca.logo_url);

                  return (
                    <tr key={marca.id_marca}>
                      <td>
                        {logoPublico ? (
                          <img
                            src={logoPublico}
                            alt={`Logo de ${marca.nom_marca}`}
                            className="marcas-table__logo"
                          />
                        ) : (
                          <div className="marcas-table__logo-placeholder">
                            Sin logo
                          </div>
                        )}
                      </td>

                      <td>
                        <strong>{marca.nom_marca}</strong>
                      </td>

                      <td>
                        <span
                          className={
                            marca.marca_destacar
                              ? "status-badge status-badge--own"
                              : "status-badge status-badge--normal"
                          }
                        >
                          {marca.marca_destacar ? "Destacada" : "Normal"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            marca.est_marca
                              ? "status-badge status-badge--active"
                              : "status-badge status-badge--pending"
                          }
                        >
                          {marca.est_marca ? "Activa" : "Pendiente"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="marcas-table__edit"
                          onClick={() => abrirFormularioEdicion(marca)}
                          disabled={guardando}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Marcas;
