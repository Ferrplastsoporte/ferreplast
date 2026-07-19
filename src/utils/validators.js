// ============================
// VALIDADORES
// ============================

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isValidRut = (rut) => {
  if (!/^\d{7,8}-[\dkK]$/.test(rut)) return false

  const [cuerpo, digitoIngresado] = rut.split('-')
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  let digitoCalculado

  if (resto === 11) digitoCalculado = '0'
  else if (resto === 10) digitoCalculado = 'K'
  else digitoCalculado = String(resto)

  return digitoIngresado.toUpperCase() === digitoCalculado
}

export const isValidPhone = (phone) => {
  return /^\+569\d{8}$/.test(phone)
}

// src/utils/validators.js

export const isValidPassword = (password) => {
  // Mínimo 8 caracteres
  if (password.length < 8) return false
  
  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) return false
  
  // Al menos una minúscula
  if (!/[a-z]/.test(password)) return false
  
  // Al menos un número
  if (!/[0-9]/.test(password)) return false
  
  // Al menos un símbolo
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false
  
  return true
}

export const isValidName = (name) => {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(name)
}

export const isValidAddress = (address) => {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#]+)*$/.test(address) && address.length >= 5
}   