function BodegueroHeader({ titulo, descripcion = "" }) {
  return (
    <header className="bodeguero-header">
      <div className="bodeguero-header__information">
        <h1>{titulo}</h1>

        {descripcion && <p>{descripcion}</p>}
      </div>

      <div className="bodeguero-header__user">
        <span className="bodeguero-header__role">Bodeguero</span>
      </div>
    </header>
  );
}

export default BodegueroHeader;
