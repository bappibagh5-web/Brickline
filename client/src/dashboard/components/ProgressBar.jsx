export default function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#dbe4f5]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#3a58e7] to-[#4f74ff]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
