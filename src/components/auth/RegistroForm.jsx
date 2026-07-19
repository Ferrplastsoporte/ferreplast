import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useForm } from '../../hooks/useForm'
import { useAuth } from '../../hooks/useAuth'
import { 
  isValidEmail, 
  isValidRut, 
  isValidPhone, 
  isValidPassword,
  isValidName,
  isValidAddress
} from '../../utils/validators'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const BASE_VALUES = {
  nombre: '', 
  rut: '', 
  email: '', 
  password: '',
  confirmarPassword: '', 
  direccion: '', 
  telefono: '',
  region: '', 
  comuna: ''
}

const ADMIN_VALUES = { 
  rol: 'bodeguero', 
  estado: 'activo' 
}

const validateField = (name, value, form) => {
  const val = typeof value === 'string' ? value.trim() : value
  
  switch (name) {
    case 'nombre':
      if (!val) return 'Debes ingresar tu nombre.'
      if (!isValidName(val)) return 'El nombre solo puede contener letras y espacios.'
      if (val.length < 3) return 'Mínimo 3 caracteres.'
      return ''
    case 'rut':
      if (!val) return 'Debes ingresar tu RUT.'
      if (!isValidRut(val)) return 'RUT inválido (ej: 12345678-5).'
      return ''
    case 'email':
      if (!val) return 'Debes ingresar tu correo.'
      if (!isValidEmail(val)) return 'Correo inválido.'
      return ''
    case 'password':
  if (!val) return 'Debes crear una contraseña.'
  if (!isValidPassword(val)) {
    return 'Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.'
  }
  return ''
    case 'confirmarPassword':
      if (!val) return 'Debes repetir la contraseña.'
      if (val !== form.password) return 'Las contraseñas no coinciden.'
      return ''
    case 'direccion':
      if (!val) return 'Debes ingresar tu dirección.'
      if (!isValidAddress(val)) return 'Dirección inválida.'
      return ''
    case 'telefono':
      if (!val) return 'Debes ingresar tu teléfono.'
      if (!isValidPhone(val)) return 'Formato: +56912345678'
      return ''
    case 'region':
      if (!val) return 'Debes seleccionar una región.'
      return ''
    case 'comuna':
      if (!val) return 'Debes seleccionar una comuna.'
      return ''
    default: return ''
  }
}

const RegistroForm = ({ mode = 'client' }) => {
  const initialValues = { 
    ...BASE_VALUES, 
    ...(mode === 'admin' ? ADMIN_VALUES : {}) 
  }
  
  const { values, errors, handleChange, handleBlur, validateForm, setValues } = 
    useForm(initialValues, validateField)
  
  const { register, loading, modal, hideModal } = useAuth()
  const [regiones, setRegiones] = useState([])
  const [comunas, setComunas] = useState([])

  useEffect(() => { 
    cargarRegiones() 
  }, [])

  const cargarRegiones = async () => {
    const { data } = await supabase
      .from('region')
      .select('id_reg, nom_reg')
      .order('nom_reg')
    setRegiones(data || [])
  }

  const handleRegionChange = async (e) => {
    const idRegion = e.target.value
    setValues({ ...values, region: idRegion, comuna: '' })
    
    if (idRegion) {
      const { data } = await supabase
        .from('comuna')
        .select('id_comuna, nom_comuna')
        .eq('id_reg', idRegion)
        .order('nom_comuna')
      setComunas(data || [])
    } else {
      setComunas([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    await register(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input 
        label="Nombre y apellidos" 
        name="nombre" 
        value={values.nombre} 
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.nombre} 
      />
      
      <Input 
        label="RUT" 
        name="rut" 
        value={values.rut} 
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.rut} 
        placeholder="12345678-5"
      />
      
      <Input 
        label="Correo electrónico" 
        name="email" 
        type="email" 
        value={values.email}
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.email} 
      />
      
      <Input 
        label="Contraseña" 
        name="password" 
        type="password" 
        value={values.password}
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.password} 
      />
      
      <Input 
        label="Confirmar contraseña" 
        name="confirmarPassword" 
        type="password" 
        value={values.confirmarPassword} 
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.confirmarPassword} 
      />
      
      <Input 
        label="Dirección" 
        name="direccion" 
        value={values.direccion}
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.direccion} 
        placeholder="Los Alerces 1234 #56"
      />
      
      <Input 
        label="Teléfono" 
        name="telefono" 
        value={values.telefono}
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.telefono} 
        placeholder="+56912345678"
      />
      
      <Select 
        label="Región" 
        name="region" 
        value={values.region} 
        onChange={handleRegionChange} 
        onBlur={handleBlur} 
        error={errors.region}
        options={regiones.map(r => ({ id: r.id_reg, nombre: r.nom_reg }))} 
        placeholder="Selecciona una región"
      />

      <Select 
        label="Comuna" 
        name="comuna" 
        value={values.comuna} 
        onChange={handleChange} 
        onBlur={handleBlur} 
        error={errors.comuna}
        options={comunas.map(c => ({ id: c.id_comuna, nombre: c.nom_comuna }))}
        disabled={!values.region} 
        placeholder={values.region ? "Selecciona una comuna" : "Primero selecciona una región"}
      />

      {mode === 'admin' && (
        <>
          <Select 
            label="Rol" 
            name="rol" 
            value={values.rol} 
            onChange={handleChange}
            options={[
              { id: 'bodeguero', nombre: '👨‍🏭 Bodeguero' },
              { id: 'vendedor', nombre: '🧑‍💼 Vendedor' },
              { id: 'admin', nombre: '👑 Administrador' },
            ]} 
          />
          
          <Select 
            label="Estado" 
            name="estado" 
            value={values.estado} 
            onChange={handleChange}
            options={[
              { id: 'activo', nombre: '✅ Activo' },
              { id: 'inactivo', nombre: '⛔ Inactivo' },
            ]} 
          />
        </>
      )}

      <Button type="submit" loading={loading} className="registro-boton">
        {loading 
          ? (mode === 'admin' ? 'Creando usuario...' : 'Creando cuenta...') 
          : (mode === 'admin' ? 'Crear Usuario' : 'Registrarse')
        }
      </Button>

      <Modal {...modal} onClose={hideModal} />
    </form>
  )
}

export default RegistroForm