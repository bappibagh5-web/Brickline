export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-[#dbe0ee] bg-[#f0f3fb]">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`px-5 py-3 text-[16px] font-semibold transition ${
            tab === active
              ? 'bg-[#edf2ff] text-[#2750e6] shadow-[inset_0_-3px_0_#2750e6]'
              : 'text-[#373f61] hover:bg-[#e8edf9]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
