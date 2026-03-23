import { Search } from 'lucide-react';
import Card from '../components/Card.jsx';
import LoanCard from '../components/LoanCard.jsx';
import Tabs from '../components/Tabs.jsx';
import PageVariantToggle from '../components/PageVariantToggle.jsx';

const LOAN_TABS = ['Active', 'Drafts', 'Submitted', 'Closed', 'All'];

function EmptyState() {
  return (
    <Card className="min-h-[620px] p-10">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="h-52 w-72 rounded-[40px] bg-[#eaf2ff]" />
        <h3 className="mt-8 text-[46px] font-bold text-[#1f2747]">No active loan requests</h3>
        <p className="mt-4 text-[20px] text-[#5d688b]">
          You do not have any loan requests in this view yet.
        </p>
        <p className="text-[20px] text-[#5d688b]">
          Start a new request when you are ready to submit your next deal.
        </p>
      </div>
    </Card>
  );
}

function FilledState({ loan, advisor }) {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <LoanCard loan={loan} />
        </div>
        <Card className="p-6 xl:col-span-3">
          <h3 className="text-[32px] font-bold text-[#1f2747]">Assigned Advisor</h3>
          <div className="mt-5 flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#becbe2] to-[#f1d7d3]" />
            <div>
              <p className="text-[21px] font-semibold text-[#222d52]">{advisor.name}</p>
              <p className="text-[16px] text-[#5f6b8f]">{advisor.role}</p>
            </div>
          </div>
          <p className="mt-5 text-[16px] leading-relaxed text-[#5d688b]">{advisor.note}</p>
          <button className="mt-6 w-full rounded-xl border border-[#b9c9f3] bg-[#f1f5ff] py-3 text-[20px] font-semibold text-[#304fbe]">
            Chat with me
          </button>
        </Card>
      </div>
    </Card>
  );
}

export default function LoanRequestsPage({ variant, onVariantChange, loan, advisor }) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="section-title">Loan Requests</h1>
        <PageVariantToggle value={variant} options={['filled', 'empty']} onChange={onVariantChange} />
      </div>
      <div className="mb-5 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
        <Tabs tabs={LOAN_TABS} active="Active" onChange={() => {}} />
        <div className="relative w-full lg:w-[420px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7b86a8]" />
          <input
            className="h-12 w-full rounded-xl border border-[#dde2ef] bg-white pl-12 pr-4 text-[16px] text-[#2d375a] placeholder:text-[#8f96b4]"
            placeholder="Search by property address"
          />
        </div>
      </div>

      {variant === 'empty' ? <EmptyState /> : <FilledState loan={loan} advisor={advisor} />}
    </section>
  );
}
