import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno en .env')
}

// Capturar solo el tipo y el identificador de sesión antes de que el SDK
// consuma el fragmento del enlace. No conservar los tokens de la URL.
export const contextoEnlacePassword = (() => {
  const resultado = { tipo: "", idSesion: "", error: false, usado: false }
  if (typeof window === 'undefined') return resultado
  const url = new URL(window.location.href)
  if (url.pathname.replace(/\/+$/, '').toLowerCase() !== '/nuevacontrasena') return resultado
  const parametros = new URLSearchParams(url.hash.slice(1))
  resultado.error = ['error', 'error_code', 'error_description'].some(
    (clave) => parametros.has(clave) || url.searchParams.has(clave)
  )
  const tipo = parametros.get('type') ?? ''
  if (!['recovery', 'invite'].includes(tipo) || !parametros.get('refresh_token')) return resultado
  try {
    const payload = parametros.get('access_token')?.split('.')[1]
    if (!payload) return resultado
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof claims.session_id === 'string') {
      resultado.tipo = tipo
      resultado.idSesion = claims.session_id
    }
  } catch {
    // La vista rechazará el enlace si Auth tampoco puede verificarlo.
  }
  return resultado
})()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
