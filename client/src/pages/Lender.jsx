import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import RoleDashboard from './RoleDashboard.jsx';

export default function Lender() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <RoleDashboard
      routePath="/lender"
      title="Lender Dashboard"
      userEmail={user?.email || ''}
      onLogout={handleLogout}
      cards={[
        { label: 'Available Deals', value: 14 },
        { label: 'Submitted Offers', value: 6, tone: 'success' }
      ]}
    />
  );
}
