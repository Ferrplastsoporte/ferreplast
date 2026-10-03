export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "";

let scriptPromise;

export function cargarTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(fail, 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      scriptPromise = undefined;
      reject(new Error("No se pudo cargar la verificación de seguridad."));
    }
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (!window.turnstile) return fail();
      window.clearTimeout(timeout);
      resolve(window.turnstile);
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptPromise;
}
