import { useState } from 'react'

export const useForm = (
  initialValues,
  validateField,
  sanitizeField = (_name, value) => value
) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target

    /*
     * Antes de guardar el valor, eliminamos
     * inmediatamente caracteres incompatibles.
     */
    const sanitizedValue = sanitizeField(
      name,
      value
    )

    const newValues = {
      ...values,
      [name]: sanitizedValue
    }

    setValues(newValues)

    /*
     * Si el campo ya mostraba un error,
     * se vuelve a validar mientras se corrige.
     */
    if (errors[name]) {
      const fieldError = validateField(
        name,
        sanitizedValue,
        newValues
      )

      setErrors((previousErrors) => ({
        ...previousErrors,
        [name]: fieldError
      }))
    }

    /*
     * Si cambia la contraseña, también
     * actualizamos confirmarPassword.
     */
    if (
      name === 'password' &&
      (
        newValues.confirmarPassword ||
        errors.confirmarPassword
      )
    ) {
      const confirmationError = validateField(
        'confirmarPassword',
        newValues.confirmarPassword,
        newValues
      )

      setErrors((previousErrors) => ({
        ...previousErrors,
        confirmarPassword: confirmationError
      }))
    }
  }

  const handleBlur = (event) => {
    const { name, value } = event.target

    const sanitizedValue = sanitizeField(
      name,
      value
    )

    /*
     * También guardamos el valor limpio al salir,
     * por ejemplo para quitar espacios finales.
     */
    const newValues = {
      ...values,
      [name]: sanitizedValue
    }

    setValues(newValues)

    const fieldError = validateField(
      name,
      sanitizedValue,
      newValues
    )

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: fieldError
    }))
  }

  const validateForm = () => {
    const sanitizedValues = {}

    Object.keys(values).forEach((fieldName) => {
      sanitizedValues[fieldName] =
        sanitizeField(
          fieldName,
          values[fieldName]
        )
    })

    setValues(sanitizedValues)

    const newErrors = {}

    Object.keys(sanitizedValues).forEach(
      (fieldName) => {
        const fieldError = validateField(
          fieldName,
          sanitizedValues[fieldName],
          sanitizedValues
        )

        if (fieldError) {
          newErrors[fieldName] = fieldError
        }
      }
    )

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
  }

  const setFieldValue = (
    name,
    value,
    options = {}
  ) => {
    const {
      validate = false,
      clearError = false,
      sanitize = true
    } = options

    setValues((previousValues) => {
      const nextValue = sanitize
        ? sanitizeField(name, value)
        : value

      const newValues = {
        ...previousValues,
        [name]: nextValue
      }

      if (clearError) {
        setErrors((previousErrors) => ({
          ...previousErrors,
          [name]: ''
        }))
      } else if (validate) {
        const fieldError = validateField(
          name,
          nextValue,
          newValues
        )

        setErrors((previousErrors) => ({
          ...previousErrors,
          [name]: fieldError
        }))
      }

      return newValues
    })
  }

  const setFieldError = (name, error) => {
    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: error
    }))
  }

  const clearFieldError = (name) => {
    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: ''
    }))
  }

  const clearErrors = () => {
    setErrors({})
  }

  return {
    values,
    errors,
    setValues,
    setErrors,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearErrors
  }
}