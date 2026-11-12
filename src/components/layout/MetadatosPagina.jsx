import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  etiquetasMetadatos, obtenerMetadatos,
} from "../../utils/comunes/metadatosSitio";

function MetadatosPagina() {
  const { pathname } = useLocation();

  useEffect(() => {
    const datos = obtenerMetadatos(pathname);
    const etiquetas = etiquetasMetadatos(datos);
    const ids = new Set(etiquetas.map(({ attrs }) => attrs.id));
    // Retirar las etiquetas sociales públicas al entrar en una vista privada.
    document.head.querySelectorAll('meta[id^="seo-"]').forEach((elemento) => {
      if (!ids.has(elemento.id)) elemento.remove();
    });
    document.title = datos.titulo;
    for (const { tag, attrs } of etiquetas) {
      let elemento = document.getElementById(attrs.id);
      if (!elemento) {
        elemento = document.createElement(tag);
        document.head.appendChild(elemento);
      }
      for (const [nombre, valor] of Object.entries(attrs)) elemento.setAttribute(nombre, valor);
    }
    let canonical = document.getElementById("seo-canonical");
    if (datos.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.id = "seo-canonical";
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = datos.canonical;
    } else {
      canonical?.remove();
    }
  }, [pathname]);

  return null;
}

export default MetadatosPagina;
