import { ChevronLeft, CheckCircle2, Phone } from 'lucide-react';
import { BRAND_LOGOS } from '../lib/brandAssets.js';

function RightPanel() {
  return (
    <aside className="sticky top-0 h-screen w-[40%] min-w-[360px] overflow-hidden rounded-r-[24px] bg-[radial-gradient(circle_at_20%_10%,#1e48ff_0%,#071564_48%,#030a36_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative z-10 flex h-full flex-col px-10 py-8">
        <p className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-white/90">
          <Phone className="h-4 w-4" />
          Need help? 1-844-415-4663
        </p>

        <div className="relative mt-16 flex flex-1 items-center justify-center">
          <div className="h-[300px] w-[460px] rounded-[30px] border border-[#3259ff]/40 bg-[radial-gradient(circle_at_50%_45%,rgba(73,147,255,0.35),rgba(4,18,89,0.2)_55%,transparent_75%)] p-8 shadow-[0_0_80px_rgba(33,104,255,0.45)]">
            <div className="h-full w-full rounded-[20px] border border-[#3f67ff]/40 bg-[radial-gradient(circle,rgba(72,124,255,0.8)_1.3px,transparent_1.4px)] [background-size:16px_16px]" />
          </div>

          <div className="absolute bottom-8 left-1/2 w-[420px] -translate-x-1/2 rounded-2xl border border-white/20 bg-[#0f2d9f]/45 px-7 py-5 backdrop-blur-md">
            <span className="inline-block rounded-full bg-[#2f5cf3] px-4 py-1 text-[12px] font-semibold tracking-wide text-white">
              NATIONWIDE INVESTOR LENDING
            </span>
            <div className="mt-4 flex items-center justify-between gap-5">
              <div>
                <p className="text-[46px] font-extrabold tracking-tight text-white">$2.3B+</p>
                <p className="text-[14px] tracking-[0.14em] text-white/65">FUNDED</p>
              </div>
              <div className="h-14 w-px bg-white/25" />
              <p className="text-[38px] font-medium leading-snug text-white/90">
                Built for speed,
                <br />
                not banks
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function OnboardingLayout({
  children,
  onBack,
  disableBack,
  stepNumber
}) {
  return (
    <div className="min-h-screen bg-[#eef2f8] p-5 lg:p-7">
      <div className="mx-auto flex h-[calc(100vh-40px)] min-w-[1020px] w-full max-w-[1720px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_65px_rgba(15,35,95,0.12)] lg:h-[calc(100vh-56px)]">
        <section className="flex min-w-[560px] w-[60%] flex-col bg-white">
          <div className="px-8 pb-5 pt-6 lg:px-14 lg:pt-8">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <button
                type="button"
                onClick={onBack}
                disabled={disableBack}
                className="inline-flex w-fit items-center gap-2 text-[18px] font-medium text-[#4b5a88] hover:text-[#2f54eb] disabled:opacity-45"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>

              <img
                src={BRAND_LOGOS.mainBlue}
                alt="Brickline"
                className="h-8 w-auto justify-self-center"
              />

              <div />
            </div>

            <div className="mt-6 inline-flex items-center overflow-hidden rounded-full bg-[#dbe4f7]">
              <span className="rounded-full bg-[#2f54eb] px-5 py-2 text-sm font-semibold text-white">
                Step {stepNumber} of 6
              </span>
              <span className="px-5 py-2 text-sm font-medium text-[#6676a1]">Loan Type</span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-8 pb-8 lg:px-14">
            <div className="flex-1">{children}</div>

            <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-3 pb-2 text-base font-medium text-[#5d6c91]">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 fill-[#2f54eb] text-white" />
                No upfront fees
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 fill-[#2f54eb] text-white" />
                Fast closings
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 fill-[#2f54eb] text-white" />
                Investor-focused
              </span>
            </div>
          </div>
        </section>

        <RightPanel />
      </div>
    </div>
  );
}
