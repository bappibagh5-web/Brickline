export default function StepLayout({
  title,
  subtitle,
  content,
  footer
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="max-w-[860px]">
        <h1 className="text-[clamp(40px,3.6vw,60px)] font-bold leading-[1.08] tracking-[-0.02em] text-[#0b1f57]">
          {title}
        </h1>
        {subtitle ? <p className="mt-3 text-xl leading-relaxed text-[#6b7694]">{subtitle}</p> : null}
      </div>

      <div className="mt-8 w-full max-w-[860px]">{content}</div>
      {footer ? <div className="mt-8 w-full max-w-[860px]">{footer}</div> : null}
    </div>
  );
}
