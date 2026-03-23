import { CheckCircle2, Circle, Clock3, ChevronRight } from 'lucide-react';
import Card from '../components/Card.jsx';
import LoanCard from '../components/LoanCard.jsx';
import PageVariantToggle from '../components/PageVariantToggle.jsx';

function HomeEmptyState() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Card className="overflow-hidden xl:col-span-9">
        <div className="flex min-h-[260px] items-center">
          <div className="w-[58%] p-8">
            <h2 className="text-[46px] font-bold text-[#1f2747]">Finish your onboarding</h2>
            <p className="mt-3 text-[20px] leading-relaxed text-[#4f5b7d]">
              Complete your setup to unlock loan requests, upload documents, and move faster
              when you are ready to submit a deal.
            </p>
            <button className="topbar-btn mt-7 !rounded-lg !px-8 !py-3">Complete Onboarding</button>
          </div>
          <div className="flex h-full flex-1 items-center justify-center bg-[#e6f2ff]">
            <div className="h-44 w-44 rounded-full bg-[#d0e7ff]" />
          </div>
        </div>
      </Card>

      <Card className="p-6 xl:col-span-3">
        <div className="flex items-center justify-between">
            <h3 className="text-[35px] font-bold text-[#1f2747]">Onboarding Checklist</h3>
        </div>
        <div className="mt-5 space-y-5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-1 text-[#5cb280]" />
            <div>
              <p className="text-[19px] font-semibold text-[#2c3658]">Complete Your Profile</p>
              <p className="text-[15px] text-[#6e7898]">Fill out your business and contact details</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="mt-1 text-[#5cb280]" />
            <div>
              <p className="text-[19px] font-semibold text-[#2c3658]">Upload Required Documents</p>
              <p className="text-[15px] text-[#6e7898]">Upload your ID and business documents</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Circle className="mt-1 text-[#c9cfdf]" />
            <div>
              <p className="text-[19px] font-semibold text-[#2c3658]">Start Your First Loan Request</p>
              <p className="text-[15px] text-[#6e7898]">Apply for your first investment property loan</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden text-center xl:col-span-9">
        <div className="border-b border-[#e8ebf3] p-5">
          <button className="topbar-btn !rounded-lg !px-8 !py-3">Start New Loan</button>
        </div>
        <div className="px-8 py-12">
          <h3 className="text-[46px] font-bold text-[#1e2748]">No Loan Requests Yet</h3>
          <p className="mt-4 text-[20px] text-[#606c8e]">
            You are all set up. When you are ready to start a loan request, click the button above.
          </p>
          <div className="mx-auto mt-8 h-44 w-64 rounded-[36px] bg-[#e8f0ff]" />
        </div>
      </Card>

      <Card className="min-h-[240px] xl:col-span-3 xl:min-h-[350px]" />
    </div>
  );
}

function HomeFilledState({ loan, recentActivity }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Card className="p-6 xl:col-span-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[31px] font-bold text-[#1f2747]">Active Loan Requests</h3>
            <p className="mt-3 text-[24px] text-[#313d62]">
              <span className="font-bold">1</span> active
            </p>
          </div>
          <ChevronRight className="text-[#8a93b1]" />
        </div>
      </Card>
      <Card className="p-6 xl:col-span-7">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[31px] font-bold text-[#1f2747]">Open Tasks</h3>
            <p className="mt-3 text-[24px] text-[#313d62]">
              <span className="font-bold text-[#b53f3a]">2</span> items need attention
            </p>
          </div>
          <ChevronRight className="text-[#8a93b1]" />
        </div>
      </Card>

      <div className="xl:col-span-8">
        <div className="mb-3 text-[36px] font-bold text-[#1f2747]">Your Active Loan</div>
        <LoanCard loan={loan} compact />
      </div>

      <Card className="p-6 xl:col-span-4">
        <h3 className="text-[36px] font-bold text-[#1f2747]">Recent Activity</h3>
        <div className="mt-5 space-y-5">
          {recentActivity.map((item) => (
            <div key={item.id} className="border-t border-[#edf0f6] pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-3">
                <Clock3 size={20} className="text-[#7c87a9]" />
                <p className="text-[19px] font-semibold text-[#2d375a]">{item.title}</p>
              </div>
              {item.subtitle ? <p className="pl-8 text-[15px] text-[#6f7898]">{item.subtitle}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function HomePage({ variant, onVariantChange, loan, recentActivity }) {
  return (
    <section>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="section-title">{variant === 'empty' ? 'Welcome to Brickline, Jane!' : 'Welcome back, Jane'}</h1>
          <p className="mt-3 text-[20px] text-[#515c7f]">
            Let&apos;s get you set up for real estate investment success.
          </p>
        </div>
        <PageVariantToggle value={variant} options={['filled', 'empty']} onChange={onVariantChange} />
      </div>

      {variant === 'empty' ? (
        <HomeEmptyState />
      ) : (
        <HomeFilledState loan={loan} recentActivity={recentActivity} />
      )}
    </section>
  );
}
