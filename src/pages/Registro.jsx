import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./Registro.css";

function Registro() {
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");

  const [region, setRegion] = useState("");
  const [comuna, setComuna] = useState("");

  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);

  const [message, setMessage] = useState("");

  // Cargar regiones al iniciar
  useEffect(() => {
    cargarRegiones();
  }, []);

  async function cargarRegiones() {
    const { data, error } = await supabase
        .from("region")
        .select("*")
        .order("nom_reg");

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
        console.error(error);
        return;
    }

    setRegiones(data);
    }

  async function cargarComunas(idRegion) {
    const { data, error } = await supabase
      .from("comuna")
      .select("*")
      .eq("id_reg", idRegion)
      .order("nom_comuna");

    if (error) {
      console.error("Error comunas:", error);
      return;
    }

    setComunas(data);
  }

  const handleRegionChange = async (e) => {
    const idRegion = e.target.value;

    setRegion(idRegion);
    setComuna("");
    setComunas([]);

    if (idRegion) {
      await cargarComunas(idRegion);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();

    console.log({
      nombre,
      rut,
      email,
      password,
      direccion,
      telefono,
      region,
      comuna,
    });

    setMessage("Formulario enviado correctamente");
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h1>Crear Cuenta</h1>

        <form onSubmit={handleRegistro}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>RUT</label>
            <input value={rut} onChange={(e) => setRut(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          </div>

          {/* REGIÓN */}
          <div className="form-group">
            <label>Región</label>
            <select value={region} onChange={handleRegionChange} required>
              <option value="">Seleccione una región</option>

              {regiones.map((r) => (
                <option key={r.id_reg} value={r.id_reg}>
                  {r.nom_reg}
                </option>
              ))}
            </select>
          </div>

          {/* COMUNA */}
          <div className="form-group">
            <label>Comuna</label>
            <select value={comuna} onChange={(e) => setComuna(e.target.value)} required>
              <option value="">Seleccione una comuna</option>

              {comunas.map((c) => (
                <option key={c.id_comuna} value={c.id_comuna}>
                  {c.nom_comuna}
                </option>
              ))}
            </select>
          </div>

          <button type="submit">Registrarse</button>
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default Registro;