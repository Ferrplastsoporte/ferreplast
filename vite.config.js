import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  PAGINAS_PUBLICAS, URL_SITIO, htmlMetadatos, obtenerMetadatos,
} from './src/utils/comunes/metadatosSitio.js'

// Produce metadatos estáticos para los robots que no ejecutan JavaScript.
// No prerenderiza el contenido React ni consulta datos privados durante el build.
function metadatosEstaticos() {
  let salida
  const rutasSinIndice = [
    '/login', '/registro', '/NuevaContrasena', '/RecuperarContrasena',
    '/cuenta', '/carrito', '/cotizacion', '/pedidos', '/pago/resultado',
    '/admin', '/admin/usuarios', '/admin/crearUsuario', '/admin/aprobaciones',
    '/admin/cotizaciones', '/admin/pedidos', '/admin/pagos', '/admin/Reportes',
    '/admin/auditoria', '/admin/configuracion', '/bodeguero',
    '/bodeguero/productos', '/bodeguero/stock', '/bodeguero/solicitudes',
    '/bodeguero/familias', '/bodeguero/marcas', '/bodeguero/unidades',
    '/bodeguero/documentos', '/bodeguero/pedidos',
  ]
  return {
    name: 'ferreplast-metadatos-estaticos',
    apply: 'build',
    configResolved(config) { salida = resolve(config.root, config.build.outDir) },
    transformIndexHtml(html) {
      // La entrada también sirve como fallback SPA: no imponer el canonical
      // de la portada a productos que aún no se han renderizado.
      return html.replace(/<!-- seo:inicio -->[\s\S]*?<!-- seo:fin -->/,
        `<!-- seo:inicio -->\n    ${htmlMetadatos(obtenerMetadatos('/'), false)}\n    <!-- seo:fin -->`)
    },
    async writeBundle(_opciones, bundle) {
      const inicio = bundle['index.html']
      if (!inicio || inicio.type !== 'asset') throw new Error('No se encontró el HTML de entrada para preparar SEO.')
      const plantilla = String(inicio.source)
      for (const ruta of [...Object.keys(PAGINAS_PUBLICAS).filter((r) => r !== '/'), ...rutasSinIndice]) {
        const carpeta = resolve(salida, ruta.slice(1))
        const html = plantilla.replace(/<!-- seo:inicio -->[\s\S]*?<!-- seo:fin -->/,
          `<!-- seo:inicio -->\n    ${htmlMetadatos(obtenerMetadatos(ruta))}\n    <!-- seo:fin -->`)
        await mkdir(carpeta, { recursive: true })
        await writeFile(resolve(carpeta, 'index.html'), html)
      }
      // Sitemap básico de presentación de la empresa; sin catálogo individual de productos.
      const urls = Object.keys(PAGINAS_PUBLICAS).map((ruta) =>
        `  <url><loc>${URL_SITIO}${ruta}</loc></url>`).join('\n')
      await writeFile(resolve(salida, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
    },
  }
}

export default defineConfig({ plugins: [react(), metadatosEstaticos()] })
