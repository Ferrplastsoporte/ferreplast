// ============================================================
// BuscadorInteligente
// Reemplaza el <form className="navbar__buscador"> del Navbar.
// Mientras el cliente escribe, muestra:
//   - la categoría que predice el modelo (si está seguro)
//   - hasta 4 productos sugeridos
//   - "Ver todos los resultados"
// Navegación con teclado: ↑ ↓ para moverse, Enter para abrir, Esc para cerrar.
// ============================================================
import { useEffect, useId, useRef, useState } from "react";
import { FaSearch, FaTag } from "react-icons/fa";
import { buscarProductosInteligente } from "../../services/catalogoService";
import { obtenerUrlImagenProducto } from "../../services/productoStorageService";
import {
  LONGITUD_MAXIMA_BUSQUEDA, normalizarTerminoBusqueda, sanitizarTerminoBusqueda,
} from "../../utils/comunes/busqueda";
import "../css/BuscadorInteligente.css";

const MIN_LETRAS = 3;            // desde cuántas letras se muestran sugerencias
const ESPERA_MS = 300;           // espera después de la última tecla
const CONFIANZA_MINIMA = 0.6;    // la categoría se muestra solo si el modelo está seguro
const MAX_SUGERENCIAS = 4;

const formatoPrecio = new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
});

function precioVisible(producto) {
  const actual = producto.precio_act ?? producto.precio_prod;
  const numero = Number(actual);
  return Number.isFinite(numero) && numero > 0 ? formatoPrecio.format(numero) : "";
}

function BuscadorInteligente({ valor, onCambiar, onBuscar, onNavegar }) {
  const idLista = useId();
  const contenedorRef = useRef(null);
  const cacheRef = useRef(new Map());       // evita repetir la misma consulta
  const [sugerencias, setSugerencias] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);  // índice resaltado con el teclado

  const texto = normalizarTerminoBusqueda(valor);
  const mostrarCategoria = sugerencias?.categoria && sugerencias.probabilidad >= CONFIANZA_MINIMA;
  const productos = sugerencias?.productos ?? [];

  // Opciones navegables: productos + "ver todos"
  const opciones = [
    ...productos.map((p) => ({ tipo: "producto", ruta: `/producto/${p.id_prod}` })),
    ...(texto ? [{ tipo: "todos", ruta: `/catalogo?buscar=${encodeURIComponent(texto)}` }] : []),
  ];

  // Pide sugerencias al modelo cuando el cliente deja de escribir
  useEffect(() => {
    if (texto.length < MIN_LETRAS) {
      setSugerencias(null);
      setCargando(false);
      return undefined;
    }
    const clave = texto.toLowerCase();
    if (cacheRef.current.has(clave)) {
      setSugerencias(cacheRef.current.get(clave));
      return undefined;
    }

    const controller = new AbortController();
    setCargando(true);
    const timer = setTimeout(async () => {
      try {
        const data = await buscarProductosInteligente({
          busqueda: texto, pagina: 1, tamanoPagina: MAX_SUGERENCIAS,
          sugerencia: true, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        cacheRef.current.set(clave, data);
        setSugerencias(data);
        setActivo(-1);
      } catch {
        if (!controller.signal.aborted) setSugerencias(null);  // sin sugerencias, el buscador sigue funcionando
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }, ESPERA_MS);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [texto]);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    function clicFuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", clicFuera);
    return () => document.removeEventListener("mousedown", clicFuera);
  }, []);

  function navegar(ruta) {
    setAbierto(false);
    setActivo(-1);
    onNavegar(ruta);
  }

  function alEnviar(evento) {
    if (abierto && activo >= 0 && opciones[activo]) {
      evento.preventDefault();
      navegar(opciones[activo].ruta);
      return;
    }
    setAbierto(false);
    onBuscar(evento);
  }

  function alPresionarTecla(evento) {
    if (!abierto || opciones.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setActivo((i) => (i + 1) % opciones.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setActivo((i) => (i <= 0 ? opciones.length - 1 : i - 1));
    } else if (evento.key === "Escape") {
      setAbierto(false);
      setActivo(-1);
    }
  }

  const menuVisible = abierto && texto.length >= MIN_LETRAS && (cargando || sugerencias);

  return (
    <div className="buscador-inteligente" ref={contenedorRef}>
      <form className="navbar__buscador" onSubmit={alEnviar} role="search">
        <input
          type="search" placeholder="Buscar productos..." aria-label="Buscar productos"
          value={valor} maxLength={LONGITUD_MAXIMA_BUSQUEDA}
          role="combobox" aria-autocomplete="list" aria-expanded={Boolean(menuVisible)}
          aria-controls={idLista}
          aria-activedescendant={activo >= 0 ? `${idLista}-${activo}` : undefined}
          onChange={(e) => { onCambiar(sanitizarTerminoBusqueda(e.target.value)); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alPresionarTecla}
          autoComplete="off"
        />
        <button type="submit" aria-label="Buscar"><FaSearch aria-hidden="true" /></button>
      </form>

      {menuVisible && (
        <div className="buscador-inteligente__menu" id={idLista} role="listbox">
          {cargando && !sugerencias && (
            <p className="buscador-inteligente__estado">Buscando…</p>
          )}

          {mostrarCategoria && (
            <p className="buscador-inteligente__categoria">
              <FaTag aria-hidden="true" />
              <span>Parece que buscas: <strong>{sugerencias.categoria}</strong></span>
            </p>
          )}

          {sugerencias && productos.length === 0 && !cargando && (
            <p className="buscador-inteligente__estado">
              No encontramos productos para “{texto}”.
            </p>
          )}

          {productos.map((producto, i) => {
            const imagen = obtenerUrlImagenProducto(producto.imagen_url);
            return (
              <button
                key={producto.id_prod} id={`${idLista}-${i}`} type="button" role="option"
                aria-selected={activo === i}
                className={`buscador-inteligente__producto${activo === i ? " es-activo" : ""}`}
                onMouseEnter={() => setActivo(i)}
                onClick={() => navegar(`/producto/${producto.id_prod}`)}
              >
                {imagen
                  ? <img src={imagen} alt="" loading="lazy" />
                  : <span className="buscador-inteligente__sin-imagen" aria-hidden="true" />}
                <span className="buscador-inteligente__nombre">{producto.nom_prod}</span>
                <span className="buscador-inteligente__precio">{precioVisible(producto)}</span>
              </button>
            );
          })}

          {texto && (
            <button
              id={`${idLista}-${productos.length}`} type="button" role="option"
              aria-selected={activo === productos.length}
              className={`buscador-inteligente__todos${activo === productos.length ? " es-activo" : ""}`}
              onMouseEnter={() => setActivo(productos.length)}
              onClick={() => navegar(`/catalogo?buscar=${encodeURIComponent(texto)}`)}
            >
              Ver todos los resultados para “{texto}”.
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BuscadorInteligente;