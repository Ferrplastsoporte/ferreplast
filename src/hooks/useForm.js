import { useState } from 'react'

export const useForm = (initialValues, validateField) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    const newValues = { ...values, [name]: value }
    setValues(newValues)

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value, newValues)
      }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value, values)
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    Object.keys(values).forEach(key => {
      const error = validateField(key, values[key], values)
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
  }

  const setFieldValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  return {
    values,
    errors,
    setValues,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFieldValue
  }
}