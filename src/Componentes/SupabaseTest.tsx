import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseTest() {
  const [message, setMessage] = useState('Conectando...')

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('test')
        .select('*')
        .limit(1)

      if (error) {
        setMessage(`❌ ${error.message}`)
        return
      }

      setMessage('✅ Conexión exitosa con Supabase')
      console.log(data)
    }

    testConnection()
  }, [])

  return (
    <div>
      <h2>Prueba de Supabase</h2>
      <p>{message}</p>
    </div>
  )
}