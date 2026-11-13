import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { vigilarCuentaActiva } from '../../utils/auth/vigilarCuentaActiva';

export default function VigilanciaSesion() {
  useEffect(() => vigilarCuentaActiva({
    cliente: supabase,
    alCerrarSesion: () => {
      // Recargar descarta perfiles y datos privados conservados en memoria
      // por las distintas instancias del hook de autenticación.
      window.location.replace('/login?cuenta=deshabilitada');
    },
    alError: (error) => console.error('No se pudo comprobar o cerrar la sesión:', {
      codigo: error?.code,
      estado: error?.status,
    }),
  }), []);

  return null;
}
