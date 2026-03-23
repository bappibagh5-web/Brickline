export default function PageVariantToggle({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-[#dbe1ef] bg-white p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            option === value
              ? 'bg-[#2f53eb] text-white'
              : 'text-[#5f6b8f] hover:bg-[#f1f4fb]'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
