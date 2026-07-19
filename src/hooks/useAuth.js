// src/hooks/useAuth.js
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({
    visible: false,
    tipo: '',
    titulo: '',
    mensaje: '',
  })

  const showModal = (tipo, titulo, mensaje) => {
    setModal({ visible: true, tipo, titulo, mensaje })
  }

  const hideModal = () => {
    setModal({ visible: false, tipo: '', titulo: '', mensaje: '' })
  }

  const translateError = (error) => {
    const msg = error?.message?.toLowerCase() || ''
    if (msg.includes('invalid login credentials')) return 'Credenciales incorrectas.'
    if (msg.includes('email not confirmed')) return 'Confirma tu correo primero.'
    if (msg.includes('already registered')) return 'El correo ya está registrado.'
    if (msg.includes('too many requests')) return 'Demasiados intentos. Espera un momento.'
    if (msg.includes('database error') || msg.includes('saving new user')) {
      return 'Error al guardar el perfil. Verifica que todos los campos estén correctos.'
    }
    return 'Ocurrió un error. Inténtalo nuevamente.'
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        showModal('error', 'Error al iniciar sesión', translateError(error))
        return
      }

      // 🔹 Buscar en la tabla "usuario" (sin S)
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuario')
        .select('id_user, nom_user, est_user, rol_user')
        .eq('id_user', data.user.id)
        .single()

      if (errorUsuario || !usuario) {
        await supabase.auth.signOut()
        showModal('error', 'Perfil no encontrado', 'No se encontró tu perfil.')
        return
      }

      if (usuario.est_user !== true) {
        await supabase.auth.signOut()
        showModal('warning', 'Cuenta pendiente', 'Debes confirmar tu correo.')
        return
      }

      navigate('/', { replace: true })
    } catch (error) {
      showModal('error', 'Error inesperado', 'Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      console.log('📝 Datos recibidos:', userData)

      // 🔹 PASO 1: Crear usuario en auth (SOLO email + password)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        // ⚠️ SIN options.data - esto se hace en el paso 2
      })

      if (authError || !authData?.user) {
        console.error('❌ Error en auth:', authError)
        showModal('error', 'Error al registrarse', translateError(authError))
        return
      }

      console.log('✅ Usuario creado en auth:', authData.user.id)

      // 🔹 PASO 2: Insertar perfil en tabla "usuario"
      const { error: profileError } = await supabase
        .from('usuario')
        .insert([
          {
            id_user: authData.user.id,  // ← id_user (NO id_auth)
            nom_user: userData.nombre?.trim(),
            rut_user: userData.rut?.trim().toUpperCase(),
            direc_user: userData.direccion?.trim(),
            phone_user: userData.telefono?.trim(),
            id_comuna: Number(userData.comuna),
            est_user: false,  // DEFAULT false
            // rol_user se asigna por defecto o se deja NULL
          },
        ])

      if (profileError) {
        console.error('❌ Error al guardar perfil:', profileError)
        console.error('❌ Detalle del error:', profileError.message)
        showModal('error', 'Error al guardar perfil', 'El usuario se creó pero no se pudo guardar el perfil. Verifica: RUT único, comuna válida.')
        return
      }

      console.log('✅ Perfil guardado correctamente')
      showModal('success', 'Cuenta creada', 'Confirma tu correo para iniciar sesión.')
      return authData
    } catch (error) {
      console.error('❌ Error inesperado:', error)
      showModal('error', 'Error inesperado', 'Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return {
    login,
    register,
    logout,
    loading,
    modal,
    showModal,
    hideModal
  }
}