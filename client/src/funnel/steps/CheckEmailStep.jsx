import StepLayout from '../StepLayout.jsx';

export default function CheckEmailStep({
  title,
  description,
  onOpenEmail
}) {
  return (
    <StepLayout
      title={title}
      subtitle={description}
      content={(
        <div className="space-y-3">
          <button
            type="button"
            onClick={onOpenEmail}
            className="inline-flex h-12 min-w-[170px] items-center justify-center rounded-lg bg-gradient-to-r from-[#2f54eb] to-[#2145df] px-5 text-base font-semibold text-white transition-all duration-150 hover:brightness-105"
          >
            Open your email
          </button>
          <p className="text-sm text-[#6a7492]">
            Use the secure link in your inbox to continue where you left off.
          </p>
        </div>
      )}
    />
  );
}

