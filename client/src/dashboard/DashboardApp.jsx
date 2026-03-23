import { useMemo, useState } from 'react';
import Card from './components/Card.jsx';
import DashboardLayout from './layout/DashboardLayout.jsx';
import { NAV_ITEMS, UI_VARIANTS, advisor, loan_applications, message_threads, messages, recentActivity, conditions } from './data/mockData.js';
import HomePage from './pages/HomePage.jsx';
import LoanRequestsPage from './pages/LoanRequestsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import TasksPage from './pages/TasksPage.jsx';

function PlaceholderPage({ title }) {
  return (
    <Card className="flex min-h-[480px] items-center justify-center">
      <p className="text-2xl font-semibold text-[#4f5a7d]">{title} page placeholder</p>
    </Card>
  );
}

export default function DashboardApp({ activePage, onPageChange, onLogout, userEmail }) {
  const [variants, setVariants] = useState(UI_VARIANTS);

  const handleVariantChange = (page, variant) => {
    setVariants((prev) => ({ ...prev, [page]: variant }));
  };

  const page = useMemo(() => {
    if (activePage === 'home') {
      return (
        <HomePage
          variant={variants.home}
          onVariantChange={(variant) => handleVariantChange('home', variant)}
          loan={loan_applications[0]}
          recentActivity={recentActivity}
        />
      );
    }

    if (activePage === 'loan-requests') {
      return (
        <LoanRequestsPage
          variant={variants['loan-requests']}
          onVariantChange={(variant) => handleVariantChange('loan-requests', variant)}
          loan={loan_applications[0]}
          advisor={advisor}
        />
      );
    }

    if (activePage === 'messages') {
      return (
        <MessagesPage
          variant={variants.messages}
          onVariantChange={(variant) => handleVariantChange('messages', variant)}
          threads={message_threads}
          chatMessages={messages}
        />
      );
    }

    if (activePage === 'tasks') {
      return (
        <TasksPage
          variant={variants.tasks}
          onVariantChange={(variant) => handleVariantChange('tasks', variant)}
          tasks={conditions}
        />
      );
    }

    if (activePage === 'account-documents') {
      return <PlaceholderPage title="Account Documents" />;
    }

    if (activePage === 'resources') {
      return <PlaceholderPage title="Resources" />;
    }

    return <PlaceholderPage title="Dashboard" />;
  }, [activePage, variants]);

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      activePage={activePage}
      onPageChange={onPageChange}
      onLogout={onLogout}
      userEmail={userEmail}
    >
      {page}
    </DashboardLayout>
  );
}
