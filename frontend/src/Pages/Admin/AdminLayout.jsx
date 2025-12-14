import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const NavItem = ({ to, label }) => {
  const location = useLocation();
  const active = location.pathname.toLowerCase() === to.toLowerCase();
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 10,
      textDecoration: 'none',
      background: active ? '#f1f5f9' : 'transparent', color: '#111827',
      fontWeight: active ? 700 : 500
    }}>
      {label}
    </Link>
  );
};

const AdminLayout = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 140px)' }}>
      <aside style={{ borderRight: '1px solid #eee', padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Admin</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavItem to="/admin" label="Dashboard" />
          <NavItem to="/admin/add-items" label="Add Items" />
          <NavItem to="/admin/list-items" label="List Items" />
          <NavItem to="/admin/orders" label="Orders" />
        </nav>
      </aside>
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
