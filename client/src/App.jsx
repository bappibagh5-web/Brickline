import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import DashboardApp from './dashboard/DashboardApp.jsx';
import { getRoleHomeRoute } from './lib/roleRouting.js';
import Admin from './pages/Admin.jsx';
import Broker from './pages/Broker.jsx';
import Lender from './pages/Lender.jsx';
import Login from './pages/Login.jsx';
import SuperAdmin from './pages/SuperAdmin.jsx';

const ROUTE_TO_PAGE = {
  '/dashboard': 'home',
  '/': 'home',
  '/loan-requests': 'loan-requests',
  '/messages': 'messages',
  '/tasks': 'tasks',
  '/account-documents': 'account-documents',
  '/resources': 'resources'
};

const PAGE_TO_ROUTE = {
  home: '/dashboard',
  'loan-requests': '/loan-requests',
  messages: '/messages',
  tasks: '/tasks',
  'account-documents': '/account-documents',
  resources: '/resources'
};

function DashboardRouteView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const activePage = ROUTE_TO_PAGE[location.pathname] || 'home';

  const handlePageChange = (pageKey) => {
    const route = PAGE_TO_ROUTE[pageKey] || '/dashboard';
    navigate(route);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <DashboardApp
      activePage={activePage}
      onPageChange={handlePageChange}
      onLogout={handleLogout}
      userEmail={user?.email || ''}
    />
  );
}

function DashboardByRole() {
  const { role } = useAuth();

  if (role !== 'borrower') {
    return <Navigate to={getRoleHomeRoute(role)} replace />;
  }

  return <DashboardRouteView />;
}

function RoleHomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={getRoleHomeRoute(role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/dashboard" element={<DashboardByRole />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/super_admin" element={<SuperAdmin />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['lender']} />}>
        <Route path="/lender" element={<Lender />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['broker']} />}>
        <Route path="/broker" element={<Broker />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['borrower']} />}>
        <Route path="/loan-requests" element={<DashboardRouteView />} />
        <Route path="/messages" element={<DashboardRouteView />} />
        <Route path="/tasks" element={<DashboardRouteView />} />
        <Route path="/account-documents" element={<DashboardRouteView />} />
        <Route path="/resources" element={<DashboardRouteView />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
