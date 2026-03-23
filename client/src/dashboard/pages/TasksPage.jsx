import { CheckCheck, Clock3, ListTodo } from 'lucide-react';
import Card from '../components/Card.jsx';
import TaskItem from '../components/TaskItem.jsx';
import PageVariantToggle from '../components/PageVariantToggle.jsx';

function SummaryCard({ icon: Icon, title, value, tint }) {
  return (
    <Card className={`flex items-center gap-4 p-6 ${tint}`}>
      <div className="rounded-xl bg-white/70 p-3">
        <Icon className="text-[#4f61a2]" />
      </div>
      <div>
        <p className="text-[21px] font-semibold text-[#2e385d]">{title}</p>
        <p className="text-[34px] font-bold text-[#1f2747]">{value}</p>
      </div>
    </Card>
  );
}

function EmptyTasks() {
  return (
    <Card className="min-h-[620px] p-12">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="h-52 w-72 rounded-[38px] bg-[#eaf2ff]" />
        <h3 className="mt-8 text-[46px] font-bold text-[#1f2747]">No tasks right now</h3>
        <p className="mt-4 max-w-5xl text-[20px] leading-relaxed text-[#5e688c]">
          You are all caught up. When a document, form section, signature, or next step needs your
          attention, it will show up here.
        </p>
        <button className="topbar-btn mt-8 !rounded-lg !px-8 !py-3">View Loan Requests</button>
      </div>
    </Card>
  );
}

function FilledTasks({ tasks }) {
  const attention = tasks.filter((task) => task.section === 'attention');
  const comingUp = tasks.filter((task) => task.section === 'coming-up');

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e7ebf4] px-6 py-4">
          <h3 className="text-[30px] font-bold text-[#1f2747]">Needs Attention</h3>
          <p className="text-[16px] text-[#7a84a5]">{attention.length}/5 items</p>
        </div>
        {attention.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e7ebf4] px-6 py-4">
          <h3 className="text-[30px] font-bold text-[#1f2747]">Coming Up</h3>
          <p className="text-[16px] text-[#7a84a5]">{comingUp.length} items</p>
        </div>
        {comingUp.map((task) => (
          <TaskItem key={task.id} task={task} showAction={false} />
        ))}
      </Card>
    </div>
  );
}

export default function TasksPage({ variant, onVariantChange, tasks }) {
  const openCount = variant === 'empty' ? 0 : tasks.filter((task) => task.section === 'attention').length;
  const dueSoonCount = variant === 'empty' ? 0 : 2;
  const completeCount = variant === 'empty' ? 0 : 7;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="section-title">Tasks</h1>
        <PageVariantToggle value={variant} options={['filled', 'empty']} onChange={onVariantChange} />
      </div>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard icon={ListTodo} title="Open" value={openCount} tint="bg-[#eef4ff]" />
        <SummaryCard icon={Clock3} title="Due Soon" value={dueSoonCount} tint="bg-[#faf7ed]" />
        <SummaryCard icon={CheckCheck} title="Completed" value={completeCount} tint="bg-[#eefaf4]" />
      </div>

      {variant === 'empty' ? <EmptyTasks /> : <FilledTasks tasks={tasks} />}
    </section>
  );
}
