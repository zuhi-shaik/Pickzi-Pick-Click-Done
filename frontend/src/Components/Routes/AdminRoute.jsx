import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { loadUser, loadToken } from '../../api/client';

const AdminRoute = () => {
  const location = useLocation();
  const token = loadToken();
  const user = loadUser();
  const isAdmin = Boolean(user && (user.isAdmin === true));

  if (!token || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

export default AdminRoute;
