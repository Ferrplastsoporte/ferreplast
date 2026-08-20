import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";

import {
  LONGITUD_MINIMA_MARCA,
  LONGITUD_MAXIMA_MARCA,
  limpiarNombreMarca,
  validarNombreMarca,
  validarLogoMarca,
} from "../../utils/marcas";

import {
  obtenerUrlLogoMarca,
  subirLogoMarca,
} from "../../services/marcaService";

import "./css/bodeguero.css";
import "./css/marcas.css";

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
      if (vistaPrevia?.startsWith("blob:")) {
        URL.revokeObjectURL(vistaPrevia);
      }
    };
  }, [vistaPrevia]);

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
      .order("nom_marca", { ascending: true });

    if (error) {
      console.error("Error al cargar marcas:", error);
      setMarcas([]);
      setMensajeError("No fue posible cargar las marcas.");
    } else {
      setMarcas(data ?? []);
    }

    setCargando(false);
  }

  function limpiarVistaPrevia() {
    if (vistaPrevia?.startsWith("blob:")) {
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
    setMarcaDestacar(marca.marca_destacar ? "true" : "false");
    setArchivoLogo(null);

    setVistaPrevia(obtenerUrlLogoMarca(marca.logo_url, versionImagenes));

    setMensajeError("");
    setMensajeExito("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) return;

    reiniciarFormulario();
    setMensajeError("");
  }

  function seleccionarLogo(evento) {
    const archivo = evento.target.files?.[0] ?? null;

    setMensajeError("");

    if (!archivo) {
      setArchivoLogo(null);

      setVistaPrevia(
        marcaEditando
          ? obtenerUrlLogoMarca(marcaEditando.logo_url, versionImagenes)
          : "",
      );

      return;
    }

    const validacion = validarLogoMarca(archivo);

    if (!validacion.valido) {
      evento.target.value = "";
      setArchivoLogo(null);
      setMensajeError(validacion.error);
      return;
    }

    limpiarVistaPrevia();

    setArchivoLogo(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  }

  async function guardarMarca(evento) {
    evento.preventDefault();
    if (guardando) return;

    const validacionNombre = validarNombreMarca(nombre);

    if (!validacionNombre.valido) {
      setMensajeError(validacionNombre.error);
      return;
    }

    if (marcaDestacar !== "true" && marcaDestacar !== "false") {
      setMensajeError("Debes indicar si la marca será destacada o normal.");
      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      /*
       * Primero creamos/actualizamos los datos generales
       * de la marca.
       */
      const { data: idMarca, error } = await supabase.rpc("guardar_marca", {
        p_nombre: validacionNombre.valor,
        p_destacar: marcaDestacar === "true",
        p_id_marca: marcaEditando?.id_marca ?? null,
        p_logo_url: null,
      });

      if (error) throw error;

      /*
       * Si existe un nuevo logo:
       * 1. se sube/reemplaza en Storage;
       * 2. se guarda la nueva ruta mediante la misma RPC.
       */
      if (archivoLogo) {
        const rutaLogo = await subirLogoMarca(
          idMarca,
          archivoLogo,
          marcaEditando?.logo_url ?? null,
        );

        const { error: errorLogo } = await supabase.rpc("guardar_marca", {
          p_nombre: validacionNombre.valor,
          p_destacar: marcaDestacar === "true",
          p_id_marca: idMarca,
          p_logo_url: rutaLogo,
        });

        if (errorLogo) throw errorLogo;
      }

      const editando = Boolean(marcaEditando);

      reiniciarFormulario();
      setVersionImagenes(Date.now());

      await cargarMarcas();

      setMensajeExito(
        editando
          ? "La marca fue actualizada y quedó pendiente de una nueva aprobación."
          : "La marca fue creada y quedó pendiente de aprobación.",
      );
    } catch (error) {
      console.error("Error al guardar marca:", error);

      setMensajeError(error?.message || "No fue posible guardar la marca.");
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
                  minLength={LONGITUD_MINIMA_MARCA}
                  maxLength={LONGITUD_MAXIMA_MARCA}
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
                  const logoPublico = obtenerUrlLogoMarca(
                    marca.logo_url,
                    versionImagenes,
                  );

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
