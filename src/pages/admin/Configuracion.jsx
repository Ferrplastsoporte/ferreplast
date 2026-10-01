import { useEffect, useState } from "react";
import {
  FiCreditCard,
  FiFileText,
  FiImage,
  FiSave,
  FiSettings,
  FiTrash2,
  FiUploadCloud,
  FiUsers,
} from "react-icons/fi";
import {
  actualizarConfiguracionCotizacionAdmin,
  actualizarPlantillaCotizacionAdmin,
  cargarConfiguracionCotizacionAdmin,
  eliminarRecursoPlantilla,
  obtenerUrlRecursoPlantilla,
  subirRecursoPlantilla,
} from "../../services/configuracionCotizacionService";
import {
  esCantidadDiasValidezValida,
  esTasaIvaValida,
  sanitizarDiasValidez,
} from "../../utils/cotizaciones/cotizaciones";
import {
  crearFormularioPlantilla,
  prepararPlantillaParaGuardar,
  validarImagenPlantilla,
  validarPlantillaCotizacion,
} from "../../utils/cotizaciones/plantillaCotizacion";
import {
  obtenerMetodosPago,
  actualizarEstadoMetodoPago,
} from "../../services/metodoPagoService";
import AdminHeader from "./components/AdminHeader";
import "./css/Configuracion.css";

const FORMULARIO_VACIO = crearFormularioPlantilla();
const RECURSOS_VACIOS = {
  logo: "",
  firmaElaborador: "",
  firmaAutorizador: "",
};

