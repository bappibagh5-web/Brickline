import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

export default function DashboardLayout({
  navItems,
  activePage,
  onPageChange,
  onLogout,
  userEmail,
  children
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f6fc]">
      <div className="hidden lg:block">
        <Sidebar items={navItems} activeKey={activePage} onSelect={onPageChange} />
      </div>
      <div className="min-w-0 flex-1">
        <Topbar onLogout={onLogout} userEmail={userEmail} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
