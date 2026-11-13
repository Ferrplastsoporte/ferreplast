// Una única vigilancia se monta desde App.
export function vigilarCuentaActiva({
  cliente,
  ventana = window,
  documento = document,
  alCerrarSesion,
  alError = () => {},
}) {
  let detenido = false;
  let consultando = false;
  let controlador = null;

  async function comprobar() {
    // Una pestaña suspendida se comprueba al volver a ella. No interferir
    // con las sesiones especiales de invitación y recuperación de contraseña.
    const ruta = ventana.location.pathname.replace(/\/+$/, '').toLowerCase();
    if (detenido || consultando || documento.visibilityState === 'hidden'
      || ruta === '/nuevacontrasena') return;

    consultando = true;
    let limite = null;
    try {
      const { data: sesionInicial, error: errorSesion } = await cliente.auth.getSession();
      const sesion = sesionInicial?.session;
      if (detenido || errorSesion || !sesion?.user?.id) return;

      controlador = new AbortController();
      limite = ventana.setTimeout(() => controlador?.abort(), 10_000);
      const { data: perfil, error } = await cliente.from('usuario')
        .select('est_user').eq('id_user', sesion.user.id).maybeSingle()
        .abortSignal(controlador.signal);

      // Un fallo de red no prueba que la cuenta haya sido deshabilitada.
      if (detenido || error || perfil?.est_user === true) return;
      if (perfil && perfil.est_user !== false) return;

      // No cerrar una sesión nueva por una respuesta de la cuenta anterior.
      const { data: actual, error: errorActual } = await cliente.auth.getSession();
      if (detenido || errorActual
        || actual?.session?.access_token !== sesion.access_token) return;

      // El alcance global revoca también los refresh tokens de otras sesiones.
      // Los controles del servidor siguen siendo necesarios para JWT ya emitidos.
      const { error: errorCierre } = await cliente.auth.signOut({ scope: 'global' });
      if (errorCierre) {
        alError(errorCierre);
        return;
      }
      if (!detenido) alCerrarSesion();
    } catch (error) {
      if (!detenido) alError(error);
    } finally {
      if (limite !== null) ventana.clearTimeout(limite);
      controlador = null;
      consultando = false;
    }
  }

  const intervalo = ventana.setInterval(comprobar, 15_000);
  ventana.addEventListener('focus', comprobar);
  ventana.addEventListener('online', comprobar);
  documento.addEventListener('visibilitychange', comprobar);
  void comprobar();

  return () => {
    detenido = true;
    controlador?.abort();
    ventana.clearInterval(intervalo);
    ventana.removeEventListener('focus', comprobar);
    ventana.removeEventListener('online', comprobar);
    documento.removeEventListener('visibilitychange', comprobar);
  };
}
