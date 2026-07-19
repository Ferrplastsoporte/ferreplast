// ============================
// HELPERS
// ============================

export const normalizeText = (text) => {
  return text.replace(/\s+/g, ' ').trim()
}

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}