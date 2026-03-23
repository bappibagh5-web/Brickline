import { FileText } from 'lucide-react';

export default function TaskItem({ task, showAction = true }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#eceef5] px-6 py-5 first:border-t-0">
      <div className="flex items-start gap-4">
        <div className="mt-1 rounded-lg border border-[#ccdaf8] bg-[#edf4ff] p-2 text-[#4f6fe3]">
          <FileText size={15} />
        </div>
        <div>
          <h4 className="text-[22px] font-semibold text-[#283153]">{task.title}</h4>
          <p className="mt-1 text-[16px] text-[#6f7899]">{task.loanMeta}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded-lg bg-[#eef0f4] px-3 py-1 text-[14px] font-semibold text-[#4c5575]">
              {task.taskType}
            </span>
            <span className="text-[16px] text-[#687394]">Due: {task.dueLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-[17px] text-[#5b668a]">{task.dueLabel}</span>
        {showAction ? (
          <button className="topbar-btn !rounded-lg !px-7 !py-2">{task.cta}</button>
        ) : (
          <span className="h-3 w-36 rounded-full bg-[#f2f4fa]" />
        )}
      </div>
    </div>
  );
}
