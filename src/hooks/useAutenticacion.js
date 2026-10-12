import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const useAutenticacion = () => {
  const [loading, setLoading] = useState(false)
  const [resendingConfirmation, setResendingConfirmation] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [modal, setModal] = useState({
    visible: false,
    tipo: '',
    titulo: '',
    mensaje: '',
    codigo: ''
  })

  const showModal = (
    tipo,
    titulo,
    mensaje,
    codigo = ''
  ) => {
    setModal({
      visible: true,
      tipo,
      titulo,
      mensaje,
      codigo
    })
  }

  const hideModal = () => {
    setModal({
      visible: false,
      tipo: '',
      titulo: '',
      mensaje: '',
      codigo: ''
    })
  }

  const translateError = (error) => {
    const message =
      error?.message?.toLowerCase() ?? ''

    if (error?.code === 'captcha_failed' || message.includes('captcha')) {
      return 'La verificación de seguridad falló o venció. Complétala nuevamente.'
    }

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
    mode = 'client',
    captchaToken
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
          captchaToken,
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
    password,
    captchaToken
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

          password,
          options: { captchaToken }
        })

      if (error) {
        const message =
          error.message?.toLowerCase() ?? ''

        const emailNotConfirmed =
          error.code === 'email_not_confirmed' ||
          message.includes('email not confirmed')

        showModal(
          emailNotConfirmed
            ? 'warning'
            : 'error',
          emailNotConfirmed
            ? 'Confirma tu correo'
            : 'Error al iniciar sesión',
          translateError(error),
          emailNotConfirmed
            ? 'email_not_confirmed'
            : ''
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

      return userProfile
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

  const resendConfirmation = async (
    email,
    captchaToken
  ) => {
    if (resendingConfirmation) {
      return false
    }

    setResendingConfirmation(true)

    try {
      const normalizedEmail = email
        .trim()
        .toLowerCase()

      const { error } =
        await supabase.auth.resend({
          type: 'signup',
          email: normalizedEmail,
          options: {
            emailRedirectTo:
              `${window.location.origin}/login`,
            captchaToken
          }
        })

      if (error) {
        const message =
          error.message?.toLowerCase() ?? ''

        if (
          error.status === 429 ||
          error.code === 'over_email_send_rate_limit' ||
          error.code === 'over_request_rate_limit' ||
          message.includes('rate limit') ||
          message.includes('too many requests')
        ) {
          showModal(
            'warning',
            'Espera antes de reenviar',
            'Se alcanzó temporalmente el límite de correos. Inténtalo nuevamente más tarde.'
          )

          return false
        }

        if (
          error.code === 'captcha_failed' ||
          message.includes('captcha')
        ) {
          showModal(
            'error',
            'Verificación requerida',
            'La verificación de seguridad falló o venció. Complétala nuevamente.'
          )

          return false
        }

        if (
          message.includes('network') ||
          message.includes('failed to fetch')
        ) {
          showModal(
            'error',
            'Sin conexión',
            'No fue posible conectar con el servidor. Revisa tu conexión.'
          )

          return false
        }

        /*
         * No mostramos si el correo existe, ya fue
         * confirmado o no corresponde a un registro.
         */
        console.warn(
          'La solicitud de reenvío no generó un correo:',
          error
        )
      }

      showModal(
        'success',
        'Solicitud recibida',
        'Si existe una cuenta pendiente asociada a ese correo, recibirás un nuevo enlace de activación.'
      )

      return true
    } catch (error) {
      console.error(
        'Error inesperado al reenviar la confirmación:',
        error
      )

      showModal(
        'error',
        'No fue posible reenviar',
        'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.'
      )

      return false
    } finally {
      setResendingConfirmation(false)
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
    resendingConfirmation,
    initializing,

    modal,
    showModal,
    hideModal,

    register,
    login,
    resendConfirmation,
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
