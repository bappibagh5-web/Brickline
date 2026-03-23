import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import RoleDashboard from './RoleDashboard.jsx';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <RoleDashboard
      routePath="/super_admin"
      title="Super Admin Dashboard"
      userEmail={user?.email || ''}
      onLogout={handleLogout}
      cards={[
        { label: 'Total Users', value: 1542 },
        { label: 'Total Loans', value: 486 },
        { label: 'System Status', value: 'Healthy', tone: 'success' }
      ]}
    />
  );
}
