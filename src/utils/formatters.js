// ============================
// FORMATEADORES
// ============================

export const formatPrice = (price) => {
  return `$${price.toLocaleString('es-CL')}`
}

export const formatRut = (rut) => {
  const [cuerpo, digito] = rut.split('-')
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpoFormateado}-${digito}`
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export const formatPhone = (phone) => {
  return phone.replace(/(\+569)(\d{4})(\d{4})/, '$1 $2 $3')
}

export const capitalize = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}