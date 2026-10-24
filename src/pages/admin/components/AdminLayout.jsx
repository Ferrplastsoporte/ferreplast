import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "../Css/admin.css";

function AdminLayout() {
  return (
    <div className="admin-layout barra-lateral-admin-estructura">
      <AdminSidebar />

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
