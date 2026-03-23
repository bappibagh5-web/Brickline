import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getRoleHomeRoute } from '../lib/roleRouting.js';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9e2ff] border-t-[#2f53eb]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHomeRoute(role)} replace />;
  }

  return <Outlet />;
}
