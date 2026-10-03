import { useEffect, useRef, useState } from "react";
import { cargarTurnstile, turnstileSiteKey } from "../../lib/turnstile";

export default function Captcha({ onToken, intento }) {
  const container = useRef(null);
  const [error, setError] = useState("");
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    let activo = true;
    let widget;
    let api;
    const fallar = () => {
      if (!activo) return;
      onToken("");
      setError("No se pudo verificar. Reintenta o recarga la página.");
    };
    cargarTurnstile().then((turnstile) => {
      if (!activo) return;
      api = turnstile;
      widget = api.render(container.current, {
        sitekey: turnstileSiteKey,
        language: "es",
        size: "flexible",
        "response-field": false,
        callback: (token) => {
          if (!activo) return;
          setError("");
          onToken(token);
        },
        "expired-callback": () => {
          if (activo) onToken("");
        },
        "error-callback": fallar,
        "timeout-callback": fallar,
      });
    }).catch(fallar);
    return () => {
      activo = false;
      if (widget !== undefined) api.remove(widget);
    };
  }, [onToken, intento, reintento]);

  if (!turnstileSiteKey) return null;
  return (
    <div style={{ marginBlock: "1rem", width: "100%" }}>
      <div ref={container} />
      {error && <p role="alert">{error}</p>}
      {error && <button type="button" onClick={() => {
        setError("");
        setReintento((actual) => actual + 1);
      }}>Reintentar verificación</button>}
    </div>
  );
}
