import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import RoleDashboard from './RoleDashboard.jsx';

export default function Broker() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <RoleDashboard
      routePath="/broker"
      title="Broker Dashboard"
      userEmail={user?.email || ''}
      onLogout={handleLogout}
      cards={[
        { label: 'My Borrowers', value: 22 },
        { label: 'Active Deals', value: 11, tone: 'success' }
      ]}
    />
  );
}
