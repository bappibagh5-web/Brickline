import {
  CircleHelp,
  FileText,
  FolderOpen,
  GraduationCap,
  House,
  ListChecks,
  MessageSquare,
  PanelLeftClose
} from 'lucide-react';

const iconMap = {
  home: House,
  'loan-requests': FileText,
  'account-documents': FolderOpen,
  messages: MessageSquare,
  tasks: ListChecks,
  resources: GraduationCap
};

export default function Sidebar({ items, activeKey, onSelect }) {
  return (
    <aside className="brickline-sidebar relative flex h-screen w-[280px] shrink-0 flex-col text-white">
      <div className="flex h-[108px] items-center gap-3 border-b border-white/15 px-8">
        <PanelLeftClose size={28} />
        <span className="text-[42px] font-bold tracking-tight">Brickline</span>
      </div>

      <nav className="px-4 pt-6">
        {items.map((item) => {
          const Icon = iconMap[item.key] || House;
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`relative mb-2 flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-[15px] font-semibold transition ${
                active ? 'bg-white/10' : 'hover:bg-white/10'
              }`}
            >
              <span
                className={`absolute left-0 h-10 w-1 rounded-r ${
                  active ? 'bg-white' : 'bg-transparent'
                }`}
              />
              <Icon size={23} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-auto rounded-full bg-[#f15c58] px-2 py-[2px] text-[11px] font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/20 px-4 py-6">
        <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-semibold hover:bg-white/10">
          <GraduationCap size={22} />
          Resources
        </button>
        <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-semibold hover:bg-white/10">
          <CircleHelp size={22} />
          Help & Feedback
        </button>
      </div>
    </aside>
  );
}
