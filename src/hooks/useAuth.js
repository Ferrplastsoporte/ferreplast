import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [modal, setModal] = useState({
    visible: false,
    tipo: '',
    titulo: '',
    mensaje: ''
  })

  const showModal = (
    tipo,
    titulo,
    mensaje
  ) => {
    setModal({
      visible: true,
      tipo,
      titulo,
      mensaje
    })
  }

  const hideModal = () => {
    setModal({
      visible: false,
      tipo: '',
      titulo: '',
      mensaje: ''
    })
  }

  const translateError = (error) => {
    const message =
      error?.message?.toLowerCase() ?? ''

    if (
      message.includes(
        'invalid login credentials'
      )
    ) {
      return 'El correo o la contraseña son incorrectos.'
    }

    if (message.includes('email not confirmed')) {
      return 'Debes confirmar tu correo antes de iniciar sesión.'
    }

    if (
      message.includes('already registered') ||
      message.includes(
        'user already registered'
      )
    ) {
      return 'El correo electrónico ya está registrado.'
    }

    if (
      message.includes('password should be') ||
      message.includes('weak password')
    ) {
      return 'La contraseña no cumple con los requisitos de seguridad.'
    }

    if (
      message.includes('invalid email')
    ) {
      return 'El correo electrónico no es válido.'
    }

    if (
      message.includes('too many requests') ||
      message.includes('rate limit')
    ) {
      return 'Has realizado demasiados intentos. Espera unos minutos.'
    }

    if (
      message.includes('database error') ||
      message.includes('saving new user')
    ) {
      return 'No fue posible crear el perfil del usuario.'
    }

    if (
      message.includes('network') ||
      message.includes('failed to fetch')
    ) {
      return 'No fue posible conectar con el servidor. Revisa tu conexión.'
    }

    return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
  }

  const clearAuthState = () => {
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('usuario')
      .select(`
        id_user,
        nom_user,
        rut_user,
        direc_user,
        phone_user,
        id_comuna,
        est_user,
        rol_user
      `)
      .eq('id_user', userId)
      .maybeSingle()

    if (error) {
      console.error(
        'Error al cargar el perfil:',
        error
      )

      setProfile(null)
      return null
    }

    setProfile(data ?? null)

    return data ?? null
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
          error
        } = await supabase.auth.getSession()

        if (error) {
          console.error(
            'Error al obtener la sesión:',
            error
          )

          if (mounted) {
            clearAuthState()
          }

          return
        }

        if (!mounted) {
          return
        }

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await loadProfile(
            currentSession.user.id
          )
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error(
          'Error inesperado al iniciar la sesión:',
          error
        )

        if (mounted) {
          clearAuthState()
        }
      } finally {
        if (mounted) {
          setInitializing(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) {
          return
        }

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await loadProfile(
            currentSession.user.id
          )
        } else {
          setProfile(null)
        }

        setInitializing(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const register = async (
    userData,
    mode = 'client'
  ) => {
    if (loading) {
      return false
    }

    /*
     * La creación administrativa de usuarios
     * no debe realizarse con signUp desde el
     * navegador, porque podría reemplazar la
     * sesión actual del administrador.
     */
    if (mode === 'admin') {
      showModal(
        'warning',
        'Función administrativa pendiente',
        'La creación de trabajadores debe implementarse mediante una función segura del servidor.'
      )

      return false
    }

    setLoading(true)

    try {
      const email = userData.email
        .trim()
        .toLowerCase()

      /*
       * No insertamos manualmente en public.usuario.
       *
       * Estos datos se guardan como metadata y el
       * trigger de Supabase se encarga de crear
       * el perfil en la tabla usuario.
       */
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password: userData.password,
        options: {
          data: {
            nombre:
              userData.nombre.trim(),
            rut:
              userData.rut
                .trim()
                .toUpperCase(),
            direccion:
              userData.direccion.trim(),
            telefono:
              userData.telefono.trim(),
            comuna:
              Number(userData.comuna)
          }
        }
      })

      if (error) {
        showModal(
          'error',
          'Error al registrarse',
          translateError(error)
        )
        return false
      }
      if (!data?.user) {
        showModal(
          'error',
          'Error al registrarse',
          'No fue posible crear la cuenta.'
        )
        return false
      }
      showModal(
        'success',
        'Cuenta creada',
        'Revisa tu correo electrónico y confirma tu cuenta para poder iniciar sesión.'
      )
      return true
    } catch (error) {
      console.error(
        'Error inesperado durante el registro:',
        error
      )
      showModal(
        'error',
        'Error inesperado',
        translateError(error)
      )
      return false
    } finally {
      setLoading(false)
    }
  }

  const login = async (
    email,
    password
  ) => {
    if (loading) {
      return false
    }

    setLoading(true)

    try {
      const {
        data,
        error
      } =
        await supabase.auth.signInWithPassword({
          email: email
            .trim()
            .toLowerCase(),

          password
        })

      if (error) {
        showModal(
          'error',
          'Error al iniciar sesión',
          translateError(error)
        )

        return false
      }

      if (!data?.user || !data?.session) {
        showModal(
          'error',
          'Error al iniciar sesión',
          'No fue posible iniciar la sesión.'
        )

        return false
      }

      const userProfile = await loadProfile(
        data.user.id
      )

      if (!userProfile) {
        await supabase.auth.signOut()
        clearAuthState()

        showModal(
          'error',
          'Perfil no encontrado',
          'La cuenta existe, pero no se encontró su perfil de usuario.'
        )

        return false
      }

      if (userProfile.est_user !== true) {
        await supabase.auth.signOut()
        clearAuthState()

        showModal(
          'warning',
          'Cuenta no habilitada',
          'Debes confirmar tu correo o esperar a que tu cuenta sea habilitada.'
        )

        return false
      }

      setSession(data.session)
      setUser(data.user)
      setProfile(userProfile)

      return true
    } catch (error) {
      console.error(
        'Error inesperado durante el inicio de sesión:',
        error
      )

      showModal(
        'error',
        'Error inesperado',
        translateError(error)
      )

      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    if (loading) {
      return false
    }

    setLoading(true)

    try {
      const { error } =
        await supabase.auth.signOut()

      if (error) {
        showModal(
          'error',
          'Error al cerrar sesión',
          translateError(error)
        )

        return false
      }

      clearAuthState()

      return true
    } catch (error) {
      console.error(
        'Error inesperado al cerrar sesión:',
        error
      )

      showModal(
        'error',
        'Error inesperado',
        translateError(error)
      )

      return false
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null)
      return null
    }

    return await loadProfile(user.id)
  }

  return {
    session,
    user,
    profile,

    loading,
    initializing,

    modal,
    showModal,
    hideModal,

    register,
    login,
    logout,
    loadProfile,
    refreshProfile,

    isAuthenticated: Boolean(
      session && user && profile
    ),

    role: profile?.rol_user ?? null,

    isActive:
      profile?.est_user === true
  }
}