function SelectorRecursoPlantilla({
  tipo,
  titulo,
  descripcion,
  url,
  tieneArchivo,
  procesando,
  bloqueado,
  onSubir,
  onEliminar,
}) {
  const idInput = `recurso-${tipo}`;

  return (
    <article className="configuracion-recurso">
      <div className="configuracion-recurso__vista">
        {url ? (
          <img src={url} alt={`Vista previa de ${titulo.toLowerCase()}`} />
        ) : (
          <FiImage aria-hidden="true" />
        )}
      </div>

      <div className="configuracion-recurso__informacion">
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
        <div>
          <label htmlFor={idInput} className="configuracion-recurso__subir">
            {tieneArchivo ? "Reemplazar" : "Seleccionar imagen"}
          </label>
          <input
            id={idInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={bloqueado}
            onChange={(evento) => {
              const archivo = evento.target.files?.[0];
              evento.target.value = "";
              if (archivo) onSubir(tipo, archivo);
            }}
          />
          {tieneArchivo && (
            <button
              type="button"
              onClick={() => onEliminar(tipo)}
              disabled={bloqueado}
            >
              <FiTrash2 /> Eliminar
            </button>
          )}
        </div>
        {procesando && <small>Procesando imagen…</small>}
      </div>
    </article>
  );
}

function Configuracion() {
  const [valoresGenerales, setValoresGenerales] = useState({
    diasValidez: "",
    tasaIva: "",
  });
  const [plantilla, setPlantilla] = useState(FORMULARIO_VACIO);
  const [rutEmpresa, setRutEmpresa] = useState("");
  const [idPlantilla, setIdPlantilla] = useState(null);
  const [rutasRecursos, setRutasRecursos] = useState(RECURSOS_VACIOS);
  const [urlsRecursos, setUrlsRecursos] = useState(RECURSOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState("");
  const [procesandoRecurso, setProcesandoRecurso] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [cargandoMetodosPago, setCargandoMetodosPago] = useState(true);
  const [actualizandoMetodoPago, setActualizandoMetodoPago] = useState(null);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      try {
        const datos = await cargarConfiguracionCotizacionAdmin();
        if (!vigente) return;

        if (!datos.configuracion || !datos.plantilla) {
          throw new Error("La configuración de cotizaciones está incompleta.");
        }

        setValoresGenerales({
          diasValidez: String(datos.configuracion.dias_validez ?? ""),
          tasaIva: String(datos.configuracion.tasa_iva ?? ""),
        });
        setPlantilla(crearFormularioPlantilla(datos.plantilla));
        setRutEmpresa(String(datos.plantilla.rut_empresa ?? ""));
        setIdPlantilla(datos.plantilla.id_plantilla);

        const rutas = {
          logo: datos.plantilla.logo_storage_path ?? "",
          firmaElaborador:
            datos.plantilla.firma_elaborador_storage_path ?? "",
          firmaAutorizador:
            datos.plantilla.firma_autorizador_storage_path ?? "",
        };
        setRutasRecursos(rutas);

        const urls = Object.fromEntries(
          await Promise.all(
            Object.entries(rutas).map(async ([tipo, ruta]) => [
              tipo,
              ruta ? await obtenerUrlRecursoPlantilla(ruta) : "",
            ]),
          ),
        );
        if (vigente) setUrlsRecursos(urls);
      } catch (error) {
        console.error("Error al cargar la configuración:", error);
        if (vigente) {
          setMensaje({
            tipo: "error",
            texto: error.message || "No fue posible cargar la configuración.",
          });
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }

    cargar();
    cargarMetodosPago();
    return () => {
      vigente = false;
    };
  }, []);

  function actualizarPlantilla(campo, valor) {
    setPlantilla((actual) => ({ ...actual, [campo]: valor }));
    setMensaje(null);
  }

  async function guardarValoresGenerales(evento) {
    evento.preventDefault();

    const diasValidez = Number(valoresGenerales.diasValidez);
    const tasaIva = Number(valoresGenerales.tasaIva);

    if (!esCantidadDiasValidezValida(diasValidez)) {
      setMensaje({
        tipo: "error",
        texto: "La vigencia debe estar entre 1 y 365 días.",
      });
      return;
    }

    if (!esTasaIvaValida(tasaIva)) {
      setMensaje({
        tipo: "error",
        texto: "El IVA debe estar entre 0 y 100 por ciento.",
      });
      return;
    }

    setGuardando("general");
    setMensaje(null);

    try {
      await actualizarConfiguracionCotizacionAdmin(diasValidez, tasaIva);
      setMensaje({
        tipo: "exito",
        texto: "Valores generales actualizados.",
      });
    } catch (error) {
      console.error("Error al actualizar los valores generales:", error);
      setMensaje({
        tipo: "error",
        texto: error.message || "No fue posible guardar los valores.",
      });
    } finally {
      setGuardando("");
    }
  }

  async function guardarPlantilla(evento) {
    evento.preventDefault();

    const errorValidacion = validarPlantillaCotizacion(plantilla);
    if (errorValidacion) {
      setMensaje({ tipo: "error", texto: errorValidacion });
      return;
    }

    const datos = prepararPlantillaParaGuardar(plantilla);
    setGuardando("plantilla");
    setMensaje(null);

    try {
      await actualizarPlantillaCotizacionAdmin(datos);
      setPlantilla(datos);
      setMensaje({
        tipo: "exito",
        texto: "Datos de la plantilla actualizados.",
      });
    } catch (error) {
      console.error("Error al actualizar la plantilla:", error);
      setMensaje({
        tipo: "error",
        texto: error.message || "No fue posible guardar la plantilla.",
      });
    } finally {
      setGuardando("");
    }
  }

  async function subirRecurso(tipo, archivo) {
    const errorValidacion = validarImagenPlantilla(archivo);
    if (errorValidacion) {
      setMensaje({ tipo: "error", texto: errorValidacion });
      return;
    }

    setProcesandoRecurso(tipo);
    setMensaje(null);

    try {
      const resultado = await subirRecursoPlantilla(
        idPlantilla,
        tipo,
        archivo,
      );
      setRutasRecursos((actuales) => ({
        ...actuales,
        [tipo]: resultado.ruta,
      }));
      setUrlsRecursos((actuales) => ({
        ...actuales,
        [tipo]: resultado.url,
      }));
      setMensaje({ tipo: "exito", texto: "Imagen actualizada correctamente." });
    } catch (error) {
      console.error("Error al actualizar el recurso:", error);
      setMensaje({
        tipo: "error",
        texto: error.message || "No fue posible actualizar la imagen.",
      });
    } finally {
      setProcesandoRecurso("");
    }
  }

  async function eliminarRecurso(tipo) {
    setProcesandoRecurso(tipo);
    setMensaje(null);

    try {
      await eliminarRecursoPlantilla(tipo, rutasRecursos[tipo]);
      setRutasRecursos((actuales) => ({ ...actuales, [tipo]: "" }));
      setUrlsRecursos((actuales) => ({ ...actuales, [tipo]: "" }));
      setMensaje({ tipo: "exito", texto: "Imagen eliminada correctamente." });
    } catch (error) {
      console.error("Error al eliminar el recurso:", error);
      setMensaje({
        tipo: "error",
        texto: error.message || "No fue posible eliminar la imagen.",
      });
    } finally {
      setProcesandoRecurso("");
    }
  }
async function cargarMetodosPago() {
  setCargandoMetodosPago(true);

  try {
    const datos = await obtenerMetodosPago();
    setMetodosPago(datos);
  } catch (error) {
    console.error("Error al cargar métodos de pago:", error);

    setMensaje({
      tipo: "error",
      texto: "No fue posible cargar los métodos de pago.",
    });
  } finally {
    setCargandoMetodosPago(false);
  }
}

async function cambiarEstadoMetodoPago(id, activo) {
  setActualizandoMetodoPago(id);
  setMensaje(null);

  try {
    const metodoActualizado = await actualizarEstadoMetodoPago(
      id,
      activo
    );

    setMetodosPago((actuales) =>
      actuales.map((metodo) =>
        metodo.id_metodo_pago === id
          ? metodoActualizado
          : metodo
      )
    );

    setMensaje({
      tipo: "exito",
      texto: `Método de pago ${
        activo ? "activado" : "desactivado"
      } correctamente.`,
    });
  } catch (error) {
    console.error("Error al actualizar método de pago:", error);

    setMensaje({
      tipo: "error",
      texto: "No fue posible actualizar el método de pago.",
    });
  } finally {
    setActualizandoMetodoPago(null);
  }

}

  return (
    <section className="admin-page configuracion-page">
      <AdminHeader
        titulo="Configuración"
        descripcion="Administra los valores comerciales y el contenido de las cotizaciones."
      />

      {mensaje && (
        <p
          className={`configuracion-mensaje configuracion-mensaje--${mensaje.tipo}`}
          role={mensaje.tipo === "error" ? "alert" : "status"}
        >
          {mensaje.texto}
        </p>
      )}

      {cargando ? (
        <div className="admin-loading">Cargando configuración…</div>
      ) : (
        <div className="configuracion-contenido">
          <form
            className="configuracion-tarjeta"
            onSubmit={guardarValoresGenerales}
          >
            <header className="configuracion-tarjeta__cabecera">
              <FiSettings aria-hidden="true" />
              <div>
                <h2>Valores generales</h2>
                <p>Se aplicarán a las nuevas cotizaciones.</p>
              </div>
            </header>

            <div className="configuracion-campos configuracion-campos--dos">
              <label className="configuracion-campo">
                <span>Días de validez</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={valoresGenerales.diasValidez}
                  onChange={(evento) =>
                    setValoresGenerales((actual) => ({
                      ...actual,
                      diasValidez: sanitizarDiasValidez(evento.target.value),
                    }))
                  }
                  maxLength={3}
                  required
                />
                <small>Entre 1 y 365 días.</small>
              </label>

              <label className="configuracion-campo">
                <span>IVA (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={valoresGenerales.tasaIva}
                  onChange={(evento) =>
                    setValoresGenerales((actual) => ({
                      ...actual,
                      tasaIva: evento.target.value,
                    }))
                  }
                  required
                />
                <small>Se utiliza para separar neto e IVA.</small>
              </label>
            </div>

            <button
              className="configuracion-guardar"
              type="submit"
              disabled={Boolean(guardando)}
            >
              <FiSave />
              {guardando === "general" ? "Guardando…" : "Guardar valores"}
            </button>
          </form>

          <form
            className="configuracion-tarjeta configuracion-tarjeta--plantilla"
            onSubmit={guardarPlantilla}
          >
            <header className="configuracion-tarjeta__cabecera">
              <FiFileText aria-hidden="true" />
              <div>
                <h2>Plantilla de cotización</h2>
                <p>Información que aparecerá en el documento comercial.</p>
              </div>
            </header>

            <fieldset className="configuracion-grupo">
              <legend>Datos de Ferreplast</legend>
              <div className="configuracion-campos configuracion-campos--dos">
                <label className="configuracion-campo">
                  <span>Razón social</span>
                  <input
                    value={plantilla.razon_social}
                    onChange={(evento) =>
                      actualizarPlantilla("razon_social", evento.target.value)
                    }
                    maxLength={120}
                    required
                  />
                </label>

                <label className="configuracion-campo">
                  <span>RUT de la empresa</span>
                  <input value={rutEmpresa} readOnly aria-readonly="true" />
                  <small>Dato fijo de la empresa.</small>
                </label>

                <label className="configuracion-campo configuracion-campo--ancho">
                  <span>Actividad comercial</span>
                  <input
                    value={plantilla.actividad_comercial}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "actividad_comercial",
                        evento.target.value,
                      )
                    }
                    maxLength={160}
                    required
                  />
                </label>

                <label className="configuracion-campo configuracion-campo--ancho">
                  <span>Dirección</span>
                  <input
                    value={plantilla.direccion_empresa}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "direccion_empresa",
                        evento.target.value,
                      )
                    }
                    maxLength={180}
                    required
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Teléfono</span>
                  <input
                    value={plantilla.telefono_empresa}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "telefono_empresa",
                        evento.target.value,
                      )
                    }
                    maxLength={30}
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Correo comercial</span>
                  <input
                    type="email"
                    value={plantilla.correo_empresa}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "correo_empresa",
                        evento.target.value,
                      )
                    }
                    maxLength={254}
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Departamento emisor</span>
                  <input
                    value={plantilla.departamento_emisor}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "departamento_emisor",
                        evento.target.value,
                      )
                    }
                    maxLength={60}
                    required
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Forma de pago predeterminada</span>
                  <input
                    value={plantilla.forma_pago_predeterminada}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "forma_pago_predeterminada",
                        evento.target.value,
                      )
                    }
                    maxLength={80}
                    required
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="configuracion-grupo">
              <legend>
                <FiUsers aria-hidden="true" /> Responsables
              </legend>
              <div className="configuracion-campos configuracion-campos--dos">
                <label className="configuracion-campo">
                  <span>Elaborado por</span>
                  <input
                    value={plantilla.nombre_elaborador}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "nombre_elaborador",
                        evento.target.value,
                      )
                    }
                    maxLength={120}
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Cargo</span>
                  <input
                    value={plantilla.cargo_elaborador}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "cargo_elaborador",
                        evento.target.value,
                      )
                    }
                    maxLength={100}
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Autorizado por</span>
                  <input
                    value={plantilla.nombre_autorizador}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "nombre_autorizador",
                        evento.target.value,
                      )
                    }
                    maxLength={120}
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Cargo</span>
                  <input
                    value={plantilla.cargo_autorizador}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "cargo_autorizador",
                        evento.target.value,
                      )
                    }
                    maxLength={100}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="configuracion-grupo">
              <legend>Pie de página</legend>
              <div className="configuracion-campos configuracion-campos--dos">
                <label className="configuracion-campo">
                  <span>Texto del pie</span>
                  <input
                    value={plantilla.texto_pie_pagina}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "texto_pie_pagina",
                        evento.target.value,
                      )
                    }
                    maxLength={160}
                  />
                </label>

                <label className="configuracion-campo">
                  <span>Correo del pie</span>
                  <input
                    type="email"
                    value={plantilla.correo_pie_pagina}
                    onChange={(evento) =>
                      actualizarPlantilla(
                        "correo_pie_pagina",
                        evento.target.value,
                      )
                    }
                    maxLength={254}
                  />
                </label>
              </div>
            </fieldset>

            <footer className="configuracion-acciones">
              <p>Los cambios se aplicarán a los próximos documentos.</p>
              <button
                className="configuracion-guardar"
                type="submit"
                disabled={Boolean(guardando)}
              >
                <FiSave />
                {guardando === "plantilla"
                  ? "Guardando…"
                  : "Guardar plantilla"}
              </button>
            </footer>
          </form>

          <section className="configuracion-tarjeta">
            <header className="configuracion-tarjeta__cabecera">
              <FiImage aria-hidden="true" />
              <div>
                <h2>Logo y firmas</h2>
                <p>Imágenes utilizadas en la cabecera y las autorizaciones.</p>
              </div>
            </header>
        

            <div className="configuracion-recursos">
              <SelectorRecursoPlantilla
                tipo="logo"
                titulo="Logo de Ferreplast"
                descripcion="Se mostrará en la cabecera del documento."
                url={urlsRecursos.logo}
                tieneArchivo={Boolean(rutasRecursos.logo)}
                procesando={procesandoRecurso === "logo"}
                bloqueado={Boolean(procesandoRecurso)}
                onSubir={subirRecurso}
                onEliminar={eliminarRecurso}
              />

              <SelectorRecursoPlantilla
                tipo="firmaElaborador"
                titulo="Firma de elaboración"
                descripcion="Acompaña al responsable que prepara la cotización."
                url={urlsRecursos.firmaElaborador}
                tieneArchivo={Boolean(rutasRecursos.firmaElaborador)}
                procesando={procesandoRecurso === "firmaElaborador"}
                bloqueado={Boolean(procesandoRecurso)}
                onSubir={subirRecurso}
                onEliminar={eliminarRecurso}
              />

              <SelectorRecursoPlantilla
                tipo="firmaAutorizador"
                titulo="Firma de autorización"
                descripcion="Se mostrará en el bloque de gerencia."
                url={urlsRecursos.firmaAutorizador}
                tieneArchivo={Boolean(rutasRecursos.firmaAutorizador)}
                procesando={procesandoRecurso === "firmaAutorizador"}
                bloqueado={Boolean(procesandoRecurso)}
                onSubir={subirRecurso}
                onEliminar={eliminarRecurso}
              />
            </div>

            <p className="configuracion-recursos__ayuda">
              Formatos permitidos: PNG, JPG o WebP. Máximo 2 MB por imagen.
            </p>
          </section>
           <section className="configuracion-tarjeta">
  <header className="configuracion-tarjeta__cabecera">
    <FiCreditCard aria-hidden="true" />

    <div>
      <h2>Métodos de pago</h2>
      <p>
        Administra los métodos de pago disponibles para los clientes.
      </p>
    </div>
  </header>

  {cargandoMetodosPago ? (
    <div className="admin-loading">
      Cargando métodos de pago…
    </div>
  ) : metodosPago.length === 0 ? (
    <p>No hay métodos de pago configurados.</p>
  ) : (
    <div className="metodos-pago-admin">
      {metodosPago.map((metodo) => (
        <article
          key={metodo.id_metodo_pago}
          className="metodo-pago-admin"
        >
          <div>
            <h3>{metodo.nombre}</h3>

            <p>{metodo.descripcion}</p>

            <small>
              Código: {metodo.codigo}
            </small>
          </div>

          <div className="metodo-pago-admin__acciones">
                        <span
                          className={
                            metodo.activo
                              ? "metodo-pago-admin__estado metodo-pago-admin__estado--activo"
                              : "metodo-pago-admin__estado"
                          }
                        >
                          {metodo.activo ? "Activo" : "Inactivo"}
                        </span>

                        <button
                          type="button"
                          disabled={
                            actualizandoMetodoPago ===
                            metodo.id_metodo_pago
                          }
                          onClick={() =>
                            cambiarEstadoMetodoPago(
                              metodo.id_metodo_pago,
                              !metodo.activo
                            )
                          }
                        >
                          {actualizandoMetodoPago ===
                          metodo.id_metodo_pago
                            ? "Actualizando..."
                            : metodo.activo
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
        </div>
      )}
    </section>
  );
}

export default Configuracion;
