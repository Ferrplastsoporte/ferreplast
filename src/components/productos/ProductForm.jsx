import { useState } from "react";
import '../../components/css/productos.css' 

const ProductForm = ({ onSubmit, productoInicial = null, onCancel }) => {
  const [nombre, setNombre] = useState(productoInicial?.nom_prod || productoInicial?.nombre || "");
  const [descripcion, setDescripcion] = useState(
    productoInicial?.desc_prod || productoInicial?.descripcion || "",
  );
  const [precio, setPrecio] = useState(productoInicial?.precio_prod || productoInicial?.precio || "");
  const [color, setColor] = useState(productoInicial?.color_prod || "");
  const [peso, setPeso] = useState(productoInicial?.peso_prod || "");
  const [idUnidad, setIdUnidad] = useState(productoInicial?.id_und_medida || "");
  const [idMarca, setIdMarca] = useState(productoInicial?.id_marca || "");
  const [idSubcategoria, setIdSubcategoria] = useState(productoInicial?.id_subcategoria || "");
  const [imagen, setImagen] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    await onSubmit({ 
      nombre, 
      descripcion, 
      precio: parseFloat(precio),
      color,
      peso: parseFloat(peso) || null,
      id_und_medida: parseInt(idUnidad) || null,
      id_marca: parseInt(idMarca) || null,
      id_subcategoria: parseInt(idSubcategoria) || null,
      imagen,
      pdf
    });
    setCargando(false);
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre del producto"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        className="product-form-input"
      />

      <textarea
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        required
        className="product-form-textarea"
      />

      <input
        type="number"
        step="0.01"
        placeholder="Precio"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        required
        className="product-form-input"
      />

      <input
        type="text"
        placeholder="Color (ej: Rojo, Azul, #FFFFFF)"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="product-form-input"
      />

      <input
        type="number"
        step="0.01"
        placeholder="Peso (ej: 1.5)"
        value={peso}
        onChange={(e) => setPeso(e.target.value)}
        className="product-form-input"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImagen(e.target.files[0])}
        className="product-form-input"
      />

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdf(e.target.files[0])}
        className="product-form-input"
        style={{ border: '2px dashed #6c757d', padding: '10px' }}
      />
      <small style={{ color: '#6c757d', marginTop: '-8px' }}>
        📄 Sube una ficha técnica o documento del producto (PDF)
      </small>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button type="submit" disabled={cargando} className="product-form-button">
          {cargando ? "Guardando..." : "Guardar Producto"}
        </button>
        
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="product-form-button"
            style={{ backgroundColor: '#6c757d' }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;