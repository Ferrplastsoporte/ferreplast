// Fuente única para el HTML de compilación y la navegación en React.
export const URL_SITIO = "https://ferreplastspa.cl";
export const IMAGEN_SITIO = `${URL_SITIO}/favicon-ferreplast.png`;

export const PAGINAS_PUBLICAS = {
  "/": {
    titulo: "Ferreplast Spa | Insumos FRP y Ferretería en Puerto Montt",
    descripcion: "Fibra de vidrio, resinas, herramientas e insumos FRP en Puerto Montt. Explora el catálogo de Ferreplast y encuentra materiales para tu proyecto.",
  },
  "/catalogo": {
    titulo: "Catálogo de productos | Ferreplast Spa",
    descripcion: "Explora el catálogo de Ferreplast: fibra de vidrio, resinas, herramientas e insumos de ferretería. Filtra productos y consulta sus características.",
  },
  "/ayuda": {
    titulo: "Ayuda para compras y pedidos | Ferreplast Spa",
    descripcion: "Resuelve tus dudas sobre compras, pedidos, despacho y tu cuenta en Ferreplast. Encuentra nuestros canales de atención en Puerto Montt.",
  },
};

const TITULOS_PRIVADOS = {
  "/login": "Iniciar sesión",
  "/registro": "Crear cuenta",
  "/nuevacontrasena": "Nueva contraseña",
  "/recuperarcontrasena": "Recuperar contraseña",
  "/cuenta": "Mi cuenta",
  "/carrito": "Carrito de compras",
  "/cotizacion": "Mi cotización",
};

export function normalizarRuta(ruta) {
  return ruta.replace(/\/+$/, "") || "/";
}

// Solo inicio, catálogo y ayuda reciben una presentación específica para buscadores.
// Las fichas de producto conservan una presentación genérica, sin impedir su indexación.
export function obtenerMetadatos(ruta) {
  const path = normalizarRuta(ruta).toLowerCase();
  const pagina = PAGINAS_PUBLICAS[path];
  const esProducto = /^\/producto\/[1-9]\d*$/.test(path);
  const tituloInterno = TITULOS_PRIVADOS[path]
    || (/^\/admin(?:\/|$)/.test(path) ? "Administración"
    : /^\/bodeguero(?:\/|$)/.test(path) ? "Bodega"
    : /^\/pedidos(?:\/|$)/.test(path) ? "Mis pedidos"
    : /^\/pago(?:\/|$)/.test(path) ? "Resultado del pago"
    : esProducto ? "Producto" : "Página no encontrada");
  const canonical = pagina ? `${URL_SITIO}${path}` : null;
  return {
    titulo: pagina?.titulo || `${tituloInterno} | Ferreplast Spa`,
    descripcion: pagina?.descripcion || "Accede a los servicios de Ferreplast desde su sitio oficial.",
    canonical,
    imagen: IMAGEN_SITIO,
    robots: pagina || esProducto ? "index,follow,max-image-preview:large" : "noindex,follow",
    url: canonical || URL_SITIO + "/",
    compartir: Boolean(pagina),
  };
}

export function etiquetasMetadatos(datos) {
  const metas = [
    ["descripcion", "name", "description", datos.descripcion],
    ["robots", "name", "robots", datos.robots],
    ["og-tipo", "property", "og:type", "website"],
    ["og-sitio", "property", "og:site_name", "Ferreplast Spa"],
    ["og-idioma", "property", "og:locale", "es_CL"],
    ["og-titulo", "property", "og:title", datos.titulo],
    ["og-descripcion", "property", "og:description", datos.descripcion],
    ["og-url", "property", "og:url", datos.url],
    ["og-imagen", "property", "og:image", datos.imagen],
    ["og-imagen-alt", "property", "og:image:alt", datos.titulo],
    ["twitter-tarjeta", "name", "twitter:card", "summary"],
    ["twitter-titulo", "name", "twitter:title", datos.titulo],
    ["twitter-descripcion", "name", "twitter:description", datos.descripcion],
    ["twitter-imagen", "name", "twitter:image", datos.imagen],
    ["twitter-imagen-alt", "name", "twitter:image:alt", datos.titulo],
  ];
  return metas.filter(([id]) => datos.compartir || id === "descripcion" || id === "robots")
    .map(([id, atributo, nombre, contenido]) => ({
    tag: "meta", attrs: { id: `seo-${id}`, [atributo]: nombre, content: contenido },
  }));
}

export function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

export function htmlMetadatos(datos, incluirCanonical = true) {
  const meta = etiquetasMetadatos(datos).map(({ tag, attrs }) =>
    `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${escaparHTML(v)}"`).join(" ")} />`
  );
  if (incluirCanonical && datos.canonical) meta.push(`<link id="seo-canonical" rel="canonical" href="${escaparHTML(datos.canonical)}" />`);
  return `<title>${escaparHTML(datos.titulo)}</title>\n    ${meta.join("\n    ")}`;
}
