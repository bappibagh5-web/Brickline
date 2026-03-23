import Card from '../dashboard/components/Card.jsx';
import DashboardLayout from '../dashboard/layout/DashboardLayout.jsx';

const ROLE_NAV_ITEMS = [{ key: 'home', label: 'Home' }];

function StatCard({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'success'
      ? 'bg-[#eefaf4] text-[#2d6b4e]'
      : tone === 'warning'
        ? 'bg-[#fff6e9] text-[#8a5d16]'
        : 'bg-[#eef2ff] text-[#334a9b]';

  return (
    <Card className={`p-6 ${toneClass}`}>
      <p className="text-sm font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </Card>
  );
}

export default function RoleDashboard({
  title,
  cards,
  userEmail,
  onLogout,
  routePath
}) {
  const handlePageChange = () => {
    // Keep role dashboards simple for now; sidebar uses layout consistency.
  };

  return (
    <DashboardLayout
      navItems={ROLE_NAV_ITEMS}
      activePage="home"
      onPageChange={handlePageChange}
      onLogout={onLogout}
      userEmail={userEmail}
    >
      <section>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#6c7899]">{routePath}</p>
        <h1 className="section-title">{title}</h1>
        <p className="mt-2 text-base text-[#5f6b8f]">
          Placeholder data for role-specific overview.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              tone={card.tone}
            />
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
