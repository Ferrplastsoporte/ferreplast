import { useState } from "react";
import { turnstileSiteKey } from "../lib/turnstile";

export default function useCaptcha() {
  const [token, setToken] = useState("");
  const [intento, setIntento] = useState(0);
  return {
    token,
    intento,
    setToken,
    pendiente: Boolean(turnstileSiteKey) && !token,
    reiniciar() {
      setToken("");
      setIntento((actual) => actual + 1);
    },
  };
}
