import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import RoleDashboard from './RoleDashboard.jsx';

export default function Admin() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <RoleDashboard
      routePath="/admin"
      title="Admin Dashboard"
      userEmail={user?.email || ''}
      onLogout={handleLogout}
      cards={[
        { label: 'Total Applications', value: 128 },
        { label: 'Pending Review', value: 24, tone: 'warning' },
        { label: 'Conditions Open', value: 37 }
      ]}
    />
  );
}
