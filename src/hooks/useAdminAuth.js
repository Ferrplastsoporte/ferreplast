import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export const useAdminAuth = () => {
  const auth = useAuth()

  const createUserWithRole = async (userData, role) => {
    const result = await auth.register(userData)

    if (result?.user) {
      await supabase
        .from('usuario')
        .update({ rol_user: role })
        .eq('id_user', result.user.id)
    }

    return result
  }

  const changeUserRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('usuario')
      .update({ rol_user: newRole })
      .eq('id_user', userId)

    if (error) {
      console.error('Error al cambiar rol:', error)
      return false
    }
    return true
  }

  return {
    ...auth,
    createUserWithRole,
    changeUserRole
  }
}