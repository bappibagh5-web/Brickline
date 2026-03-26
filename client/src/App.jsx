import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import DashboardApp from './dashboard/DashboardApp.jsx';
import { funnelConfig, funnelInitialStepId } from './funnel/config.js';
import { useFunnel } from './funnel/FunnelContext.jsx';
import FunnelStepPage from './funnel/FunnelStepPage.jsx';
import { getStoredApplicationId } from './funnel/session.js';
import { getResumeTargetRoute } from './funnel/utils.js';
import { getApiBaseUrl } from './lib/apiBaseUrl.js';
import { getRoleHomeRoute } from './lib/roleRouting.js';
import Admin from './pages/Admin.jsx';
import Broker from './pages/Broker.jsx';
import Lender from './pages/Lender.jsx';
import Login from './pages/Login.jsx';
import RateCalculatorPage from './pages/RateCalculatorPage.jsx';
import SetPassword from './pages/SetPassword.jsx';
import SuperAdmin from './pages/SuperAdmin.jsx';

const ROUTE_TO_PAGE = {
  '/dashboard': 'home',
  '/': 'home',
  '/loan-requests': 'loan-requests',
  '/documents': 'documents',
  '/messages': 'messages',
  '/tasks': 'tasks',
  '/resources': 'resources'
};

const PAGE_TO_ROUTE = {
  home: '/dashboard',
  'loan-requests': '/loan-requests',
  documents: '/documents',
  messages: '/messages',
  tasks: '/tasks',
  resources: '/resources'
};

function DashboardRouteView() {
  const apiBaseUrl = getApiBaseUrl();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hydrateAnswers } = useFunnel();
  const [liveLoanApplications, setLiveLoanApplications] = useState([]);

  const activePage = ROUTE_TO_PAGE[location.pathname] || 'home';

  const handlePageChange = (pageKey) => {
    const route = PAGE_TO_ROUTE[pageKey] || '/dashboard';
    navigate(route);
  };

  const handleStartNewLoan = () => {
    navigate('/get-rate/loan-program');
  };

  const handleGoResources = () => {
    navigate('/resources');
  };

  const handleContinueLoan = async () => {
    const applicationId = getStoredApplicationId();
    if (!applicationId) {
      navigate('/get-rate/loan-program');
      return;
    }

    const applicationResponse = await fetch(`${apiBaseUrl}/applications/${applicationId}`);
    if (applicationResponse.ok) {
      const applicationPayload = await applicationResponse.json().catch(() => ({}));
      if (applicationPayload?.status === 'submitted') {
        navigate('/loan-requests?tab=submitted');
        return;
      }
    }

    const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/resume`);
    if (!response.ok) {
      navigate('/get-rate/loan-program');
      return;
    }

    const payload = await response.json();
    if (payload?.data && typeof payload.data === 'object') {
      hydrateAnswers(payload.data);
    }

    const route = getResumeTargetRoute(payload?.last_step, payload?.data || {}, {
      isAuthenticated: Boolean(user)
    });
    if (!route) {
      navigate('/get-rate/loan-program');
      return;
    }

    navigate(`${route}?applicationId=${applicationId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    let ignore = false;

    const resumeApplicationIfNeeded = async () => {
      if (location.pathname !== '/dashboard') return;

      const applicationId = getStoredApplicationId();
      if (!applicationId) return;

      const applicationResponse = await fetch(`${apiBaseUrl}/applications/${applicationId}`);
      if (!applicationResponse.ok) return;
      const applicationPayload = await applicationResponse.json().catch(() => ({}));
      if (applicationPayload?.status === 'submitted') return;

      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/resume`);

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      if (ignore) return;

      if (payload?.data && typeof payload.data === 'object') {
        hydrateAnswers(payload.data);
      }

      const route = getResumeTargetRoute(payload?.last_step, payload?.data || {}, {
        isAuthenticated: Boolean(user)
      });
      if (!route) return;

      navigate(`${route}?applicationId=${applicationId}`, { replace: true });
    };

    resumeApplicationIfNeeded();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, hydrateAnswers, location.pathname, navigate, user]);

  useEffect(() => {
    let ignore = false;

    const loadDashboardLoan = async () => {
      const applicationId = getStoredApplicationId();
      if (!applicationId) return;

      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`);
      if (!response.ok || ignore) return;

      const payload = await response.json();
      const data = payload?.application_data || {};

      const mapStatus = (status) => {
        if (status === 'submitted') return 'Submitted';
        if (status === 'lead') return 'Draft';
        if (status === 'closed') return 'Closed';
        return 'In Progress';
      };

      const mapLoanType = (loanProgram) => {
        if (loanProgram === 'new_construction') return 'New Construction Loan';
        if (loanProgram === 'rental') return 'Rental Loan';
        return 'Fix & Flip Loan';
      };

      const borrowerName = data?.name
        || `${data?.first_name || ''} ${data?.last_name || ''}`.trim()
        || 'Borrower';

      const totalLoanAmount = Number(
        data?.submission_snapshot?.calculator?.total_loan
        || data?.total_loan
        || data?.selected_loan_product?.total_loan
        || 0
      );

      const mappedLoan = {
        id: payload.id,
        loanType: mapLoanType(data?.loan_program),
        address:
          data?.finance_property_full_address
          || data?.purchase_property_full_address
          || data?.lead_property_full_address
          || data?.property_address
          || 'Address pending',
        amountRequested: totalLoanAmount,
        progress: payload.status === 'submitted' ? 100 : 75,
        status: mapStatus(payload.status),
        lastUpdated: 'recently',
        nextStep: payload.status === 'submitted' ? 'Underwriting Review' : 'Complete application',
        borrowerName
      };

      setLiveLoanApplications([mappedLoan]);
    };

    loadDashboardLoan();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, location.key]);

  return (
    <DashboardApp
      activePage={activePage}
      onPageChange={handlePageChange}
      onLogout={handleLogout}
      onStartNewLoan={handleStartNewLoan}
      onGoResources={handleGoResources}
      onContinueLoan={handleContinueLoan}
      userEmail={user?.email || ''}
      liveLoanApplications={liveLoanApplications}
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
      <Route path="/m/*" element={<FunnelStepPage />} />
      <Route path="/check-email" element={<FunnelStepPage />} />
      <Route
        path="/get-rate"
        element={<Navigate to={funnelConfig[funnelInitialStepId].route} replace />}
      />
      <Route
        path="/get-rate/loan-program"
        element={<Navigate to={funnelConfig[funnelInitialStepId].route} replace />}
      />
      <Route path="/set-password" element={<SetPassword />} />
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
        <Route path="/documents" element={<DashboardRouteView />} />
        <Route path="/account-documents" element={<Navigate to="/documents" replace />} />
        <Route path="/messages" element={<DashboardRouteView />} />
        <Route path="/tasks" element={<DashboardRouteView />} />
        <Route path="/resources" element={<DashboardRouteView />} />
        <Route path="/standardBorrower/*" element={<FunnelStepPage />} />
        <Route path="/proBorrower/*" element={<FunnelStepPage />} />
        <Route path="/rate-calculator" element={<RateCalculatorPage />} />
        <Route path="/rate-calculator/:applicationId/hard-money" element={<RateCalculatorPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
