import { Outlet } from "react-router-dom";
import BodegueroSidebar from "./BodegueroSidebar";
import "../css/bodeguero.css";

function BodegueroLayout() {
  return (
    <div className="bodeguero-layout">
      <BodegueroSidebar />

      <main className="bodeguero-main">
        <Outlet />
      </main>
    </div>
  );
}

export default BodegueroLayout;