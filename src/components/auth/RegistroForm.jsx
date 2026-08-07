import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useForm } from "../../hooks/useForm";
import { useAuth } from "../../hooks/useAuth";
import { validateRegisterField } from "../../utils/validators";
import { sanitizeRegisterField } from "../../utils/helpers";

import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

const INITIAL_VALUES = {
  nombre: "",
  rut: "",
  email: "",
  password: "",
  confirmarPassword: "",
  direccion: "",
  telefono: "",
  region: "",
  comuna: "",
};

const RegistroForm = () => {
  const navigate = useNavigate();

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFieldValue,
    clearFieldError,
  } = useForm(INITIAL_VALUES, validateRegisterField, sanitizeRegisterField);

  const { register, loading, modal, hideModal } = useAuth();

  const [regiones, setRegiones] = useState([]);

  const [comunas, setComunas] = useState([]);

  const [loadingRegiones, setLoadingRegiones] = useState(false);

  const [loadingComunas, setLoadingComunas] = useState(false);

  /*
   * Después de un registro exitoso,
   * esperamos a que el cliente cierre
   * el modal antes de enviarlo al Login.
   */
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  useEffect(() => {
    cargarRegiones();
  }, []);

  const cargarRegiones = async () => {
    setLoadingRegiones(true);

    try {
      const { data, error } = await supabase
        .from("region")
        .select("id_reg, nom_reg")
        .order("nom_reg", {
          ascending: true,
        });

      if (error) {
        console.error("Error al cargar regiones:", error);

        setRegiones([]);
        return;
      }

      setRegiones(data ?? []);
    } catch (error) {
      console.error("Error inesperado al cargar regiones:", error);

      setRegiones([]);
    } finally {
      setLoadingRegiones(false);
    }
  };

  const cargarComunas = async (idRegion) => {
    if (!idRegion) {
      setComunas([]);
      return;
    }

    setLoadingComunas(true);

    try {
      const { data, error } = await supabase
        .from("comuna")
        .select("id_comuna, nom_comuna")
        .eq("id_reg", idRegion)
        .order("nom_comuna", {
          ascending: true,
        });

      if (error) {
        console.error("Error al cargar comunas:", error);

        setComunas([]);
        return;
      }

      setComunas(data ?? []);
    } catch (error) {
      console.error("Error inesperado al cargar comunas:", error);

      setComunas([]);
    } finally {
      setLoadingComunas(false);
    }
  };

  const handleRegionChange = async (event) => {
    const idRegion = event.target.value;

    setFieldValue("region", idRegion, {
      validate: true,
    });

    /*
     * Si cambia la región,
     * limpiamos la comuna anterior.
     */
    setFieldValue("comuna", "", {
      clearError: true,
    });

    clearFieldError("comuna");

    setComunas([]);

    if (idRegion) {
      await cargarComunas(idRegion);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const formularioValido = validateForm();

    if (!formularioValido) {
      return;
    }

    /*
     * Este formulario corresponde
     * exclusivamente al registro
     * público de clientes.
     */
    const resultado = await register(values, "client");

    if (resultado === true) {
      resetForm();

      setComunas([]);

      setRedirectToLogin(true);
    }
  };

  const handleModalClose = () => {
    hideModal();

    if (redirectToLogin) {
      setRedirectToLogin(false);

      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Nombre y apellidos"
          name="nombre"
          type="text"
          value={values.nombre}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.nombre}
          autoComplete="name"
          maxLength={80}
        />

        <Input
          label="RUT"
          name="rut"
          type="text"
          value={values.rut}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.rut}
          placeholder="12345678-5"
          maxLength={10}
        />

        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          autoComplete="email"
          maxLength={120}
        />

        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label="Confirmar contraseña"
          name="confirmarPassword"
          type="password"
          value={values.confirmarPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.confirmarPassword}
          autoComplete="new-password"
        />

        <Input
          label="Dirección"
          name="direccion"
          type="text"
          value={values.direccion}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.direccion}
          placeholder="Los Alerces 1234 #56"
          autoComplete="street-address"
          maxLength={120}
        />

        <Input
          label="Teléfono"
          name="telefono"
          type="tel"
          value={values.telefono}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.telefono}
          placeholder="+56912345678"
          autoComplete="tel"
          maxLength={12}
        />

        <Select
          label="Región"
          name="region"
          value={values.region}
          onChange={handleRegionChange}
          onBlur={handleBlur}
          error={errors.region}
          options={regiones.map((region) => ({
            id: region.id_reg,
            nombre: region.nom_reg,
          }))}
          placeholder={
            loadingRegiones ? "Cargando regiones..." : "Selecciona una región"
          }
          disabled={loadingRegiones}
        />

        <Select
          label="Comuna"
          name="comuna"
          value={values.comuna}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.comuna}
          options={comunas.map((comuna) => ({
            id: comuna.id_comuna,
            nombre: comuna.nom_comuna,
          }))}
          disabled={!values.region || loadingComunas}
          placeholder={
            !values.region
              ? "Primero selecciona una región"
              : loadingComunas
                ? "Cargando comunas..."
                : "Selecciona una comuna"
          }
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading || loadingRegiones || loadingComunas}
          className="registro-boton"
        >
          Registrarse
        </Button>
      </form>

      <Modal {...modal} onClose={handleModalClose} />
    </>
  );
};

export default RegistroForm;
